# 仿百度网盘项目

一个基于 Vue3 + Express + MySQL + 阿里云OSS 的网盘系统，支持文件上传、下载、文件夹管理、文件分类筛选等功能。

## 技术栈

### 前端
- Vue 3 + Vite
- Vue Router (路由管理)
- Pinia (状态管理)
- Element Plus (UI组件库)
- Axios (HTTP请求)
- ali-oss (阿里云OSS SDK)

### 后端
- Node.js
- Express (Web框架)
- MySQL (数据库)
- mysql2 (MySQL驱动)

## 功能特性

- ✅ 文件上传到阿里云OSS
- ✅ 文件下载
- ✅ 文件夹创建与管理
- ✅ 文件分类筛选（图片、视频、文档、压缩包、安装包）
- ✅ 面包屑导航
- ✅ 文件/文件夹删除
- ✅ 拖拽上传
- ✅ 上传进度显示
- ✅ 图片在线预览（智能适配）
- ✅ 视频在线播放
- ✅ Office文档在线预览（Word、Excel、PPT、PDF）
- ✅ 列表/卡片双视图模式
- ✅ 卡片模式显示图片视频缩略图

## 项目结构

```
仿百度网盘/
├── front/                  # 前端项目
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── stores/        # Pinia状态管理
│   │   ├── router/        # 路由配置
│   │   ├── utils/         # 工具函数（OSS配置）
│   │   ├── views/         # 页面组件
│   │   ├── App.vue        # 根组件
│   │   └── main.js        # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── end/                    # 后端项目
│   ├── db/
│   │   ├── connection.js  # 数据库连接
│   │   └── init.js        # 数据库初始化
│   ├── routes/
│   │   ├── folders.js     # 文件夹路由
│   │   └── files.js       # 文件路由
│   ├── server.js          # 服务器入口
│   ├── .env               # 环境变量
│   └── package.json
│
└── README.md
```

## 安装与运行

### 1. 数据库配置

确保本地已安装 MySQL，创建数据库（或直接运行后端，会自动创建）：

```sql
CREATE DATABASE netdisk DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 后端安装与运行

```bash
cd end
npm install
```

修改 `.env` 文件配置数据库信息：

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=netdisk
```

启动后端服务：

```bash
npm start
# 或开发模式（热重载）
npm run dev
```

后端服务将运行在 http://localhost:5000

### 3. 前端安装与运行

```bash
cd front
npm install
npm run dev
```

前端服务将运行在 http://localhost:3000

### 4. 阿里云OSS配置

在 `front/src/utils/oss.js` 中已配置好OSS信息：

```javascript
region: 'oss-cn-wuhan-lr'
accessKeyId: ''
accessKeySecret: ''
bucket: 'xp-cdn-oss'
```

⚠️ **注意**：生产环境请更换为您自己的OSS密钥，不要使用示例中的密钥！

## API接口文档

### 文件夹接口

#### 获取文件夹列表
```
GET /api/folders?parentId=0
```

#### 创建文件夹
```
POST /api/folders
Body: { name: '文件夹名', parentId: 0 }
```

#### 删除文件夹
```
DELETE /api/folders/:id
```

### 文件接口

#### 获取文件列表
```
GET /api/files?parentId=0
```

#### 按类型筛选文件
```
GET /api/files/type?type=image&parentId=0
支持类型: image, video, document, zip, exe, all
```

#### 创建文件记录
```
POST /api/files
Body: {
  name: '文件名',
  url: 'OSS文件URL',
  ossPath: 'OSS存储路径',
  size: 文件大小(字节),
  fileType: 'image',
  parentId: 0
}
```

#### 删除文件
```
DELETE /api/files/:id
```

## 数据库表结构

### folders 表
```sql
id            INT           主键，自增
name          VARCHAR(255)  文件夹名称
parent_id     INT           父文件夹ID（0表示根目录）
created_at    TIMESTAMP     创建时间
updated_at    TIMESTAMP     更新时间
```

### files 表
```sql
id            INT           主键，自增
name          VARCHAR(255)  文件名
url           TEXT          文件访问URL
oss_path      VARCHAR(500)  OSS存储路径
size          BIGINT        文件大小（字节）
file_type     VARCHAR(50)   文件类型
parent_id     INT           所属文件夹ID
created_at    TIMESTAMP     创建时间
updated_at    TIMESTAMP     更新时间
```

## 使用说明

1. **上传文件**：点击"上传文件"按钮，选择或拖拽文件，确认上传
2. **创建文件夹**：点击"新建文件夹"按钮，输入名称创建
3. **进入文件夹**：双击文件夹进入子目录
4. **返回上级**：点击面包屑导航返回
5. **筛选文件**：点击左侧菜单按类型筛选
6. **切换视图**：点击工具栏的"列表"或"卡片"按钮切换展示模式
7. **预览文件**：点击"预览"按钮或双击图片/视频文件进行预览
8. **下载文件**：点击文件的"下载"按钮
9. **删除**：点击"删除"按钮删除文件或文件夹

### 视图模式说明

**列表模式**：
- 传统表格形式展示
- 显示文件名、大小、创建时间
- 适合查看详细信息

**卡片模式**：
- 网格卡片形式展示
- 图片/视频显示实时缩略图
- 文件夹和其他文件显示对应图标
- 悬停显示操作按钮
- 适合视觉浏览

### 预览功能说明

**图片预览**：
- 支持格式：JPG、PNG、GIF、BMP、WebP
- 智能适配显示（横图优先显示高度，竖图优先显示宽度）
- 显示图片尺寸信息

**视频预览**：
- 支持格式：MP4、AVI、MOV、WMV、FLV、MKV、WebM
- HTML5原生播放器
- 支持播放控制、进度调整、音量调节

**文档预览**：
- 支持格式：Word（.doc/.docx）、Excel（.xls/.xlsx）、PowerPoint（.ppt/.pptx）、PDF
- 使用微软Office在线预览服务
- 支持全屏模式
- 无需下载即可查看文档内容
- ⚠️ 注意：文档需要公网可访问才能预览

## 注意事项

1. 文件实际存储在阿里云OSS中，数据库仅保存文件元信息
2. 删除文件时会同时删除OSS中的文件和数据库记录
3. 非空文件夹无法删除，需先删除内部内容
4. 建议在生产环境中添加用户认证和权限管理
5. OSS密钥请妥善保管，不要泄露到公开仓库

## 后续优化建议

- [ ] 用户认证与权限管理
- [ ] 文件分享功能
- [x] 文件预览（图片、视频、文档）
- [ ] 批量操作（批量下载、删除）
- [ ] 文件搜索功能
- [ ] 回收站功能
- [ ] 文件重命名
- [ ] 拖拽移动文件
- [ ] 存储空间统计
- [ ] 离线文档预览（使用pdf.js、docx-preview等）

## 开发者

开发时间：2026年1月
