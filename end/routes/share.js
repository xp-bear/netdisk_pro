import express from 'express'
import pool from '../db/connection.js'

const router = express.Router()

// 分享文件到广场
router.post('/files/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] || 1

    // 检查文件是否存在且属于当前用户
    const [files] = await pool.query('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId])
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    // 更新文件为分享状态
    await pool.query(
      'UPDATE files SET is_shared = 1, shared_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    res.json({
      success: true,
      message: 'File shared successfully'
    })
  } catch (error) {
    console.error('Error sharing file:', error)
    res.status(500).json({ success: false, message: 'Failed to share file' })
  }
})

// 取消分享文件
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] || 1

    // 只能取消分享属于自己的文件
    await pool.query(
      'UPDATE files SET is_shared = 0, shared_at = NULL WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    res.json({
      success: true,
      message: 'File unshared successfully'
    })
  } catch (error) {
    console.error('Error unsharing file:', error)
    res.status(500).json({ success: false, message: 'Failed to unshare file' })
  }
})

// 获取分享广场的所有文件
router.get('/square', async (req, res) => {
  try {
    const { fileType, page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize

    // 构建查询 - 包含分享者信息
    let query = `
      SELECT 
        f.id, f.name, f.url, f.oss_path as ossPath, 
        f.size, f.file_type as fileType, 
        f.shared_at as sharedAt, f.created_at as createdAt,
        u.id as userId, u.username, u.nickname, u.avatar
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.is_shared = 1
    `
    const params = []

    // 按文件类型筛选
    if (fileType && fileType !== 'all') {
      query += ' AND file_type = ?'
      params.push(fileType)
    }

    // 按分享时间倒序排列
    query += ' ORDER BY shared_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), offset)

    const [rows] = await pool.query(query, params)

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM files f WHERE f.is_shared = 1'
    const countParams = []
    if (fileType && fileType !== 'all') {
      countQuery += ' AND f.file_type = ?'
      countParams.push(fileType)
    }
    const [countResult] = await pool.query(countQuery, countParams)

    res.json({
      success: true,
      data: rows,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    })
  } catch (error) {
    console.error('Error fetching shared files:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch shared files' })
  }
})

// 保存分享文件到我的网盘
router.post('/save/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { targetFolderId = 0 } = req.body
    const userId = req.headers['x-user-id'] || 1

    // 获取原文件信息
    const [files] = await pool.query(
      'SELECT name, url, oss_path, size, file_type FROM files WHERE id = ? AND is_shared = 1',
      [id]
    )

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shared file not found'
      })
    }

    const file = files[0]
    const fileSize = file.size || 0

    // 开始事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 复制文件记录到当前用户的目标文件夹（OSS 文件实际上是共享的，不需要重新上传）
      const [result] = await connection.query(
        'INSERT INTO files (name, url, oss_path, size, file_type, parent_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [file.name, file.url, file.oss_path, fileSize, file.file_type, targetFolderId, userId]
      )

      // 更新用户存储空间使用量
      await connection.query(
        'UPDATE users SET storage_used = storage_used + ? WHERE id = ?',
        [fileSize, userId]
      )

      // 提交事务
      await connection.commit()
      connection.release()

      // 获取更新后的用户存储信息
      const [users] = await pool.query(
        'SELECT storage_used, storage_limit FROM users WHERE id = ?',
        [userId]
      )

      res.json({
        success: true,
        message: 'File saved to your netdisk successfully',
        data: {
          id: result.insertId,
          name: file.name
        },
        storage: users[0] || { storage_used: 0, storage_limit: 10737418240 }
      })
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('Error saving shared file:', error)
    res.status(500).json({ success: false, message: 'Failed to save file' })
  }
})

export default router
