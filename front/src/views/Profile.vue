<template>
    <div class="profile-container">
        <!-- 返回按钮 -->
        <div class="back-button">
            <el-button @click="goBack" text>
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                返回
            </el-button>
        </div>

        <div class="profile-card">
            <!-- 顶部头像区域 -->
            <div class="profile-header">
                <div class="avatar-section">
                    <el-avatar :size="120" :src="userStore.avatar || undefined">
                        <el-icon :size="50">
                            <User />
                        </el-icon>
                    </el-avatar>
                    <div class="avatar-upload">
                        <el-button size="small" @click="showAvatarDialog = true">
                            <el-icon>
                                <Edit />
                            </el-icon>
                            更换头像
                        </el-button>
                    </div>
                </div>
                <div class="user-info">
                    <h2>{{ userStore.nickname || userStore.username }}</h2>
                    <p class="username">@{{ userStore.username }}</p>
                    <el-tag type="info" size="default">ID: {{ userStore.userId }}</el-tag>
                </div>
            </div>

            <!-- 存储空间信息 -->
            <div class="storage-section">
                <div class="storage-header">
                    <span class="storage-title">
                        <el-icon>
                            <Folder />
                        </el-icon>
                        存储空间
                    </span>
                    <span class="storage-text">
                        {{ formatSize(userStore.storageUsed) }} / {{ formatSize(userStore.storageLimit) }}
                    </span>
                </div>
                <el-progress :percentage="userStore.storagePercent" :color="storageColor" :stroke-width="12" />
            </div>

            <!-- 信息展示和编辑 -->
            <el-tabs v-model="activeTab" class="profile-tabs">
                <!-- 基本信息 -->
                <el-tab-pane label="基本信息" name="info">
                    <el-form :model="profileForm" label-width="100px" class="profile-form">
                        <el-form-item label="用户名">
                            <el-input v-model="profileForm.username" disabled />
                        </el-form-item>
                        <el-form-item label="昵称">
                            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" :disabled="!isEditing" />
                        </el-form-item>
                        <el-form-item label="邮箱">
                            <el-input v-model="profileForm.email" placeholder="请输入邮箱" :disabled="!isEditing" />
                        </el-form-item>
                        <el-form-item label="注册时间">
                            <el-input v-model="registerTime" disabled />
                        </el-form-item>
                        <el-form-item>
                            <el-button v-if="!isEditing" type="primary" @click="startEdit">
                                <el-icon>
                                    <Edit />
                                </el-icon>
                                编辑资料
                            </el-button>
                            <template v-else>
                                <el-button type="primary" @click="saveProfile" :loading="saving">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                    保存
                                </el-button>
                                <el-button @click="cancelEdit">
                                    <el-icon>
                                        <Close />
                                    </el-icon>
                                    取消
                                </el-button>
                            </template>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 安全设置 -->
                <el-tab-pane label="安全设置" name="security">
                    <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px"
                        class="profile-form">
                        <el-form-item label="旧密码" prop="oldPassword">
                            <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码"
                                show-password />
                        </el-form-item>
                        <el-form-item label="新密码" prop="newPassword">
                            <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6个字符）"
                                show-password />
                        </el-form-item>
                        <el-form-item label="确认密码" prop="confirmPassword">
                            <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码"
                                show-password />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="changePassword" :loading="changingPassword">
                                <el-icon>
                                    <Lock />
                                </el-icon>
                                修改密码
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 账号管理 -->
                <el-tab-pane label="账号管理" name="account">
                    <div class="account-actions">
                        <el-card shadow="hover" class="action-card">
                            <div class="action-item">
                                <div class="action-info">
                                    <h3>退出登录</h3>
                                    <p>退出当前账号，返回登录页面</p>
                                </div>
                                <el-button type="warning" @click="handleLogout">
                                    <el-icon>
                                        <SwitchButton />
                                    </el-icon>
                                    退出登录
                                </el-button>
                            </div>
                        </el-card>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- 更换头像对话框 -->
        <el-dialog v-model="showAvatarDialog" title="更换头像" width="500px">
            <el-tabs v-model="avatarTab">
                <!-- 上传头像 -->
                <el-tab-pane label="上传头像" name="upload">
                    <div class="avatar-upload-section">
                        <el-upload
                            class="avatar-uploader"
                            :auto-upload="false"
                            :show-file-list="false"
                            :on-change="handleAvatarChange"
                            accept="image/*"
                            drag
                        >
                            <el-icon v-if="!previewAvatar" class="avatar-uploader-icon">
                                <Plus />
                            </el-icon>
                            <img v-else :src="previewAvatar" class="avatar-preview-img" />
                            <div class="upload-hint">
                                <p v-if="!previewAvatar">点击或拖拽图片到此处上传</p>
                                <p v-else>点击重新选择</p>
                                <p class="upload-tip">支持 jpg、png、gif 格式，建议尺寸 200x200，大小不超过 5MB</p>
                            </div>
                        </el-upload>
                        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                            <el-progress :percentage="Math.round(uploadProgress * 100)" />
                            <p>正在上传...</p>
                        </div>
                    </div>
                </el-tab-pane>
                
                <!-- URL头像 -->
                <el-tab-pane label="输入URL" name="url">
                    <div class="avatar-input">
                        <el-input v-model="avatarUrl" placeholder="请输入头像URL地址" clearable />
                        <div class="avatar-preview">
                            <p>预览：</p>
                            <el-avatar :size="100" :src="avatarUrl || undefined">
                                <el-icon :size="40">
                                    <User />
                                </el-icon>
                            </el-avatar>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
            <template #footer>
                <el-button @click="handleCancelAvatar">取消</el-button>
                <el-button type="primary" @click="handleConfirmAvatar" :loading="updatingAvatar">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Edit, Folder, Check, Close, Lock, SwitchButton, ArrowLeft, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { uploadFileToOSS } from '@/utils/oss'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('info')
