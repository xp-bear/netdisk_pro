<template>
    <img :src="iconSrc" :alt="fileType" :style="{ width: size + 'px', height: size + 'px' }" class="file-icon" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    fileType: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        default: ''
    },
    size: {
        type: Number,
        default: 24
    }
})

// 根据文件类型返回对应的图标路径
const iconSrc = computed(() => {
    if (props.fileType === 'folder') {
        return new URL('../assets/icons/folder__easyi.svg', import.meta.url).href
    }

    // 如果有文件名，根据扩展名判断
    if (props.fileName) {
        const ext = props.fileName.split('.').pop().toLowerCase()
        
        // 图片
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
            return new URL('../assets/icons/tupian.svg', import.meta.url).href
        }
        
        // 视频
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
            return new URL('../assets/icons/shipin.svg', import.meta.url).href
        }
        
        // 音频
        if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) {
            return new URL('../assets/icons/yinpin.svg', import.meta.url).href
        }
        
        // Word文档
        if (['doc', 'docx'].includes(ext)) {
            return new URL('../assets/icons/word.svg', import.meta.url).href
        }
        
        // Excel表格
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return new URL('../assets/icons/xlsx.svg', import.meta.url).href
        }
        
        // PPT演示文稿
        if (['ppt', 'pptx'].includes(ext)) {
            return new URL('../assets/icons/ppt.svg', import.meta.url).href
        }
        
        // PDF
        if (ext === 'pdf') {
            return new URL('../assets/icons/pdf.svg', import.meta.url).href
        }
        
        // 文本文件
        if (['txt', 'log', 'ini', 'cfg', 'conf'].includes(ext)) {
            return new URL('../assets/icons/txt.svg', import.meta.url).href
        }
        
        // Markdown
        if (['md', 'markdown'].includes(ext)) {
            return new URL('../assets/icons/markdown.svg', import.meta.url).href
        }
        
        // 代码文件
        if (['js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'html', 'xml', 
             'java', 'py', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'json'].includes(ext)) {
            return new URL('../assets/icons/daima.svg', import.meta.url).href
        }
        
        // 压缩包
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
            return new URL('../assets/icons/yasuobao.svg', import.meta.url).href
        }
        
        // 可执行文件
        if (['exe', 'msi'].includes(ext)) {
            return new URL('../assets/icons/exe.svg', import.meta.url).href
        }
        
        // dmg (Mac安装包)
        if (ext === 'dmg') {
            return new URL('../assets/icons/dmg.svg', import.meta.url).href
        }
        
        // apk (Android安装包)
        if (ext === 'apk') {
            return new URL('../assets/icons/android.svg', import.meta.url).href
        }
        
        // ipa (iOS安装包)
        if (ext === 'ipa') {
            return new URL('../assets/icons/ios.svg', import.meta.url).href
        }
    }
    
    // 默认文件图标（使用文本图标）
    return new URL('../assets/icons/txt.svg', import.meta.url).href
})
</script>

<style scoped>
.file-icon {
    display: inline-block;
    vertical-align: middle;
    object-fit: contain;
}
</style>
