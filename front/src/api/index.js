import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加 token 到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 添加用户ID到请求头
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        config.headers['x-user-id'] = userData.id
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

// 文件夹相关API
export const folderApi = {
  // 获取文件夹列表
  getFolders: (parentId = 0) => request.get('/folders', { params: { parentId } }),
  // 获取所有文件夹（用于文件夹树）
  getAllFolders: () => request.get('/folders/all'),
  // 获取文件夹内所有文件（递归）
  getFolderFiles: (folderId) => request.get(`/folders/${folderId}/files`),
  // 创建文件夹
  createFolder: (data) => request.post('/folders', data),
  // 重命名文件夹
  renameFolder: (id, name) => request.put(`/folders/${id}`, { name }),
  // 删除文件夹
  deleteFolder: (id) => request.delete(`/folders/${id}`)
}

// 文件相关API
export const fileApi = {
  // 获取文件列表
  getFiles: (params) => request.get('/files', { params }),
  // 获取所有文件（用于侧边栏筛选）
  getAllFiles: () => request.get('/files/all'),
  // 创建文件记录
  createFile: (data) => request.post('/files', data),
  // 删除文件
  deleteFile: (id) => request.delete(`/files/${id}`),
  // 根据类型筛选文件
  getFilesByType: (type, parentId = 0) => request.get('/files/type', { params: { type, parentId } }),
  // 移动文件到指定文件夹
  moveFile: (id, targetFolderId) => request.put(`/files/${id}/move`, { targetFolderId })
}

// 分享相关API
export const shareApi = {
  // 分享文件到广场
  shareFile: (id) => request.post(`/share/files/${id}`),
  // 取消分享文件
  unshareFile: (id) => request.delete(`/share/files/${id}`),
  // 获取分享广场文件列表
  getSharedFiles: (params) => request.get('/share/square', { params }),
  // 保存分享文件到我的网盘
  saveSharedFile: (id, targetFolderId = 0) => request.post(`/share/save/${id}`, { targetFolderId })
}

// 用户认证相关API
export const authApi = {
  // 用户注册
  register: (data) => request.post('/auth/register', data),
  // 用户登录
  login: (data) => request.post('/auth/login', data),
  // 获取用户信息
  getUserInfo: () => request.get('/auth/user'),
  // 更新用户信息
  updateUser: (data) => request.put('/auth/user', data),
  // 修改密码
  changePassword: (data) => request.put('/auth/password', data)
}

export default request