const isEditing = ref(false)
const saving = ref(false)
const changingPassword = ref(false)
const showAvatarDialog = ref(false)
const updatingAvatar = ref(false)
const avatarTab = ref('upload')
const avatarUrl = ref('')
const previewAvatar = ref('')
const uploadProgress = ref(0)
const selectedAvatarFile = ref(null)
const passwordFormRef = ref(null)

// 个人资料表单
const profileForm = reactive({
    username: '',
    nickname: '',
    email: '',
    created_at: ''
})

const originalProfile = reactive({})

// 密码修改表单
const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// 密码验证规则
const passwordRules = {
    oldPassword: [
        { required: true, message: '请输入旧密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== passwordForm.newPassword) {
                    callback(new Error('两次输入的密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ]
}

// 计算属性
const registerTime = computed(() => {
    if (!profileForm.created_at) return ''
    return new Date(profileForm.created_at).toLocaleString('zh-CN')
})

const storageColor = computed(() => {
    const percent = userStore.storagePercent
    if (percent < 60) return '#67c23a'
    if (percent < 80) return '#e6a23c'
    return '#f56c6c'
})

// 格式化文件大小
function formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 加载用户信息
async function loadUserInfo() {
    try {
        const response = await api.get('/auth/user')
        if (response.success) {
            const userData = response.data
            profileForm.username = userData.username
            profileForm.nickname = userData.nickname
            profileForm.email = userData.email || ''
            profileForm.created_at = userData.created_at

            // 保存原始数据
            Object.assign(originalProfile, {
                nickname: userData.nickname,
                email: userData.email || ''
            })

            // 更新store
            userStore.setUser(userData)
        }
    } catch (error) {
        console.error('加载用户信息失败:', error)
        ElMessage.error('加载用户信息失败')
    }
}

// 开始编辑
function startEdit() {
    isEditing.value = true
}

// 取消编辑
function cancelEdit() {
    isEditing.value = false
    profileForm.nickname = originalProfile.nickname
    profileForm.email = originalProfile.email
}

// 保存个人资料
async function saveProfile() {
    try {
        saving.value = true
        const response = await api.put('/auth/user', {
            nickname: profileForm.nickname,
            email: profileForm.email
        })

        if (response.success) {
            ElMessage.success('保存成功')
            isEditing.value = false

            // 更新原始数据
            Object.assign(originalProfile, {
                nickname: profileForm.nickname,
                email: profileForm.email
            })

            // 更新store
            const currentUser = { ...userStore.user }
            currentUser.nickname = profileForm.nickname
            currentUser.email = profileForm.email
            userStore.setUser(currentUser)
        } else {
            ElMessage.error(response.message || '保存失败')
        }
    } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error(error.response?.message || '保存失败')
    } finally {
        saving.value = false
    }
}

// 修改密码
async function changePassword() {
    if (!passwordFormRef.value) return

    await passwordFormRef.value.validate(async (valid) => {
        if (!valid) return

        try {
            changingPassword.value = true
            const response = await api.put('/auth/password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            })

            if (response.success) {
                ElMessage.success('密码修改成功，请重新登录')
                // 清空表单
                passwordForm.oldPassword = ''
                passwordForm.newPassword = ''
                passwordForm.confirmPassword = ''

                // 延迟后退出登录
                setTimeout(() => {
                    handleLogout()
                }, 1500)
            } else {
                ElMessage.error(response.message || '修改失败')
            }
        } catch (error) {
            console.error('修改密码失败:', error)
            ElMessage.error(error.response?.message || '修改密码失败')
        } finally {
            changingPassword.value = false
        }
    })
}

// 头像文件选择
function handleAvatarChange(file) {
    const isImage = file.raw.type.startsWith('image/')
    const isLt5M = file.raw.size / 1024 / 1024 < 5

    if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return
    }
    if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB!')
        return
    }

    selectedAvatarFile.value = file.raw
    // 生成预览图
    const reader = new FileReader()
    reader.onload = (e) => {
        previewAvatar.value = e.target.result
    }
    reader.readAsDataURL(file.raw)
}

// 取消更换头像
function handleCancelAvatar() {
    showAvatarDialog.value = false
    avatarTab.value = 'upload'
    avatarUrl.value = ''
    previewAvatar.value = ''
    uploadProgress.value = 0
    selectedAvatarFile.value = null
}

// 确认更换头像
async function handleConfirmAvatar() {
    if (avatarTab.value === 'upload') {
        // 上传模式
        if (!selectedAvatarFile.value) {
            ElMessage.warning('请先选择图片')
            return
        }
        await uploadAvatar()
    } else {
        // URL模式
        await updateAvatarByUrl()
    }
}

// 上传头像到OSS
async function uploadAvatar() {
    try {
        updatingAvatar.value = true
        uploadProgress.value = 0

        // 验证文件
        if (!selectedAvatarFile.value) {
            ElMessage.error('请先选择图片')
            return
        }

        console.log('开始上传头像:', selectedAvatarFile.value.name)

        // 上传到OSS
        const result = await uploadFileToOSS(
            selectedAvatarFile.value,
            `avatars/${userStore.userId}`,
            (progress) => {
                console.log('上传进度:', progress)
                uploadProgress.value = progress
            }
        )

        console.log('上传结果:', result)

        // 检查result是否有效
        if (!result) {
            ElMessage.error('上传失败: 未返回结果')
            return
        }

        if (!result.success) {
            ElMessage.error('上传失败: ' + (result.error || '未知错误'))
            return
        }

        if (!result.url) {
            ElMessage.error('上传失败: 未获取到文件URL')
            return
        }

        console.log('头像URL:', result.url)

        // 更新用户头像URL
        const response = await api.put('/auth/user', {
            avatar: result.url
        })

        console.log('API响应:', response)

        // 注意：API响应拦截器已经返回了 response.data，所以这里直接用 response
        if (response && response.success) {
            ElMessage.success('头像更新成功')
            
            // 更新store
            const currentUser = { ...userStore.user }
            currentUser.avatar = result.url
            userStore.setUser(currentUser)
            
            // 关闭对话框并重置
            handleCancelAvatar()
        } else {
            const errorMsg = response?.message || '更新失败'
            ElMessage.error(errorMsg)
        }
    } catch (error) {
        console.error('上传头像失败:', error)
        ElMessage.error('上传头像失败: ' + (error.message || '未知错误'))
    } finally {
        updatingAvatar.value = false
        uploadProgress.value = 0
    }
}

// 通过URL更新头像
async function updateAvatarByUrl() {
    if (!avatarUrl.value.trim()) {
        ElMessage.warning('请输入头像URL')
        return
    }

    try {
        updatingAvatar.value = true
        const response = await api.put('/auth/user', {
            avatar: avatarUrl.value
        })

        if (response.success) {
            ElMessage.success('头像更新成功')
            
            // 更新store
            const currentUser = { ...userStore.user }
            currentUser.avatar = avatarUrl.value
            userStore.setUser(currentUser)
            
            // 关闭对话框并重置
            handleCancelAvatar()
        } else {
            ElMessage.error(response.message || '更新失败')
        }
    } catch (error) {
        console.error('更新头像失败:', error)
        ElMessage.error('更新头像失败')
    } finally {
        updatingAvatar.value = false
    }
}

// 更新头像（旧方法，保留兼容）
async function updateAvatar() {
    await updateAvatarByUrl()
}

// 退出登录
function handleLogout() {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
    }).catch(() => { })
}

