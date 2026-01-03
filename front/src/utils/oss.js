import OSS from 'ali-oss'

export function client() {
  const ossClient = new OSS({
    region: 'oss-cn-wuhan-lr',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: 'xp-cdn-oss',
    secure: true
  })
  return ossClient
}

// 上传文件到OSS
export async function uploadFileToOSS(file, path, onProgress) {
  try {
    console.log('OSS上传开始:', { fileName: file.name, path })

    if (!file) {
      console.error('文件对象为空')
      return {
        success: false,
        error: '文件对象为空'
      }
    }

    const ossClient = client()
    const fileName = `${path}/${file.name}`

    console.log('准备上传到OSS:', fileName)

    const result = await ossClient.multipartUpload(fileName, file, {
      progress: (p) => {
        console.log('OSS上传进度:', p)
        if (onProgress) {
          onProgress(p)
        }
      }
    })

    console.log('OSS上传成功:', result)

    const fileUrl = `https://xp-cdn-oss.oss-cn-wuhan-lr.aliyuncs.com/${result.name}`

    return {
      success: true,
      url: fileUrl,
      name: result.name
    }
  } catch (error) {
    console.error('OSS上传失败:', error)
    return {
      success: false,
      error: error.message || '上传失败'
    }
  }
}

// 删除OSS文件
export async function deleteFileFromOSS(fileName) {
  try {
    if (!fileName) {
      console.warn('OSS文件路径为空，跳过删除')
      return { success: true }
    }
    const ossClient = client()
    await ossClient.delete(fileName)
    console.log('OSS文件删除成功:', fileName)
    return { success: true }
  } catch (error) {
    console.error('OSS删除失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 生成OSS缩略图URL
 * @param {string} originalUrl - 原始图片/视频URL
 * @param {object} options - 缩略图选项
 * @param {number} options.width - 宽度（默认200）
 * @param {string} options.mode - 缩放模式 lfit(等比缩放)、mfit(等比缩放填充)、fill(固定宽高)、pad(固定宽高居中) 默认lfit
 * @returns {string} 缩略图URL
 */
export function getThumbnailUrl(originalUrl, options = {}) {
  if (!originalUrl) return ''
  
  // 默认参数
  const {
    width = 200,
    mode = 'lfit'
  } = options

  try {
    // 移除URL中已有的查询参数（如时间戳）
    const cleanUrl = originalUrl.split('?')[0]
    
    // 判断是否为图片
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    const isImage = imageExts.some(ext => cleanUrl.toLowerCase().includes(ext))
    
    // 判断是否为视频
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm']
    const isVideo = videoExts.some(ext => cleanUrl.toLowerCase().includes(ext))

    if (isImage) {
      // 阿里云OSS图片处理参数（简洁格式）
      // 参考文档：https://help.aliyun.com/document_detail/44688.html
      const params = `x-oss-process=image/resize,w_${width},m_${mode}`
      return `${cleanUrl}?${params}`
    } else if (isVideo) {
      // 阿里云OSS视频截帧参数（t为时间戳，单位毫秒，此参数必填）
      // 参考文档：https://help.aliyun.com/document_detail/64555.html
      const params = `x-oss-process=video/snapshot,t_0,f_jpg,w_${width},m_fast`
      return `${cleanUrl}?${params}`
    }
    
    // 其他文件类型返回原URL
    return originalUrl
  } catch (error) {
    console.error('生成缩略图URL失败:', error)
    return originalUrl
  }
}

/**
 * 批量生成缩略图URL
 * @param {Array} files - 文件列表
 * @param {object} options - 缩略图选项
 * @returns {Array} 带缩略图URL的文件列表
 */
export function addThumbnailUrls(files, options = {}) {
  if (!Array.isArray(files)) return []
  
  return files.map(file => {
    if (file.url && file.type !== 'folder') {
      return {
        ...file,
        thumbnailUrl: getThumbnailUrl(file.url, options),
        originalUrl: file.url // 保留原始URL，点击预览时使用
      }
    }
    return file
  })
}
