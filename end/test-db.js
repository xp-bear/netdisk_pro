import { createConnection } from 'mysql2/promise'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 手动解析.env文件
function loadEnv() {
  const envPath = resolve(__dirname, '.env')
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

async function testDatabase() {
  let connection
  
  try {
    const env = loadEnv()
    console.log('数据库配置:')
    console.log('  Host:', env.DB_HOST)
    console.log('  User:', env.DB_USER)
    console.log('  Database:', env.DB_NAME)
    console.log()

    console.log('正在连接数据库...')
    connection = await createConnection({
      host: env.DB_HOST || 'localhost',
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME || 'netdisk'
    })

    console.log('✓ 数据库连接成功\n')

    // 检查表
    const [tables] = await connection.query('SHOW TABLES')
    console.log(`📋 数据库表数量: ${tables.length}`)
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log('  -', Object.values(table)[0])
      })
    }
    console.log()

    // 检查users表是否存在
    const tableName = `Tables_in_${env.DB_NAME || 'netdisk'}`
    const hasUsers = tables.some(t => t[tableName] === 'users')
    const hasFiles = tables.some(t => t[tableName] === 'files')

    if (hasUsers) {
      const [users] = await connection.query('SELECT id, username, nickname FROM users')
      console.log(`👥 用户表记录数: ${users.length}`)
      if (users.length > 0) {
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}`)
        })
      }
    } else {
      console.log('⚠️  users表不存在，需要先运行迁移脚本')
    }
    console.log()

    if (hasFiles) {
      const [files] = await connection.query('SELECT COUNT(*) as count FROM files')
      console.log(`📁 文件表记录数: ${files[0].count}`)
    } else {
      console.log('⚠️  files表不存在')
    }

    console.log('\n✅ 数据库检查完成')

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('数据库不存在，请先创建数据库或运行初始化脚本')
    } else if (error.code === 'ECONNREFUSED') {
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

testDatabase()