// 返回上一页
function goBack() {
    router.push('/')
}

onMounted(() => {
    loadUserInfo()
})
</script>

<style scoped>
.profile-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.back-button {
    width: 100%;
    max-width: 900px;
    margin-bottom: 20px;
}

.profile-card {
    width: 100%;
    max-width: 900px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.profile-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px;
    display: flex;
    align-items: center;
    gap: 30px;
    color: white;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.avatar-upload {
    width: 100%;
    display: flex;
    justify-content: center;
}

.user-info h2 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
}

.username {
    margin: 0 0 12px 0;
    opacity: 0.9;
    font-size: 16px;
}

.storage-section {
    padding: 30px 40px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.storage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.storage-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.storage-text {
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.profile-tabs {
    padding: 30px 40px;
}

.profile-form {
    max-width: 600px;
}

.account-actions {
    max-width: 600px;
}

.action-card {
    margin-bottom: 20px;
}

.action-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.action-info h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #333;
}

.action-info p {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.avatar-input {
    padding: 20px 0;
}

.avatar-preview {
    margin-top: 20px;
    text-align: center;
}

.avatar-preview p {
    margin-bottom: 15px;
    color: #666;
}

.avatar-upload-section {
    padding: 20px 0;
}

.avatar-uploader {
    width: 100%;
}

:deep(.avatar-uploader .el-upload) {
    width: 100%;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
    background: #fafafa;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

:deep(.avatar-uploader .el-upload:hover) {
    border-color: #409eff;
    background: #f5f7fa;
}

.avatar-uploader-icon {
    font-size: 48px;
    color: #8c939d;
    margin-bottom: 16px;
}

.avatar-preview-img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
}

.upload-hint {
    text-align: center;
    color: #666;
    margin-top: 10px;
}

.upload-hint p {
    margin: 8px 0;
}

.upload-tip {
    font-size: 12px;
    color: #999;
}

.upload-progress {
    margin-top: 20px;
    text-align: center;
}

.upload-progress p {
    margin-top: 10px;
    color: #666;
    font-size: 14px;
}

@media (max-width: 768px) {
    .profile-header {
        flex-direction: column;
        text-align: center;
        padding: 30px 20px;
    }

    .storage-section,
    .profile-tabs {
        padding: 20px;
    }

    .action-item {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
}
</style>
