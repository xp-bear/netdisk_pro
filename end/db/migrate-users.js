import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 数据库迁移：创建用户表
export async function migrateUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'netdisk'
    })

    console.log('开始创建用户表...')

    // 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
        password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
        email VARCHAR(100) UNIQUE COMMENT '邮箱',
        nickname VARCHAR(50) COMMENT '昵称',
        avatar VARCHAR(500) COMMENT '头像URL',
        storage_limit BIGINT DEFAULT 10737418240 COMMENT '存储空间限制（字节）默认10GB',
        storage_used BIGINT DEFAULT 0 COMMENT '已使用空间（字节）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
    `)
    console.log('✓ 用户表创建成功')

    // 为现有的文件夹表添加 user_id 字段
    const [folderColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'folders' AND COLUMN_NAME = 'user_id'
    `, [process.env.DB_NAME || 'netdisk'])

    if (folderColumns.length === 0) {
      await connection.query(`
        ALTER TABLE folders 
        ADD COLUMN user_id INT DEFAULT 1 COMMENT '用户ID'
      `)
      console.log('✓ 文件夹表添加 user_id 字段成功')

      // 添加外键
      await connection.query(`
        ALTER TABLE folders 
        ADD CONSTRAINT fk_folders_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `)
      console.log('✓ 文件夹表外键添加成功')
    }

    // 为现有的文件表添加 user_id 字段
    const [fileColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'files' AND COLUMN_NAME = 'user_id'
    `, [process.env.DB_NAME || 'netdisk'])

    if (fileColumns.length === 0) {
      await connection.query(`
        ALTER TABLE files 
        ADD COLUMN user_id INT DEFAULT 1 COMMENT '用户ID'
      `)
      console.log('✓ 文件表添加 user_id 字段成功')

      // 添加外键
      await connection.query(`
        ALTER TABLE files 
        ADD CONSTRAINT fk_files_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `)
      console.log('✓ 文件表外键添加成功')
    }

    // 创建默认管理员账户（用户名: admin, 密码: admin123）
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin'])
    
    if (existingUsers.length === 0) {
      // 使用简单的密码加密（实际应该使用 bcrypt）
      const crypto = await import('crypto')
      const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex')
      
      await connection.query(`
        INSERT INTO users (username, password, nickname, email, storage_limit) 
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', hashedPassword, '管理员', 'admin@example.com', 107374182400]) // 100GB
      
      console.log('✓ 默认管理员账户创建成功 (用户名: admin, 密码: admin123)')
    }

    await connection.end()
    console.log('数据库迁移完成！')
  } catch (error) {
    console.error('数据库迁移失败:', error)
    throw error
  }
}

// 直接执行迁移
migrateUsers().catch(console.error)
