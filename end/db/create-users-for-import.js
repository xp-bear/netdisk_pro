import { createConnection } from 'mysql2/promise'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 手动解析.env文件
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env')
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

async function createUsers() {
  let connection
  
  try {
    console.log('🔐 开始创建用户账户...\n')

    connection = await createConnection({
      host: ENV.DB_HOST || 'localhost',
      user: ENV.DB_USER || 'root',
      password: ENV.DB_PASSWORD || '',
      database: ENV.DB_NAME || 'netdisk'
    })

    console.log('✓ 数据库连接成功\n')

    // 需要创建的用户列表（基于file.sql中的用户）
    const users = [
      {
        id: 1,
        username: 'coderxp@qq.com',
        password: 'admin123',
        nickname: 'coderxp@qq.com',
        email: 'coderxp@qq.com',
        storage_limit: 107374182400 // 100GB
      },
      {
        id: 2,
        username: 'qianyin',
        password: 'admin123',
        nickname: '浅呤',
        email: 'qianyin@example.com',
        storage_limit: 53687091200 // 50GB
      },
      {
        id: 3,
        username: 'xuyao',
        password: 'admin123',
        nickname: '徐瑶',
        email: 'xuyao@example.com',
        storage_limit: 53687091200 // 50GB
      }
    ]

    console.log('📝 准备创建以下用户:\n')
    users.forEach(user => {
      console.log(`  - ${user.nickname} (${user.username})`)
    })
    console.log()

    let createdCount = 0
    let existingCount = 0

    for (const user of users) {
      try {
        // 检查用户是否已存在
        const [existing] = await connection.query(
          'SELECT id, username FROM users WHERE username = ? OR id = ?',
          [user.username, user.id]
        )

        if (existing.length > 0) {
          console.log(`  ⊗ 用户已存在: ${user.nickname} (${user.username})`)
          existingCount++
          continue
        }

        // 加密密码
        const hashedPassword = crypto.createHash('sha256').update(user.password).digest('hex')

        // 插入用户
        await connection.query(`
          INSERT INTO users (id, username, password, nickname, email, storage_limit, storage_used, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
        `, [user.id, user.username, hashedPassword, user.nickname, user.email, user.storage_limit])

        console.log(`  ✓ 创建成功: ${user.nickname} (${user.username})`)
        createdCount++

      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⊗ 用户已存在: ${user.nickname} (${user.username})`)
          existingCount++
        } else {
          console.error(`  ✗ 创建失败: ${user.nickname}`, error.message)
        }
      }
    }

    console.log('\n📊 用户创建统计:')
    console.log(`  ✓ 新创建: ${createdCount} 个`)
    console.log(`  ⊗ 已存在: ${existingCount} 个`)
    console.log(`  📝 总计: ${users.length} 个`)

    // 显示当前所有用户
    const [allUsers] = await connection.query('SELECT id, username, nickname FROM users ORDER BY id')
    console.log('\n👥 当前数据库用户列表:')
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}`)
    })

    console.log('\n✅ 用户创建完成！')
    console.log('\n💡 默认密码均为: admin123')

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.error('无法连接到MySQL服务器，请确保MySQL正在运行')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('访问被拒绝，请检查用户名和密码')
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

createUsers()
