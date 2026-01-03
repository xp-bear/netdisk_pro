import mysql from 'mysql2/promise'
import fs from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 手动解析.env文件
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env')
  const envContent = readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  return env
}

const ENV = loadEnv()

/**
 * 文件类型映射
 * 原始类型: 0-图片  1-视频  2-音乐 3-压缩包 4-安装包 5-代码文本 6-记事本 7-office文件 8-其他文件
 */
const fileTypeMap = {
  0: 'image',
  1: 'video',
  2: 'audio',
  3: 'archive',
  4: 'application',
  5: 'code',
  6: 'text',
  7: 'document',
  8: 'other'
}

/**
 * 从SQL文件中解析INSERT语句
 */
function parseInsertStatements(sqlContent) {
  const insertPattern = /INSERT INTO `file` VALUES \(([^)]+)\);/g
  const records = []
  let match

  while ((match = insertPattern.exec(sqlContent)) !== null) {
    try {
      // 解析VALUES中的数据
      const valuesStr = match[1]
      const values = parseValues(valuesStr)
      
      if (values && values.length >= 15) {
        records.push({
          file_id: values[0],
          file_createtime: values[1],
          file_type: values[2],
          file_name: values[3],
          file_suffix: values[4],
          file_link: values[5],
          file_size: values[6],
          file_region: values[7],
          file_user_id: values[8],
          file_user_name: values[9],
          file_likes: values[10],
          file_views: values[11],
          file_remark: values[12],
          file_address: values[13],
          file_public: values[14]
        })
      }
    } catch (error) {
      console.error('解析记录失败:', error.message)
    }
  }

  return records
}

/**
 * 解析SQL VALUES语句中的值
 */
function parseValues(valuesStr) {
  const values = []
  let current = ''
  let inString = false
  let escapeNext = false

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i]

    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === "'") {
      if (inString) {
        // 检查是否是连续的两个单引号（SQL转义）
        if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
          current += "'"
          i++ // 跳过下一个单引号
          continue
        }
        inString = false
      } else {
        inString = true
      }
      continue
    }

    if (char === ',' && !inString) {
      values.push(parseValue(current.trim()))
      current = ''
      continue
    }

    current += char
  }

  // 添加最后一个值
  if (current.trim()) {
    values.push(parseValue(current.trim()))
  }

  return values
}

/**
 * 解析单个值
 */
function parseValue(value) {
  if (value === 'NULL' || value === '') {
    return null
  }
  
  // 移除引号
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1)
  }
  
  // 尝试转换为数字
  const num = Number(value)
  if (!isNaN(num)) {
    return num
  }
  
  return value
}

/**
 * 导入文件数据到数据库
 */
