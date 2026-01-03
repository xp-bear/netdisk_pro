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
