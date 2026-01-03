<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="@/assets/logo.png" alt="小熊云盒" class="logo-image" />
                <h1>小熊云盒</h1>
                <p class="subtitle">安全、便捷的云存储服务</p>
            </div>

            <el-tabs v-model="activeTab" class="login-tabs">
                <!-- 登录表单 -->
                <el-tab-pane label="登录" name="login">
                    <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="login-form">
                        <el-form-item prop="username">
                            <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" size="large"
                                clearable @keyup.enter="handleLogin" />
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"
                                :prefix-icon="Lock" size="large" show-password clearable @keyup.enter="handleLogin" />
                        </el-form-item>

                        <el-form-item>
                            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" size="large" :loading="loginLoading" @click="handleLogin"
                                class="submit-btn">
                                登录
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 注册表单 -->
                <el-tab-pane label="注册" name="register">
                    <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" class="login-form">
                        <el-form-item prop="username">
                            <el-input v-model="registerForm.username" placeholder="请输入用户名（3-20字符）" :prefix-icon="User"
                                size="large" clearable />
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码（至少6位）"
                                :prefix-icon="Lock" size="large" show-password clearable />
                        </el-form-item>

                        <el-form-item prop="confirmPassword">
                            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码"
                                :prefix-icon="Lock" size="large" show-password clearable />
                        </el-form-item>

                        <el-form-item prop="email">
                            <el-input v-model="registerForm.email" placeholder="请输入邮箱（可选）" :prefix-icon="Message"
                                size="large" clearable />
                        </el-form-item>

                        <el-form-item prop="nickname">
                            <el-input v-model="registerForm.nickname" placeholder="请输入昵称（可选）" :prefix-icon="User"
                                size="large" clearable />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" size="large" :loading="registerLoading" @click="handleRegister"
                                class="submit-btn">
                                注册
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>

            <div class="login-footer">
                <p>提示：首次使用要注册新账号</p>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Folder } from '@element-plus/icons-vue'
import { authApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loginLoading = ref(false)
const registerLoading = ref(false)
const rememberMe = ref(false)

const loginFormRef = ref(null)
const registerFormRef = ref(null)

// 登录表单
const loginForm = reactive({
    username: '',
    password: ''
})

// 注册表单
const registerForm = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: ''
})

// 登录表单验证规则
const loginRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
    ]
}

// 注册表单验证规则
const registerRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== registerForm.password) {
                    callback(new Error('两次输入的密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    email: [
        {
            type: 'email',
            message: '请输入正确的邮箱格式',
            trigger: 'blur'
        }
    ]
}

// 处理登录
async function handleLogin() {
    if (!loginFormRef.value) return

    await loginFormRef.value.validate(async (valid) => {
        if (!valid) return

        loginLoading.value = true

        try {
            const result = await authApi.login({
                username: loginForm.username,
                password: loginForm.password
            })

            if (result.success) {
                // 保存用户信息和token
                userStore.setUser(result.data.user)
                userStore.setToken(result.data.token)

                // 如果勾选了记住我，保存到localStorage
                if (rememberMe.value) {
                    localStorage.setItem('rememberedUsername', loginForm.username)
                } else {
                    localStorage.removeItem('rememberedUsername')
                }

                ElMessage.success('登录成功')

                // 跳转到首页
                router.push('/')
            } else {
                ElMessage.error(result.message || '登录失败')
            }
        } catch (error) {
            console.error('登录失败:', error)
            // 显示后端返回的错误信息
            if (error.response && error.response.data && error.response.data.message) {
                ElMessage.error(error.response.data.message)
            } else if (error.message) {
                ElMessage.error(error.message)
            } else {
                ElMessage.error('登录失败，请检查网络连接')
            }
        } finally {
            loginLoading.value = false
        }
    })
}

// 处理注册
async function handleRegister() {
    if (!registerFormRef.value) return

    await registerFormRef.value.validate(async (valid) => {
        if (!valid) return

        registerLoading.value = true

        try {
            const result = await authApi.register({
                username: registerForm.username,
                password: registerForm.password,
                email: registerForm.email || undefined,
                nickname: registerForm.nickname || undefined
            })

            if (result.success) {
                ElMessage.success('注册成功，请登录')

                // 切换到登录标签，并自动填充用户名
                activeTab.value = 'login'
                loginForm.username = registerForm.username
                loginForm.password = ''

                // 重置注册表单
                registerFormRef.value.resetFields()
            } else {
                ElMessage.error(result.message || '注册失败')
            }
        } catch (error) {
            console.error('注册失败:', error)
            // 显示后端返回的具体错误信息
            if (error.response && error.response.data && error.response.data.message) {
                // 后端返回的错误信息
                const errorMsg = error.response.data.message
                if (errorMsg.includes('用户名已存在')) {
                    ElMessage.error('该用户名已被注册，请更换其他用户名')
                } else if (errorMsg.includes('邮箱已被使用')) {
                    ElMessage.error('该邮箱已被使用，请更换其他邮箱')
                } else {
                    ElMessage.error(errorMsg)
                }
            } else if (error.message) {
                ElMessage.error(error.message)
            } else {
                ElMessage.error('注册失败，请检查网络连接')
            }
        } finally {
            registerLoading.value = false
        }
    })
}

// 页面加载时检查是否有记住的用户名
const rememberedUsername = localStorage.getItem('rememberedUsername')
if (rememberedUsername) {
    loginForm.username = rememberedUsername
    rememberMe.value = true
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 450px;
    padding: 40px;
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.logo-image {
    width: 120px;
    height: 120px;
    object-fit: contain;
    margin: -20px auto;
    display: block;
}

.login-header h1 {
    font-size: 28px;
    color: #333;
    margin: 15px 0 10px;
    font-weight: 600;
}

.subtitle {
    color: #666;
    font-size: 14px;
    margin: 0;
}

.login-tabs {
    margin-bottom: 20px;
}

.login-form {
    margin-top: 30px;
}

.submit-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
}

.login-footer {
    margin-top: 30px;
    text-align: center;
    color: #999;
    font-size: 13px;
    line-height: 1.8;
}

.default-account {
    color: #409EFF;
    font-weight: 500;
    margin-top: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .login-card {
        padding: 30px 20px;
    }

    .login-header h1 {
        font-size: 24px;
    }
}
</style>