async function importFileData() {
  let connection
  
  try {
    console.log('🚀 开始导入文件数据...\n')

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', '..', 'file.sql')
    console.log('📖 正在读取SQL文件:', sqlFilePath)
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8')
    console.log('✓ SQL文件读取成功\n')

    // 解析INSERT语句
    console.log('🔍 正在解析SQL数据...')
    const records = parseInsertStatements(sqlContent)
    console.log(`✓ 解析完成，共找到 ${records.length} 条记录\n`)

    // 连接数据库
    connection = await mysql.createConnection({
      host: ENV.DB_HOST || 'localhost',
      user: ENV.DB_USER || 'root',
      password: ENV.DB_PASSWORD || '',
      database: ENV.DB_NAME || 'netdisk'
    })
    console.log('✓ 数据库连接成功\n')

    // 开始事务
    await connection.beginTransaction()

    // 创建临时文件映射表（用于存储原始file_id到新id的映射）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS file_import_mapping (
        old_id INT PRIMARY KEY,
        new_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    // 确保用户表有数据
    const [users] = await connection.query('SELECT id, username, nickname FROM users ORDER BY id')
    console.log(`📊 找到 ${users.length} 个用户账户`)
    
    if (users.length === 0) {
      console.log('⚠️  警告: 用户表为空，请先运行用户迁移脚本')
      await connection.rollback()
      return
    }

    // 创建用户ID映射（原始用户ID -> 数据库用户ID）
    // 根据用户名称来智能映射
    const userIdMap = new Map()
    
    // 查找对应的用户
    const coderxpUser = users.find(u => u.username.includes('coderxp') || u.nickname?.includes('coderxp') || u.id === 1)
    const qianyinUser = users.find(u => u.username === 'qianyin' || u.nickname === '浅呤')
    const xuyaoUser = users.find(u => u.username === 'xuyao' || u.nickname === '徐瑶')
    
    // 原始文件中的用户ID映射
    // 1 = coderxp@qq.com
    // 2 = 浅呤
    // 3 = 徐瑶
    userIdMap.set(1, coderxpUser?.id || users[0]?.id || 1)
    userIdMap.set(2, qianyinUser?.id || users[1]?.id || 1)
    userIdMap.set(3, xuyaoUser?.id || users[2]?.id || 1)

    console.log('用户映射关系:')
    userIdMap.forEach((localId, originalId) => {
      const user = users.find(u => u.id === localId)
      const originalName = originalId === 1 ? 'coderxp@qq.com' : originalId === 2 ? '浅呤' : '徐瑶'
      console.log(`  原始用户ID ${originalId} (${originalName}) -> 数据库用户ID ${localId} (${user?.username || '未知'})`)
    })
    console.log()

    // 导入数据
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    console.log('📥 开始导入数据...\n')

    for (const record of records) {
      try {
        // 映射用户ID
        const userId = userIdMap.get(record.file_user_id) || users[0].id

        // 提取文件名（不含后缀）
        let fileName = record.file_name
        if (record.file_suffix) {
          fileName = fileName + record.file_suffix
        }

        // 映射文件类型
        const fileType = fileTypeMap[record.file_type] || 'other'

        // 构建OSS路径（从URL中提取）
        let ossPath = ''
        if (record.file_link) {
          const urlMatch = record.file_link.match(/aliyuncs\.com\/(.+?)\?/)
          ossPath = urlMatch ? urlMatch[1] : record.file_link
        }

        // 检查文件是否已存在（通过URL或OSS路径）
        const [existing] = await connection.query(
          'SELECT id FROM files WHERE url = ? OR oss_path = ? LIMIT 1',
          [record.file_link, ossPath]
        )

        if (existing.length > 0) {
          skipCount++
          continue
        }

        // 插入文件记录
        const [result] = await connection.query(`
          INSERT INTO files (
            name, 
            url, 
            oss_path, 
            size, 
            file_type, 
            parent_id, 
            user_id, 
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          fileName,
          record.file_link,
          ossPath,
          parseInt(record.file_size) || 0,
          fileType,
          0, // 默认放在根目录
          userId,
          record.file_createtime || new Date()
        ])

        // 记录ID映射
        await connection.query(
          'INSERT IGNORE INTO file_import_mapping (old_id, new_id) VALUES (?, ?)',
          [record.file_id, result.insertId]
        )

        successCount++
        
        // 每100条记录显示一次进度
        if (successCount % 100 === 0) {
          console.log(`  已导入 ${successCount} 条记录...`)
        }

      } catch (error) {
        errorCount++
        console.error(`❌ 导入记录失败 (ID: ${record.file_id}):`, error.message)
      }
    }

    // 提交事务
    await connection.commit()
    console.log('\n✅ 数据导入完成！')
    console.log('\n📊 导入统计:')
    console.log(`  ✓ 成功导入: ${successCount} 条`)
    console.log(`  ⊗ 跳过重复: ${skipCount} 条`)
    console.log(`  ✗ 导入失败: ${errorCount} 条`)
    console.log(`  📝 总计: ${records.length} 条`)

    // 显示数据库统计
    const [fileCount] = await connection.query('SELECT COUNT(*) as count FROM files')
    console.log(`\n📦 当前数据库文件总数: ${fileCount[0].count}`)

  } catch (error) {
    console.error('\n❌ 导入失败:', error)
    if (connection) {
      await connection.rollback()
    }
    throw error
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n✓ 数据库连接已关闭')
    }
  }
}

// 执行导入
importFileData().catch(error => {
  console.error('执行失败:', error)
  process.exit(1)
})
