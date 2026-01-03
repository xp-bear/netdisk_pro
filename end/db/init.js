import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export async function initDatabase() {
  try {
    // 创建数据库连接（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    })

    // 创建数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'netdisk'} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log('Database created or already exists')

    // 使用数据库
    await connection.query(`USE ${process.env.DB_NAME || 'netdisk'}`)

    // 创建文件夹表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        parent_id INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('Folders table created or already exists')

    // 创建文件表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        oss_path VARCHAR(500) NOT NULL,
        size BIGINT DEFAULT 0,
        file_type VARCHAR(50) DEFAULT 'other',
        parent_id INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id),
        INDEX idx_file_type (file_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('Files table created or already exists')

    await connection.end()
    console.log('Database initialization completed')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}
