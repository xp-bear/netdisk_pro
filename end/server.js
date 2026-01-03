import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import folderRoutes from './routes/folders.js'
import fileRoutes from './routes/files.js'
import shareRoutes from './routes/share.js'
import authRoutes from './routes/auth.js'
import { initDatabase } from './db/init.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 6001

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/folders', folderRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/share', shareRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 初始化数据库并启动服务器
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  })
