import express from 'express'
import crypto from 'crypto'
import db from '../db/connection.js'

const router = express.Router()

// 密码加密函数
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, nickname } = req.body

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用户名长度必须在3-20个字符之间'
      })
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度不能少于6个字符'
      })
    }

    // 检查用户名是否已存在
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }

    // 如果提供了邮箱，检查邮箱是否已存在
    if (email) {
      const [existingEmails] = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      )

      if (existingEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        })
      }
    }

    // 加密密码
    const hashedPassword = hashPassword(password)

    // 插入新用户
    const [result] = await db.query(
      'INSERT INTO users (username, password, email, nickname) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, nickname || username]
    )

    res.json({
      success: true,
      message: '注册成功',
      data: {
        id: result.insertId,
        username,
        nickname: nickname || username
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    // 查询用户
    const [users] = await db.query(
      'SELECT id, username, password, email, nickname, avatar, storage_limit, storage_used FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const user = users[0]

    // 验证密码
    const hashedPassword = hashPassword(password)
    if (hashedPassword !== user.password) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 更新最后登录时间
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    )

    // 生成简单的token（实际应该使用JWT）
    const token = crypto.randomBytes(32).toString('hex')

    // 返回用户信息（不包含密码）
    delete user.password

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
})

// 获取用户信息
router.get('/user', async (req, res) => {
  try {
    // 从请求头获取用户ID（实际应该从token中解析）
    const userId = req.headers['x-user-id'] || 1

    const [users] = await db.query(
      'SELECT id, username, email, nickname, avatar, storage_limit, storage_used, created_at FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: users[0]
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

// 更新用户信息
router.put('/user', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 1
    const { nickname, email, avatar } = req.body

    const updates = []
    const values = []

    if (nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(nickname)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      values.push(email)
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      })
    }

    values.push(userId)

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '更新失败'
    })
  }
})

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 1
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6个字符'
      })
    }

    // 查询用户当前密码
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 验证旧密码
    const hashedOldPassword = hashPassword(oldPassword)
    if (hashedOldPassword !== users[0].password) {
      return res.status(401).json({
        success: false,
        message: '旧密码错误'
      })
    }

    // 更新密码
    const hashedNewPassword = hashPassword(newPassword)
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    )

    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    })
  }
})

export default router
