import express from 'express'
import pool from '../db/connection.js'

const router = express.Router()

// 获取文件夹列表
router.get('/', async (req, res) => {
  try {
    const { parentId = 0 } = req.query
    const userId = req.headers['x-user-id'] || 1
    
    const [rows] = await pool.query(
      'SELECT id, name, parent_id as parentId, created_at as createdAt FROM folders WHERE parent_id = ? AND user_id = ? ORDER BY created_at DESC',
      [parentId, userId]
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error fetching folders:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch folders' })
  }
})

// 获取所有文件夹（用于文件夹树）
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, parent_id as parentId, created_at as createdAt FROM folders ORDER BY parent_id, created_at DESC'
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error fetching all folders:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch all folders' })
  }
})

// 获取文件夹内所有文件（递归，用于删除前获取OSS路径）
router.get('/:id/files', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] || 1
    const files = []
    
    // 递归获取所有文件
    await getAllFilesRecursive(id, userId, files)
    
    res.json({ success: true, data: files })
  } catch (error) {
    console.error('Error fetching folder files:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch folder files' })
  }
})

// 递归获取文件夹内所有文件
async function getAllFilesRecursive(folderId, filesArray) {
  // 获取当前文件夹下的所有文件
  const [files] = await pool.query(
    'SELECT id, name, oss_path as ossPath FROM files WHERE parent_id = ?',
    [folderId]
  )
  filesArray.push(...files)

  // 获取所有子文件夹
  const [subFolders] = await pool.query(
    'SELECT id FROM folders WHERE parent_id = ?',
    [folderId]
  )

  // 递归处理每个子文件夹
  for (const subFolder of subFolders) {
    await getAllFilesRecursive(subFolder.id, filesArray)
  }
}

// 创建文件夹
router.post('/', async (req, res) => {
  try {
    const { name, parentId = 0 } = req.body
    const userId = req.headers['x-user-id'] || 1
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required' })
    }

    const [result] = await pool.query(
      'INSERT INTO folders (name, parent_id, user_id) VALUES (?, ?, ?)',
      [name.trim(), parentId, userId]
    )

    res.json({
      success: true,
      data: {
        id: result.insertId,
        name: name.trim(),
        parentId
      }
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    res.status(500).json({ success: false, message: 'Failed to create folder' })
  }
})

// 重命名文件夹
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    const userId = req.headers['x-user-id'] || 1
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required' })
    }

    // 检查文件夹是否存在且属于当前用户
    const [folders] = await pool.query('SELECT id FROM folders WHERE id = ? AND user_id = ?', [id, userId])
    if (folders.length === 0) {
      return res.status(404).json({ success: false, message: 'Folder not found' })
    }

    // 更新文件夹名称
    await pool.query('UPDATE folders SET name = ? WHERE id = ? AND user_id = ?', [name.trim(), id, userId])

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        name: name.trim()
      }
    })
  } catch (error) {
    console.error('Error renaming folder:', error)
    res.status(500).json({ success: false, message: 'Failed to rename folder' })
  }
})

// 删除文件夹
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection()
  
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] || 1
    
    // 开启事务
    await connection.beginTransaction()

    // 收集需要检查引用的 OSS 文件
    const ossFilesToCheck = []
    
    // 递归删除文件夹及其内容
    await deleteFolderRecursive(connection, id, userId, ossFilesToCheck)

    // 提交事务
    await connection.commit()
    
    // 检查每个 OSS 文件的引用计数
    const ossFilesToDelete = []
    for (const ossPath of ossFilesToCheck) {
      const [refCount] = await connection.query(
        'SELECT COUNT(*) as count FROM files WHERE oss_path = ?',
        [ossPath]
      )
      if (refCount[0].count === 0) {
        ossFilesToDelete.push(ossPath)
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Folder deleted successfully',
      ossFilesToDelete: ossFilesToDelete // 返回需要删除的 OSS 文件列表
    })
  } catch (error) {
    // 回滚事务
    await connection.rollback()
    console.error('Error deleting folder:', error)
    res.status(500).json({ success: false, message: 'Failed to delete folder' })
  } finally {
    connection.release()
  }
})

// 递归删除文件夹函数
async function deleteFolderRecursive(connection, folderId, userId, ossFilesToCheck = []) {
  // 1. 获取所有子文件夹（仅删除属于当前用户的）
  const [subFolders] = await connection.query(
    'SELECT id FROM folders WHERE parent_id = ? AND user_id = ?',
    [folderId, userId]
  )

  // 2. 递归删除每个子文件夹
  for (const subFolder of subFolders) {
    await deleteFolderRecursive(connection, subFolder.id, userId, ossFilesToCheck)
  }

  // 3. 获取该文件夹下的所有文件的 OSS 路径
  const [files] = await connection.query(
    'SELECT oss_path FROM files WHERE parent_id = ? AND user_id = ?',
    [folderId, userId]
  )
  
  // 收集 OSS 文件路径
  for (const file of files) {
    if (file.oss_path) {
      ossFilesToCheck.push(file.oss_path)
    }
  }
  
  // 4. 删除该文件夹下的所有文件记录
  await connection.query('DELETE FROM files WHERE parent_id = ? AND user_id = ?', [folderId, userId])

  // 5. 删除文件夹本身
  await connection.query('DELETE FROM folders WHERE id = ? AND user_id = ?', [folderId, userId])
}

export default router
