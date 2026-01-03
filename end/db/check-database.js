import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

async function checkDatabase() {
  let connection
  
  try {
    console.log('正在连接数据库...')
    console.log('配置信息:')
    console.log('  Host:', process.env.DB_HOST || 'localhost')
    console.log('  User:', process.env.DB_USER || 'root')
    console.log('  Database:', process.env.DB_NAME || 'netdisk')
    console.log()

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'netdisk'
    })

    console.log('✓ 数据库连接成功\n')

    // 检查表
    const [tables] = await connection.query('SHOW TABLES')
    console.log('📋 数据库表列表:')
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0])
    })
    console.log()

    // 检查users表
    const [users] = await connection.query('SELECT id, username, nickname FROM users')
    console.log(`👥 用户表记录数: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}`)
    })
    console.log()

    // 检查files表
    const [files] = await connection.query('SELECT COUNT(*) as count FROM files')
    console.log(`📁 文件表记录数: ${files[0].count}`)
    console.log()

    console.log('✅ 数据库检查完成')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    console.error('完整错误信息:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

checkDatabase()
