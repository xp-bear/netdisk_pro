import { defineStore } from 'pinia'
import { ref } from 'vue'
import { folderApi, fileApi } from '@/api'
import { useUserStore } from './user'

export const useFileStore = defineStore('file', () => {
  const currentFolderId = ref(0) // 当前文件夹ID，0表示根目录
  const folders = ref([]) // 文件夹列表
  const files = ref([]) // 文件列表
  const allFolders = ref([]) // 所有文件夹（用于文件夹树）
  const breadcrumb = ref([{ id: 0, name: '全部文件' }]) // 面包屑导航
  const filterType = ref('all') // 筛选类型

  // 加载文件夹列表
  async function loadFolders() {
    try {
      const res = await folderApi.getFolders(currentFolderId.value)
      folders.value = res.data || []
    } catch (error) {
      console.error('加载文件夹失败:', error)
    }
  }

  // 加载所有文件夹（用于文件夹树）
  async function loadAllFolders() {
    try {
      const res = await folderApi.getAllFolders()
      allFolders.value = res.data || []
    } catch (error) {
      console.error('加载所有文件夹失败:', error)
    }
  }

  // 加载文件列表
  async function loadFiles() {
    try {
      if (filterType.value === 'all') {
        const res = await fileApi.getFiles({ parentId: currentFolderId.value })
        files.value = res.data || []
      } else {
        const res = await fileApi.getFilesByType(filterType.value, currentFolderId.value)
        files.value = res.data || []
      }
    } catch (error) {
      console.error('加载文件失败:', error)
    }
  }

  // 加载当前目录数据
  async function loadCurrentDir() {
    await loadFolders()
    await loadFiles()
  }

  // 进入文件夹
  async function enterFolder(folder) {
    currentFolderId.value = folder.id
    breadcrumb.value.push({ id: folder.id, name: folder.name })
    await loadCurrentDir()
  }

  // 通过面包屑导航
  async function navigateTo(index) {
    breadcrumb.value = breadcrumb.value.slice(0, index + 1)
    currentFolderId.value = breadcrumb.value[index].id
    await loadCurrentDir()
  }

  // 创建文件夹
  async function createFolder(name, parentId = null) {
    try {
      const response = await folderApi.createFolder({
        name,
        parentId: parentId !== null ? parentId : currentFolderId.value
      })
      await loadFolders()
      // 返回完整的响应，包括 success 和 data
      return response
    } catch (error) {
      console.error('创建文件夹失败:', error)
      return { success: false, error }
    }
  }

  // 重命名文件夹
  async function renameFolder(id, newName) {
    try {
      await folderApi.renameFolder(id, newName)
      await loadFolders()
      return { success: true }
    } catch (error) {
      console.error('重命名文件夹失败:', error)
      return { success: false, error }
    }
  }

  // 删除文件夹
  async function deleteFolder(id) {
    try {
      // 删除后端数据库记录（包括文件夹和文件）
      // 后端会返回需要删除的 OSS 文件列表
      const response = await folderApi.deleteFolder(id)
      
      // 返回后端的完整响应（包含 ossFilesToDelete）
      await loadFolders()
      return response
    } catch (error) {
      console.error('删除文件夹失败:', error)
      return { success: false, error }
    }
  }

  // 创建文件记录
  async function createFile(fileData) {
    try {
      // 提取 folderId 并重命名为 parentId
      const { folderId, ...restData } = fileData
      
      const response = await fileApi.createFile({
        ...restData,
        // 使用 folderId（如果提供）或 currentFolderId.value
        parentId: folderId !== undefined ? folderId : currentFolderId.value
      })
      
      // 更新用户存储空间
      if (response.storage) {
        const userStore = useUserStore()
        userStore.updateStorageUsed(response.storage.storage_used)
      }
      
      await loadFiles()
      return { success: true }
    } catch (error) {
      console.error('创建文件记录失败:', error)
      return { success: false, error }
    }
  }

  // 删除文件
  async function deleteFile(id) {
    try {
      const response = await fileApi.deleteFile(id)
      
      // 更新用户存储空间
      if (response.storage) {
        const userStore = useUserStore()
        userStore.updateStorageUsed(response.storage.storage_used)
      }
      
      await loadFiles()
      // 返回完整的响应（包含 shouldDeleteOSS 和 ossPath）
      return response
    } catch (error) {
      console.error('删除文件失败:', error)
      return { success: false, error }
    }
  }

  // 设置筛选类型
  async function setFilterType(type) {
    filterType.value = type
    await loadFiles()
  }

  // 移动文件到指定文件夹
  async function moveFile(fileId, targetFolderId) {
    try {
      await fileApi.moveFile(fileId, targetFolderId)
      await loadFiles()
      return { success: true }
    } catch (error) {
      console.error('移动文件失败:', error)
      return { success: false, error }
    }
  }

  // 获取所有文件（用于侧边栏筛选）
  async function getAllFiles() {
    try {
      const res = await fileApi.getAllFiles()
      return res.data || []
    } catch (error) {
      console.error('获取所有文件失败:', error)
      return []
    }
  }

  return {
    currentFolderId,
    folders,
    files,
    allFolders,
    breadcrumb,
    filterType,
    loadCurrentDir,
    loadAllFolders,
    enterFolder,
    navigateTo,
    createFolder,
    renameFolder,
    deleteFolder,
    createFile,
    deleteFile,
    setFilterType,
    moveFile,
    getAllFiles
  }
})
