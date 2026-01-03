import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 数据库迁移：为 files 表添加分享功能字段
export async function migrateShare() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'netdisk'
    })

    console.log('开始添加分享功能字段...')

    // 检查 is_shared 字段是否存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'files' AND COLUMN_NAME = 'is_shared'
    `, [process.env.DB_NAME || 'netdisk'])

    if (columns.length === 0) {
      // 添加 is_shared 字段（是否分享）
      await connection.query(`
        ALTER TABLE files 
        ADD COLUMN is_shared TINYINT(1) DEFAULT 0 COMMENT '是否分享到广场'
      `)
      console.log('✓ 添加 is_shared 字段成功')

      // 添加 shared_at 字段（分享时间）
      await connection.query(`
        ALTER TABLE files 
        ADD COLUMN shared_at TIMESTAMP NULL COMMENT '分享时间'
      `)
      console.log('✓ 添加 shared_at 字段成功')

      // 添加索引
      await connection.query(`
        ALTER TABLE files 
        ADD INDEX idx_is_shared (is_shared, shared_at)
      `)
      console.log('✓ 添加索引成功')
    } else {
      console.log('✓ 字段已存在，跳过迁移')
    }

    await connection.end()
    console.log('数据库迁移完成！')
  } catch (error) {
    console.error('数据库迁移失败:', error)
    throw error
  }
}

// 直接执行迁移
migrateShare().catch(console.error)
