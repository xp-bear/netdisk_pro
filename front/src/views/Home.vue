<template>
    <div class="netdisk-container">
        <!-- 顶部导航栏 -->
        <div class="header">
            <div class="logo">
                <img src="@/assets/logo.png" alt="小熊云盒" class="logo-image" />
                <span>小熊云盒</span>
            </div>
            <div class="header-actions">
                <div class="user-info">
                    <el-dropdown @command="handleUserCommand">
                        <span class="user-dropdown">
                            <el-avatar :size="35" :src="userStore.avatar">
                                <el-icon>
                                    <User />
                                </el-icon>
                            </el-avatar>
                            <span class="username">{{ userStore.nickname || userStore.username }}</span>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item disabled>
                                    <div class="storage-info">
                                        <p>存储空间</p>
                                        <el-progress :percentage="userStore.storagePercent"
                                            :color="getStorageColor()" />
                                        <p class="storage-text">
                                            {{ formatFileSize(userStore.storageUsed) }} / {{
                                                formatFileSize(userStore.storageLimit) }}
                                        </p>
                                    </div>
                                </el-dropdown-item>
                                <el-dropdown-item divided command="profile">
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                    个人资料
                                </el-dropdown-item>
                                <el-dropdown-item divided command="logout">
                                    <el-icon>
                                        <SwitchButton />
                                    </el-icon>
                                    退出登录
                                </el-dropdown-item>
                                <!-- <el-dropdown-item  divided command="settings">
                                    <el-icon>
                                        <Setting />
                                    </el-icon>
                                    设置
                                </el-dropdown-item> -->

                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <el-button type="primary" @click="showUploadDialog = true">
                    <el-icon>
                        <Upload />
                    </el-icon>
                    上传文件
                </el-button>
                <el-button @click="showCreateFolderDialog = true">
                    <el-icon>
                        <FolderAdd />
                    </el-icon>
                    新建文件夹
                </el-button>
            </div>
        </div>

        <div class="main-content">
            <!-- 左侧导航 -->
            <div class="sidebar">
                <el-menu :default-active="activeMenu" @select="handleMenuSelect">
                    <el-menu-item index="all">
                        <el-icon>
                            <List />
                        </el-icon>
                        <span>全部文件</span>
                    </el-menu-item>

                    <el-menu-item index="image">
                        <el-icon>
                            <Picture />
                        </el-icon>
                        <span>图片</span>
                    </el-menu-item>
                    <el-menu-item index="video">
                        <el-icon>
                            <VideoCamera />
                        </el-icon>
                        <span>视频</span>
                    </el-menu-item>
                    <el-menu-item index="document">
                        <el-icon>
                            <Document />
                        </el-icon>
                        <span>文档</span>
                    </el-menu-item>
                    <el-menu-item index="zip">
                        <el-icon>
                            <Box />
                        </el-icon>
                        <span>压缩包</span>
                    </el-menu-item>
                    <el-menu-item index="exe">
                        <el-icon>
                            <MessageBox />
                        </el-icon>
                        <span>安装包</span>
                    </el-menu-item>
                    <el-menu-item index="share-square">
                        <el-icon>
                            <Share />
                        </el-icon>
                        <span>分享广场</span>
                    </el-menu-item>
                </el-menu>
            </div>

            <!-- 右侧内容区 -->
            <div class="content-area">
                <!-- 工具栏：面包屑导航 + 视图切换 -->
                <div class="toolbar">
                    <div class="breadcrumb">
                        <el-breadcrumb separator="/">
                            <el-breadcrumb-item v-for="(item, index) in breadcrumb" :key="item.id"
                                @click="navigateTo(index)" class="breadcrumb-item">
                                {{ item.name }}
                            </el-breadcrumb-item>
                        </el-breadcrumb>
                    </div>
                    <div class="view-switch">
                        <el-button :icon="Refresh" @click="handleRefresh" :loading="refreshLoading" title="刷新数据">
                            刷新
                        </el-button>
                        <el-button-group style="margin-left: 10px">
                            <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
                                <el-icon>
                                    <List />
                                </el-icon>
                                列表
                            </el-button>
                            <el-button :type="viewMode === 'card' ? 'primary' : ''" @click="viewMode = 'card'">
                                <el-icon>
                                    <Grid />
                                </el-icon>
                                卡片
                            </el-button>
                        </el-button-group>
                    </div>
                </div>

                <!-- 筛选工具栏 -->
                <div class="filter-toolbar">
                    <div class="filter-left">
                        <!-- 搜索框 -->
                        <el-input v-model="searchKeyword" placeholder="搜索文件名" :prefix-icon="Search" clearable
                            @clear="handleSearch" @keyup.enter="handleSearch"
                            style="width: 300px; margin-right: 15px" />

                        <!-- 文件类型筛选 -->
                        <el-select v-model="fileTypeFilter" placeholder="文件类型" clearable @change="handleSearch"
                            style="width: 150px; margin-right: 15px">
                            <el-option label="全部类型" value="" />
                            <el-option label="📁 文件夹" value="folder" />
                            <el-option label="🖼️ 图片" value="image" />
                            <el-option label="🎬 视频" value="video" />
                            <el-option label="🎵 音频" value="audio" />
                            <el-option label="📝 文档" value="document" />
                            <el-option label="💻 代码" value="code" />
                            <el-option label="🗜️ 压缩包" value="archive" />
                            <el-option label="⚙️ 程序" value="executable" />
                            <el-option label="📃 文本" value="text" />
                            <el-option label="📋 其他" value="other" />
                        </el-select>

                        <!-- 日期范围选择 -->
                        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" @change="handleSearch" style="width: 260px; margin-right: 15px" />

                        <!-- 分享状态筛选 -->
                        <el-select v-model="shareStatusFilter" placeholder="分享状态" clearable @change="handleSearch"
                            style="width: 150px; margin-right: 15px">
                            <el-option label="全部状态" value="" />
                            <el-option label="✅ 已分享" value="shared" />
                            <el-option label="❌ 未分享" value="not-shared" />
                        </el-select>

                        <!-- 文件大小筛选
                        <el-select v-model="sizeFilter" placeholder="文件大小" clearable @change="handleSearch"
                            style="width: 150px; margin-right: 15px">
                            <el-option label="全部大小" value="" />
                            <el-option label="小于1MB" value="0-1" />
                            <el-option label="1MB-10MB" value="1-10" />
                            <el-option label="10MB-100MB" value="10-100" />
                            <el-option label="100MB-1GB" value="100-1024" />
                            <el-option label="大于1GB" value="1024-" />
                        </el-select> -->

                        <!-- 排序方式 -->
                        <el-select v-model="sortBy" placeholder="排序方式" @change="handleSearch" style="width: 150px">
                            <el-option label="按名称排序" value="name" />
                            <el-option label="按时间排序" value="time" />
                            <el-option label="按大小排序" value="size" />
                        </el-select>
                    </div>

                    <div class="filter-right">
                        <el-button @click="resetFilters" :icon="RefreshRight">重置筛选</el-button>
                        <el-tag v-if="hasActiveFilters" type="info" size="small" style="margin-left: 10px">
                            已筛选 {{ filteredTableData.length }} 项
                        </el-tag>
                    </div>
                </div>

                <!-- 批量操作工具栏 -->
                <div v-if="selectedFiles.length > 0" class="batch-toolbar">
                    <div class="batch-info">
                        <el-checkbox v-model="selectAll" @change="handleSelectAll" :indeterminate="isIndeterminate" />
                        <span class="batch-count">已选择 {{ selectedFiles.length }} 项</span>
                    </div>
                    <div class="batch-actions">
                        <el-button v-if="breadcrumb.length > 1" type="primary" :icon="Top" @click="moveToParent">
                            移动到上一级
                        </el-button>
                        <el-button type="warning" :icon="FolderOpened" @click="showMoveDialog = true">
                            移动到文件夹
                        </el-button>
                        <el-button type="danger" :icon="Delete" @click="batchDelete">
                            批量删除
                        </el-button>
                        <el-button @click="clearSelection">取消选择</el-button>
                    </div>
                </div>

                <!-- 列表视图 -->
                <div v-if="viewMode === 'list'" class="file-list">
                    <el-table :data="paginatedData" style="width: 100%" @row-dblclick="handleRowDoubleClick"
                        @selection-change="handleSelectionChange">
                        <!-- 复选框列 -->
                        <el-table-column type="selection" width="55" :selectable="isSelectableRow" />

                        <el-table-column label="文件名" min-width="300">
                            <template #default="{ row }">
                                <div class="file-name"
                                    :draggable="row.type !== 'folder' && activeMenu !== 'share-square'"
                                    @dragstart="handleDragStart($event, row)"
                                    @dragover="row.type === 'folder' ? handleDragOver($event) : null"
                                    @dragleave="row.type === 'folder' ? handleDragLeave($event) : null"
                                    @drop="row.type === 'folder' ? handleDrop($event, row) : null"
                                    :class="{ 'drag-over': row.type === 'folder' && dragOverFolderId === row.id }">
                                    <FileIcon :fileType="row.type" :fileName="row.name" :size="24" />
                                    <span :class="{
                                        'folder-name-clickable': row.type === 'folder',
                                        'file-name-clickable': row.type !== 'folder' && canPreview(row)
                                    }"
                                        @click="row.type === 'folder' ? handleRowDoubleClick(row) : (canPreview(row) ? handlePreview(row) : null)">
                                        {{ row.name }}
                                    </span>
                                    <!-- 分享状态标签 -->
                                    <el-tag v-if="row.isShared && activeMenu !== 'share-square'" size="small"
                                        type="success" style="margin-left: 10px">
                                        已分享
                                    </el-tag>
                                    <el-tag
                                        v-if="row.type === 'folder' && dragOverFolderId === row.id && draggingFileId"
                                        size="small" type="success" style="margin-left: 10px">
                                        松开移动到此
                                    </el-tag>
                                </div>
                            </template>
                        </el-table-column>
                        <!-- 分享广场显示分享者列 -->
                        <el-table-column v-if="activeMenu === 'share-square'" label="分享者" width="180">
                            <template #default="{ row }">
                                <div class="sharer-info">
                                    <el-avatar :size="30" :src="row.avatar">
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                    </el-avatar>
                                    <span style="margin-left: 8px">{{ row.nickname || row.username || '未知用户' }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="size" label="大小" width="150">
                            <template #default="{ row }">
                                {{ row.type === 'folder' ? '-' : formatFileSize(row.size) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" width="200">
                            <template #default="{ row }">
                                {{ formatDate(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="400">
                            <template #default="{ row }">
                                <!-- 分享广场的操作 -->
                                <template v-if="activeMenu === 'share-square'">
                                    <el-button v-if="canPreview(row)" link type="success" @click="handlePreview(row)">
                                        预览
                                    </el-button>
                                    <el-button link type="primary" @click="handleDownload(row)">
                                        下载
                                    </el-button>
                                    <el-button link type="info" @click="handleSaveSharedFile(row)">
                                        保存到我的网盘
                                    </el-button>
                                </template>
                                <!-- 我的文件操作 -->
                                <template v-else>
                                    <el-button v-if="row.type !== 'folder' && canPreview(row)" link type="success"
                                        @click="handlePreview(row)">
                                        预览
                                    </el-button>
                                    <el-button v-if="row.type !== 'folder'" link type="primary"
                                        @click="handleDownload(row)">
                                        下载
                                    </el-button>
                                    <!-- 根据分享状态显示不同的按钮 -->
                                    <el-button v-if="row.type !== 'folder' && !row.isShared" link type="warning"
                                        @click="handleShare(row)">
                                        分享
                                    </el-button>
                                    <el-button v-if="row.type !== 'folder' && row.isShared" link type="info"
                                        @click="handleUnshare(row)">
                                        取消分享
                                    </el-button>
                                    <el-button v-if="row.type === 'folder'" link type="primary"
                                        @click="handleRenameFolder(row)">
                                        重命名
                                    </el-button>
                                    <el-button link type="danger" @click="handleDelete(row)">
                                        删除
                                    </el-button>
                                </template>
                            </template>
                        </el-table-column>
                    </el-table>

                    <!-- 分页组件 -->
                    <div class="pagination-container">
                        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                            :page-sizes="[20, 50, 100, 200]" :total="filteredTableData.length"
                            layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                            @current-change="handleCurrentChange" />
                    </div>
                </div>

                <!-- 卡片视图 -->
                <div v-else class="file-grid-container">
                    <div class="file-grid">
                        <div v-for="item in paginatedData" :key="item.id" class="file-card" :class="{
                            'drag-over': item.type === 'folder' && dragOverFolderId === item.id,
                            'dragging': draggingFileId === item.id,
                            'selected': isFileSelected(item)
                        }" :draggable="item.type !== 'folder'" @dragstart="handleDragStart($event, item)"
                            @dragover="item.type === 'folder' ? handleDragOver($event) : null"
                            @dragleave="item.type === 'folder' ? handleDragLeave($event) : null"
                            @drop="item.type === 'folder' ? handleDrop($event, item) : null" @dragend="handleDragEnd"
                            @dblclick="handleRowDoubleClick(item)">
                            <!-- 卡片复选框 -->
                            <el-checkbox v-if="item.type !== 'folder'" class="card-checkbox"
                                :model-value="isFileSelected(item)" @change="toggleFileSelection(item)" @click.stop />

                            <!-- 拖拽提示遮罩 -->
                            <div v-if="item.type === 'folder' && dragOverFolderId === item.id && draggingFileId"
                                class="drop-hint">
                                <el-icon :size="40" color="#67C23A">
                                    <FolderAdd />
                                </el-icon>
                                <p>松开移动到此文件夹</p>
                            </div>

                            <!-- 卡片缩略图 -->
                            <div class="card-thumbnail" @click="handleCardClick(item)">
                                <!-- 文件夹 -->
                                <div v-if="item.type === 'folder'" class="folder-icon">
                                    <FileIcon :fileType="item.type" :fileName="item.name" :size="80" />
                                </div>
                                <!-- 图片缩略图 -->
                                <div v-else-if="isImage(item)" class="image-thumbnail">
                                    <el-image :src="item.url" fit="cover" style="width: 100%; height: 100%;"
                                        loading="lazy" :hide-on-click-modal="true">
                                        <template #error>
                                            <div class="image-error">
                                                <FileIcon :fileType="item.type" :fileName="item.name" :size="60" />
                                            </div>
                                        </template>
                                    </el-image>
                                    <!-- 预览遮罩 -->
                                    <div class="preview-overlay">
                                        <el-icon :size="40" color="#fff">
                                            <View />
                                        </el-icon>
                                        <span>点击预览</span>
                                    </div>
                                </div>
                                <!-- 视频缩略图 -->
                                <div v-else-if="isVideo(item)" class="video-thumbnail">
                                    <video :src="item.url" style="width: 100%; height: 100%; object-fit: cover;"
                                        @error="handleVideoError"></video>
                                    <div class="video-play-icon">
                                        <el-icon :size="40" color="#fff">
                                            <VideoPlay />
                                        </el-icon>
                                        <span class="play-text">点击播放</span>
                                    </div>
                                </div>
                                <!-- 其他文件类型图标 -->
                                <div v-else class="file-icon-wrapper">
                                    <FileIcon :fileType="item.type" :fileName="item.name" :size="80" />
                                </div>
                            </div>

                            <!-- 卡片信息 -->
                            <div class="card-info">
                                <div class="card-name" :class="{
                                    'folder-name-clickable': item.type === 'folder',
                                    'file-name-clickable': item.type !== 'folder' && canPreview(item)
                                }" :title="item.name"
                                    @click="item.type === 'folder' ? handleRowDoubleClick(item) : (canPreview(item) ? handlePreview(item) : null)">
                                    {{ item.name }}
                                </div>
                                <div class="card-meta">
                                    <span class="card-size">
                                        {{ item.type === 'folder' ? '-' : formatFileSize(item.size) }}
                                    </span>
                                    <!-- 分享状态标签 -->
                                    <el-tag v-if="item.isShared && activeMenu !== 'share-square'" size="small"
                                        type="success" style="margin-left: 8px">
                                        已分享
                                    </el-tag>
                                </div>
                                <!-- 分享广场显示分享者信息 -->
                                <div v-if="activeMenu === 'share-square'" class="card-sharer">
                                    <el-avatar :size="24" :src="item.avatar">
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                    </el-avatar>
                                    <span style="margin-left: 6px; font-size: 12px; color: #909399;">
                                        {{ item.nickname || item.username || '未知用户' }}
                                    </span>
                                </div>
                            </div>

                            <!-- 卡片操作按钮 -->
                            <div class="card-actions">
                                <!-- 分享广场的操作 -->
                                <template v-if="activeMenu === 'share-square'">
                                    <el-button circle size="small" type="info" @click.stop="handleSaveSharedFile(item)">
                                        <el-icon>
                                            <FolderAdd />
                                        </el-icon>
                                    </el-button>
                                    <el-button circle size="small" type="primary" @click.stop="handleDownload(item)">
                                        <el-icon>
                                            <Download />
                                        </el-icon>
                                    </el-button>
                                    <el-button v-if="canPreview(item)" circle size="small" type="success"
                                        @click.stop="handlePreview(item)">
                                        <el-icon>
                                            <View />
                                        </el-icon>
                                    </el-button>
                                </template>
                                <!-- 我的文件操作 -->
                                <template v-else>
                                    <el-button circle size="small" type="danger" @click.stop="handleDelete(item)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                    <el-button v-if="item.type === 'folder'" circle size="small" type="primary"
                                        @click.stop="handleRenameFolder(item)">
                                        <el-icon>
                                            <Edit />
                                        </el-icon>
                                    </el-button>
                                    <!-- 根据分享状态显示不同的按钮 -->
                                    <el-button v-if="item.type !== 'folder' && !item.isShared" circle size="small"
                                        type="warning" @click.stop="handleShare(item)">
                                        <el-icon>
                                            <Share />
                                        </el-icon>
                                    </el-button>
                                    <el-button v-if="item.type !== 'folder' && item.isShared" circle size="small"
                                        type="info" @click.stop="handleUnshare(item)" title="取消分享">
                                        <el-icon>
                                            <CircleClose />
                                        </el-icon>
                                    </el-button>
                                    <el-button v-if="item.type !== 'folder'" circle size="small" type="primary"
                                        @click.stop="handleDownload(item)">
                                        <el-icon>
                                            <Download />
                                        </el-icon>
                                    </el-button>
                                    <el-button v-if="item.type !== 'folder' && canPreview(item)" circle size="small"
                                        type="success" @click.stop="handlePreview(item)">
                                        <el-icon>
                                            <View />
                                        </el-icon>
                                    </el-button>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- 分页组件 -->
                    <div class="pagination-container">
                        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                            :page-sizes="[20, 50, 100, 200]" :total="filteredTableData.length"
                            layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                            @current-change="handleCurrentChange" />
                    </div>
                </div>
            </div>
        </div>

        <el-dialog v-model="showUploadDialog" title="上传文件" width="820px">
            <!-- 上传文件对话框 -->
            <div class="upload-area">
                <!-- 上传模式切换 -->
                <div class="upload-mode-selector">
                    <el-radio-group v-model="uploadMode" @change="handleUploadModeChange">
                        <el-radio-button value="file">上传文件</el-radio-button>
                        <el-radio-button value="folder">上传文件夹</el-radio-button>
                    </el-radio-group>
                </div>

                <!-- 文件上传 -->
                <el-upload v-if="uploadMode === 'file'" drag :auto-upload="false" :on-change="handleFileChange"
                    :show-file-list="false" multiple>
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        将文件拖到此处，或<em>点击选择文件</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">支持多文件上传</div>
                    </template>
                </el-upload>

                <!-- 文件夹上传 -->
                <div v-else class="folder-upload-area">
                    <div class="folder-upload-trigger" @click="triggerFolderInput">
                        <el-icon class="el-icon--upload">
                            <FolderOpened />
                        </el-icon>
                        <div class="el-upload__text">
                            点击选择文件夹
                        </div>
                        <div class="el-upload__tip">支持上传整个文件夹及其子文件夹</div>
                    </div>
                    <input ref="folderInputRef" type="file" webkitdirectory directory multiple style="display: none;"
                        @change="handleFolderChange" />
                </div>

                <!-- 文件列表 -->
                <div v-if="uploadFiles.length > 0" class="upload-files-list">
                    <div class="list-header">
                        <span>已选择 {{ uploadFiles.length }} 个文件</span>
                        <el-checkbox v-model="addTimestamp" label="自动添加时间戳" />
                    </div>

                    <el-table :data="uploadFiles" style="width: 100%; margin-top: 10px;" max-height="300">
                        <el-table-column label="原文件名" width="180">
                            <template #default="{ row }">
                                <el-tooltip :content="row.originalName" placement="top">
                                    <span class="file-name-text">{{ row.originalName }}</span>
                                </el-tooltip>
                            </template>
                        </el-table-column>

                        <el-table-column label="文件夹路径" width="150" v-if="uploadMode === 'folder'">
                            <template #default="{ row }">
                                <el-tooltip :content="row.folderPath || '/'" placement="top">
                                    <span class="file-path-text">{{ row.folderPath || '/' }}</span>
                                </el-tooltip>
                            </template>
                        </el-table-column>

                        <el-table-column label="新文件名" :min-width="uploadMode === 'folder' ? 150 : 200">
                            <template #default="{ row }">
                                <el-input v-model="row.newName" placeholder="输入新文件名" size="small"
                                    @input="updateFileName(row)" />
                            </template>
                        </el-table-column>

                        <el-table-column label="大小" width="100">
                            <template #default="{ row }">
                                {{ formatFileSize(row.file.size) }}
                            </template>
                        </el-table-column>

                        <el-table-column label="进度" width="120">
                            <template #default="{ row }">
                                <el-progress v-if="row.progress > 0" :percentage="row.progress"
                                    :status="row.progress === 100 ? 'success' : undefined" :stroke-width="6" />
                            </template>
                        </el-table-column>

                        <el-table-column label="操作" width="80" fixed="right">
                            <template #default="{ row, $index }">
                                <el-button link type="danger" size="small" @click="removeFile($index)"
                                    :disabled="uploading">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <template #footer>
                <el-button @click="handleCancelUpload">取消</el-button>
                <el-button type="primary" @click="handleBatchUpload" :disabled="uploadFiles.length === 0 || uploading">
                    {{ uploading ? '上传中...' : '开始上传' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 新建文件夹对话框 -->
        <el-dialog v-model="showCreateFolderDialog" title="新建文件夹" width="400px">
            <el-input v-model="newFolderName" placeholder="请输入文件夹名称" @keyup.enter="handleCreateFolder" />
            <template #footer>
                <el-button @click="showCreateFolderDialog = false">取消</el-button>
                <el-button type="primary" @click="handleCreateFolder">确定</el-button>
            </template>
        </el-dialog>

        <!-- 重命名文件夹对话框 -->
        <el-dialog v-model="showRenameFolderDialog" title="重命名文件夹" width="400px">
            <el-input v-model="newFolderName" placeholder="请输入新的文件夹名称" @keyup.enter="handleConfirmRename" />
            <template #footer>
                <el-button @click="showRenameFolderDialog = false">取消</el-button>
                <el-button type="primary" @click="handleConfirmRename">确定</el-button>
            </template>
        </el-dialog>

        <!-- 图片预览对话框 -->
        <el-dialog v-model="showImagePreview" title="图片预览" width="80%" top="2vh" @close="closePreview">
            <div class="image-preview-container">
                <div class="image-wrapper">
                    <img ref="previewImageRef" :src="previewUrl" :style="imagePreviewStyle" @load="handleImageLoad"
                        alt="预览图片" />
                </div>
                <div class="preview-info">
                    <p>文件名: {{ previewFile?.name }}</p>
                    <p>大小: {{ formatFileSize(previewFile?.size) }}</p>
                    <p v-if="imageDimensions.width && imageDimensions.height">
                        尺寸: {{ imageDimensions.width }} × {{ imageDimensions.height }}
                    </p>
                </div>
            </div>
        </el-dialog>

        <!-- 视频预览对话框 -->
        <el-dialog v-model="showVideoPreview" title="视频预览" width="80%" top="2vh" @close="closePreview">
            <div class="video-preview-container">
                <video :src="previewUrl" controls style="width: 100%; max-height: 70vh;" autoplay>
                    您的浏览器不支持视频播放
                </video>
                <div class="preview-info">
                    <p>文件名: {{ previewFile?.name }}</p>
                    <p>大小: {{ formatFileSize(previewFile?.size) }}</p>
                </div>
            </div>
        </el-dialog>

        <!-- 文档预览对话框 -->
        <el-dialog v-model="showDocumentPreview" title="文档预览" width="80%" top="2vh" @close="closePreview"
            :fullscreen="isFullscreen">
            <template #header>
                <div class="document-header">
                    <span>{{ previewFile?.name }}</span>
                    <el-button-group>
                        <el-button :icon="isFullscreen ? 'CloseBold' : 'FullScreen'" @click="toggleFullscreen" circle
                            size="small" />
                        <el-button icon="Download" @click="handleDownload(previewFile)" circle size="small" />
                    </el-button-group>
                </div>
            </template>
            <div class="document-preview-container">
                <div v-if="documentLoading" class="loading-container">
                    <el-icon class="is-loading" :size="40">
                        <Loading />
                    </el-icon>
                    <p>文档加载中，请稍候...</p>
                </div>
                <iframe v-show="!documentLoading" :src="documentPreviewUrl" @load="handleDocumentLoad" frameborder="0"
                    class="document-iframe"></iframe>
            </div>
            <template #footer>
                <div class="preview-info">
                    <p>文件名: {{ previewFile?.name }}</p>
                    <p>大小: {{ formatFileSize(previewFile?.size) }}</p>
                    <p class="preview-tip">💡 提示：使用微软Office在线预览服务，支持Word、Excel、PPT、PDF格式</p>
                </div>
            </template>
        </el-dialog>

        <!-- 移动到文件夹对话框 -->
        <el-dialog v-model="showMoveDialog" title="选择目标文件夹" width="600px">
            <div class="move-dialog-content">
                <el-tree ref="folderTreeRef" :data="folderTreeData" node-key="id"
                    :props="{ children: 'children', label: 'name' }" :default-expand-all="true"
                    :highlight-current="true" @node-click="handleFolderNodeClick">
                    <template #default="{ node, data }">
                        <span class="tree-node">
                            <el-icon color="#FFB800">
                                <Folder />
                            </el-icon>
                            <span style="margin-left: 8px">{{ node.label }}</span>
                        </span>
                    </template>
                </el-tree>
                <div v-if="selectedTargetFolder" class="selected-folder-info">
                    <el-alert title="已选择目标文件夹" type="success" :closable="false" style="margin-top: 15px">
                        <template #default>
                            <strong>{{ selectedTargetFolder.name }}</strong>
                        </template>
                    </el-alert>
                </div>
            </div>
            <template #footer>
                <el-button @click="showMoveDialog = false">取消</el-button>
                <el-button type="primary" @click="confirmMoveToFolder" :disabled="!selectedTargetFolder">
                    确定移动
                </el-button>
            </template>
        </el-dialog>

        <!-- 文本/代码预览对话框 -->
        <el-dialog v-model="showTextPreview" :title="`${isEditing ? '编辑' : '预览'} - ${previewFile?.name}`" width="80%"
            top="3vh" @close="closePreview" :fullscreen="isFullscreen">
            <template #header>
                <div class="text-preview-header">
                    <span>{{ isEditing ? '编辑' : '预览' }} - {{ previewFile?.name }}</span>
                    <el-button-group>
                        <el-button :icon="isEditing ? 'View' : 'Edit'" @click="toggleEditMode" circle size="small"
                            :type="isEditing ? 'primary' : 'default'">
                        </el-button>
                        <el-button v-if="isEditing" icon="Check" @click="saveTextContent" circle size="small"
                            type="success">
                        </el-button>
                        <el-button :icon="isFullscreen ? 'CloseBold' : 'FullScreen'" @click="toggleFullscreen" circle
                            size="small" />
                        <el-button icon="Download" @click="handleDownload(previewFile)" circle size="small" />
                    </el-button-group>
                </div>
            </template>

            <div class="text-preview-container">
                <div v-if="textLoading" class="loading-container">
                    <el-icon class="is-loading" :size="40">
                        <Loading />
                    </el-icon>
                    <p>正在加载文件内容...</p>
                </div>

                <!-- 编辑模式 -->
                <el-input v-if="!textLoading && isEditing" v-model="textContent" type="textarea" :rows="25"
                    placeholder="请输入内容..." class="text-editor" />

                <!-- 预览模式 -->
                <div v-if="!textLoading && !isEditing" class="text-preview-content">
                    <pre><code>{{ textContent }}</code></pre>
                </div>
            </div>

            <template #footer>
                <div class="preview-info">
                    <p>文件名: {{ previewFile?.name }}</p>
                    <p>大小: {{ formatFileSize(previewFile?.size) }}</p>
                    <p>行数: {{ textContent.split('\n').length }}</p>
                    <p class="preview-tip">💡 提示：点击编辑按钮可以修改文件内容</p>
                </div>
            </template>
        </el-dialog>

        <!-- 音频预览对话框 -->
        <el-dialog v-model="showAudioPreview" title="音频播放" width="600px" top="10vh" @close="closePreview">
            <div class="audio-preview-container">
                <div class="audio-cover">
                    <el-icon :size="100" color="#409EFF">
                        <Headset />
                    </el-icon>
                </div>
                <audio ref="audioPlayerRef" :src="previewUrl" controls controlsList="nodownload"
                    style="width: 100%; margin-top: 20px;" autoplay>
                    您的浏览器不支持音频播放
                </audio>
                <div class="preview-info">
                    <p>文件名: {{ previewFile?.name }}</p>
                    <p>大小: {{ formatFileSize(previewFile?.size) }}</p>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Folder,
    Upload,
    FolderAdd,
    FolderOpened,
    List,
    Picture,
    VideoCamera,
    Document,
    Box,
    MessageBox,
    UploadFilled,
    Grid,
    View,
    Download,
    Delete,
    VideoPlay,
    Loading,
    FullScreen,
    Close,
    CircleClose,
    Search,
    RefreshRight,
    Refresh,
    Top,
    Share,
    Link,
    Edit,
    Headset,
    User,
    Setting,
    SwitchButton
} from '@element-plus/icons-vue'
import { useFileStore } from '@/stores/file'
import { useUserStore } from '@/stores/user'
import { uploadFileToOSS, deleteFileFromOSS } from '@/utils/oss'
import { shareApi } from '@/api'
import { useRouter } from 'vue-router'
import FileIcon from '@/components/FileIcon.vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' // 使用 Atom One Dark 主题

const fileStore = useFileStore()
const userStore = useUserStore()
const router = useRouter()

// 所有文件缓存（用于侧边栏筛选）
const allFilesList = ref([])

// 分享广场相关状态
const sharedFiles = ref([]) // 分享广场文件列表
const sharedFilesTotal = ref(0) // 分享广场文件总数

const activeMenu = ref('all')
const viewMode = ref('list') // 'list' 或 'card'

// 分页相关状态
const currentPage = ref(1) // 当前页码
const pageSize = ref(20) // 每页显示数量
const showUploadDialog = ref(false)
const showCreateFolderDialog = ref(false)
const showImagePreview = ref(false)
const showVideoPreview = ref(false)
const showDocumentPreview = ref(false)
const showTextPreview = ref(false)
const showAudioPreview = ref(false)
const showMoveDialog = ref(false)
const showRenameFolderDialog = ref(false)
const previewUrl = ref('')
const previewFile = ref(null)
const previewImageRef = ref(null)
const audioPlayerRef = ref(null)
const imageDimensions = ref({ width: 0, height: 0 })
const uploadMode = ref('file') // 'file' 或 'folder'
const folderInputRef = ref(null)
const imagePreviewStyle = ref({})
const documentPreviewUrl = ref('')
const documentLoading = ref(true)
const isFullscreen = ref(false)
const textContent = ref('')
const isEditing = ref(false)
const textLoading = ref(false)
const newFolderName = ref('')
const renamingFolder = ref(null)
const uploadFiles = ref([]) // 多文件列表
const uploading = ref(false)
const addTimestamp = ref(true) // 是否添加时间戳，默认选中
const refreshLoading = ref(false) // 刷新加载状态

// 拖拽相关状态
const draggingFileId = ref(null) // 正在拖拽的文件ID
const dragOverFolderId = ref(null) // 鼠标悬停的文件夹ID

// 筛选相关状态
const searchKeyword = ref('') // 搜索关键词
const fileTypeFilter = ref('') // 文件类型筛选
const dateRange = ref(null) // 日期范围
const sizeFilter = ref('') // 文件大小筛选
const shareStatusFilter = ref('') // 分享状态筛选
const sortBy = ref('time') // 排序方式：name/time/size

// 批量操作相关状态
const selectedFiles = ref([]) // 选中的文件列表
const selectAll = ref(false) // 全选状态
const selectedTargetFolder = ref(null) // 选中的目标文件夹
const folderTreeRef = ref(null) // 文件夹树引用

const breadcrumb = computed(() => fileStore.breadcrumb)
const folders = computed(() => fileStore.folders)
const files = computed(() => fileStore.files)
const allFolders = computed(() => fileStore.allFolders)

// 合并文件夹和文件到表格数据
const tableData = computed(() => {
    // 如果是分享广场，显示分享的文件
    if (activeMenu.value === 'share-square') {
        return sharedFiles.value.map(f => ({ ...f, type: 'file', isShared: true }))
    }

    // 如果是"全部文件"，显示当前目录的文件夹和文件
    if (activeMenu.value === 'all') {
        const folderList = folders.value.map(f => ({ ...f, type: 'folder' }))
        const fileList = files.value.map(f => ({ ...f, type: 'file' }))
        return [...folderList, ...fileList]
    }

    // 如果是其他菜单项，从所有文件中筛选对应类型
    const filteredFiles = allFilesList.value.filter(file => {
        const category = getFileCategory(file)

        // 根据侧边栏选项筛选
        switch (activeMenu.value) {
            case 'image':
                return category === 'image'
            case 'video':
                return category === 'video'
            case 'document':
                return category === 'document'
            case 'zip':
                return category === 'archive'
            case 'exe':
                return category === 'executable'
            default:
                return true
        }
    })

    return filteredFiles.map(f => ({ ...f, type: 'file' }))
})

// 根据文件名获取文件类别
function getFileCategory(item) {
    if (item.type === 'folder') return 'folder'

    const ext = item.name.split('.').pop().toLowerCase()

    // 图片
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
        return 'image'
    }
    // 视频
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
        return 'video'
    }
    // 音频
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) {
        return 'audio'
    }
    // 文档
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'].includes(ext)) {
        return 'document'
    }
    // 代码
    if (['js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'html', 'xml',
        'java', 'py', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'json'].includes(ext)) {
        return 'code'
    }
    // 压缩包
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
        return 'archive'
    }
    // 可执行文件
    if (['exe', 'msi', 'dmg', 'apk', 'ipa'].includes(ext)) {
        return 'executable'
    }
    // 文本
    if (['txt', 'md', 'markdown', 'log', 'ini', 'cfg', 'conf'].includes(ext)) {
        return 'text'
    }

    return 'other'
}

// 筛选后的数据
const filteredTableData = computed(() => {
    let result = [...tableData.value]

    // 1. 按文件名搜索
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.trim().toLowerCase()
        result = result.filter(item =>
            item.name.toLowerCase().includes(keyword)
        )
    }

    // 2. 按文件类型筛选
    if (fileTypeFilter.value) {
        result = result.filter(item => {
            return getFileCategory(item) === fileTypeFilter.value
        })
    }

    // 3. 按日期范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
        const [startDate, endDate] = dateRange.value
        result = result.filter(item => {
            if (!item.createdAt) return false
            const itemDate = new Date(item.createdAt).toISOString().split('T')[0]
            return itemDate >= startDate && itemDate <= endDate
        })
    }

    // 4. 按文件大小筛选（文件夹不参与大小筛选）
    if (sizeFilter.value) {
        const [min, max] = sizeFilter.value.split('-').map(v => v ? parseFloat(v) : null)
        result = result.filter(item => {
            if (item.type === 'folder') return true // 文件夹始终显示
            const sizeMB = (item.size || 0) / (1024 * 1024)
            if (min !== null && max !== null) {
                return sizeMB >= min && sizeMB < max
            } else if (min !== null) {
                return sizeMB >= min
            } else if (max !== null) {
                return sizeMB < max
            }
            return true
        })
    }

    // 5. 按分享状态筛选（仅对非分享广场页面生效）
    if (shareStatusFilter.value && activeMenu.value !== 'share-square') {
        result = result.filter(item => {
            // 文件夹不参与分享状态筛选
            if (item.type === 'folder') return true

            if (shareStatusFilter.value === 'shared') {
                return item.isShared === true || item.isShared === 1
            } else if (shareStatusFilter.value === 'not-shared') {
                return !item.isShared || item.isShared === 0
            }
            return true
        })
    }

    // 6. 排序
    result.sort((a, b) => {
        // 文件夹始终在前
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1

        // 根据排序方式
        switch (sortBy.value) {
            case 'name':
                return a.name.localeCompare(b.name, 'zh-CN')
            case 'size':
                return (b.size || 0) - (a.size || 0)
            case 'time':
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
    })

    return result
})

// 分页后的数据
const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredTableData.value.slice(start, end)
})

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
    return searchKeyword.value.trim() !== '' ||
        fileTypeFilter.value !== '' ||
        dateRange.value !== null ||
        sizeFilter.value !== '' ||
        shareStatusFilter.value !== ''
})

// 全选是否为半选状态
const isIndeterminate = computed(() => {
    const fileCount = filteredTableData.value.filter(item => item.type !== 'folder').length
    return selectedFiles.value.length > 0 && selectedFiles.value.length < fileCount
})

// 构建文件夹树数据（用于移动对话框）
const folderTreeData = computed(() => {
    // 递归构建文件夹树
    const buildTree = (parentId) => {
        return allFolders.value
            .filter(f => f.parentId === parentId)
            .map(folder => ({
                id: folder.id,
                name: folder.name,
                parentId: folder.parentId,
                children: buildTree(folder.id)
            }))
    }

    return [{
        id: 0,
        name: '根目录',
        children: buildTree(0)
    }]
})

onMounted(async () => {
    fileStore.loadCurrentDir()
    fileStore.loadAllFolders()

    // 加载所有文件（用于侧边栏筛选）
    allFilesList.value = await fileStore.getAllFiles()

    // 监听键盘事件
    window.addEventListener('keydown', handleKeyDown)

    // 监听剪贴板粘贴事件
    window.addEventListener('paste', handlePaste)
})

// 组件卸载时移除监听
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('paste', handlePaste)
})

// 处理键盘按键事件
function handleKeyDown(event) {
    // 检查是否按下退格键（Backspace）
    if (event.key === 'Backspace') {
        // 如果焦点在输入框或文本域中，不执行返回操作
        const target = event.target
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
        }

        // 如果有对话框打开，不执行返回操作
        if (showUploadDialog.value || showCreateFolderDialog.value || showRenameFolderDialog.value ||
            showImagePreview.value || showVideoPreview.value || showDocumentPreview.value ||
            showTextPreview.value || showAudioPreview.value || showMoveDialog.value) {
            return
        }

        // 阻止浏览器默认的后退行为
        event.preventDefault()

        // 如果不在根目录，返回上一级
        if (breadcrumb.value.length > 1) {
            const parentIndex = breadcrumb.value.length - 2
            navigateTo(parentIndex)
            ElMessage.success('已返回上一级目录')
        } else {
            ElMessage.info('已经在根目录')
        }
    }
}

// 处理剪贴板粘贴事件
function handlePaste(event) {
    // 如果焦点在输入框、文本域或可编辑元素中，不处理文件粘贴
    const target = event.target
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
    }

    // 如果正在编辑文本文件，不处理文件粘贴
    if (isEditing.value) {
        return
    }

    // 如果已经打开上传对话框且正在上传，不处理
    if (showUploadDialog.value && uploading.value) {
        return
    }

    // 获取剪贴板数据
    const clipboardData = event.clipboardData || window.clipboardData
    if (!clipboardData) return

    const items = clipboardData.items
    if (!items || items.length === 0) return

    // 收集所有文件
    const files = []
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        // 检查是否是文件类型
        if (item.kind === 'file') {
            const file = item.getAsFile()
            if (file) {
                files.push(file)
            }
        }
    }

    // 如果有文件，处理上传
    if (files.length > 0) {
        event.preventDefault() // 阻止默认的粘贴行为
        handlePasteFiles(files)
    }
}

// 处理粘贴的文件
function handlePasteFiles(files) {
    // 清空之前的上传列表
    uploadFiles.value = []

    // 设置为文件上传模式
    uploadMode.value = 'file'

    // 添加文件到上传列表
    files.forEach(file => {
        const newFile = {
            id: Date.now() + Math.random(),
            file: file,
            originalName: file.name,
            newName: file.name,
            folderPath: '',
            progress: 0
        }

        // 如果开启了时间戳，自动添加
        if (addTimestamp.value) {
            newFile.newName = addTimestampToFileName(file.name)
        }

        uploadFiles.value.push(newFile)
    })

    // 打开上传对话框
    showUploadDialog.value = true

    // 提示用户
    ElMessage.success({
        message: `已从剪贴板添加 ${files.length} 个文件`,
        duration: 2000
    })
}

// 用户下拉菜单命令处理
function handleUserCommand(command) {
    switch (command) {
        case 'profile':
            router.push('/profile')
            break
        case 'settings':
            ElMessage.info('设置功能开发中')
            break
        case 'logout':
            handleLogout()
            break
    }
}

// 退出登录
async function handleLogout() {
    try {
        await ElMessageBox.confirm(
            '确定要退出登录吗？',
            '退出登录',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
    } catch (error) {
        // 用户取消
    }
}

// 获取存储空间颜色
function getStorageColor() {
    const percent = userStore.storagePercent
    if (percent >= 90) return '#F56C6C'
    if (percent >= 70) return '#E6A23C'
    return '#67C23A'
}

// 菜单选择
async function handleMenuSelect(index) {
    activeMenu.value = index
    // 切换菜单时重置页码
    currentPage.value = 1

    // 如果是分享广场，加载分享文件
    if (index === 'share-square') {
        await loadSharedFiles()
    }
    // 如果不是"全部文件"和"分享广场"，重新加载所有文件数据
    else if (index !== 'all') {
        allFilesList.value = await fileStore.getAllFiles()
    }
}

// 分页大小改变
function handleSizeChange(val) {
    pageSize.value = val
    currentPage.value = 1 // 重置到第一页
}

// 当前页改变
function handleCurrentChange(val) {
    currentPage.value = val
}

// 导航到指定路径
function navigateTo(index) {
    fileStore.navigateTo(index)
}

// 双击行事件
function handleRowDoubleClick(row) {
    if (row.type === 'folder') {
        fileStore.enterFolder(row)
    } else if (canPreview(row)) {
        // 如果支持预览，打开预览
        handlePreview(row)
    } else {
        // 否则下载
        handleDownload(row)
    }
}

// 获取文件图标
function getFileIcon(row) {
    if (row.type === 'folder') return 'Folder'

    const ext = row.name.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'Picture'
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) return 'VideoCamera'
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) return 'Headset'
    if (['doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'Document'
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Box'
    if (['exe', 'msi', 'dmg', 'pkg'].includes(ext)) return 'Box'
    if (['txt', 'md', 'json', 'js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'html',
        'xml', 'java', 'py', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml'].includes(ext)) return 'Document'
    return 'Document'
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期 - 智能显示
function formatDate(dateString) {
    if (!dateString) return '-'

    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date // 时间差（毫秒）

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)

    // 超过6个月，显示完整日期时间
    if (months >= 6) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        const second = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }
    // 刚刚（1分钟内）
    else if (seconds < 60) {
        return '刚刚'
    }
    // X分钟前（1小时内）
    else if (minutes < 60) {
        return `${minutes}分钟前`
    }
    // X小时前（24小时内）
    else if (hours < 24) {
        return `${hours}小时前`
    }
    // 昨天（1-2天）
    else if (days === 1) {
        return '昨天'
    }
    // X天前（7天内）
    else if (days < 7) {
        return `${days}天前`
    }
    // 本周/上周（14天内）
    else if (days < 14) {
        return '上周'
    }
    // X个月前（6个月内）
    else if (months < 6) {
        return `${months}个月前`
    }
}

// 生成时间戳
function generateTimestamp() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}_${hour}${minute}${second}`
}

// 添加时间戳到文件名
function addTimestampToFileName(fileName) {
    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
        return `${fileName}_${generateTimestamp()}`
    }
    const name = fileName.substring(0, lastDotIndex)
    const ext = fileName.substring(lastDotIndex)
    return `${name}_${generateTimestamp()}${ext}`
}

// 文件选择变化（支持多文件）
function handleFileChange(file, fileList) {
    const newFile = {
        id: Date.now() + Math.random(), // 唯一ID
        file: file.raw,
        originalName: file.name,
        newName: file.name,
        folderPath: '', // 文件夹路径
        progress: 0
    }

    // 如果开启了时间戳，自动添加
    if (addTimestamp.value) {
        newFile.newName = addTimestampToFileName(file.name)
    }

    uploadFiles.value.push(newFile)
}

// 触发文件夹选择
function triggerFolderInput() {
    if (folderInputRef.value) {
        folderInputRef.value.click()
    }
}

// 文件夹选择变化
function handleFolderChange(event) {
    const files = event.target.files
    if (!files || files.length === 0) return

    // 处理文件夹中的所有文件
    Array.from(files).forEach(file => {
        // 获取文件的相对路径
        const relativePath = file.webkitRelativePath || file.name
        const pathParts = relativePath.split('/')

        // 提取文件夹路径（去掉文件名）
        const folderPath = pathParts.length > 1
            ? pathParts.slice(0, -1).join('/')
            : ''

        const newFile = {
            id: Date.now() + Math.random(),
            file: file,
            originalName: file.name,
            newName: file.name,
            folderPath: folderPath, // 保存文件夹路径
            progress: 0
        }

        // 如果开启了时间戳，自动添加
        if (addTimestamp.value) {
            newFile.newName = addTimestampToFileName(file.name)
        }

        uploadFiles.value.push(newFile)
    })

    // 清空input，允许重复选择同一文件夹
    event.target.value = ''
}

// 切换上传模式
function handleUploadModeChange() {
    // 清空已选文件
    uploadFiles.value = []
}

// 更新文件名
function updateFileName(row) {
    // 可以在这里添加文件名验证逻辑
}

// 删除文件
function removeFile(index) {
    uploadFiles.value.splice(index, 1)
}

// 取消上传
function handleCancelUpload() {
    if (uploading.value) {
        ElMessageBox.confirm('上传正在进行中，确定要取消吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            showUploadDialog.value = false
            uploadFiles.value = []
            uploading.value = false
        }).catch(() => { })
    } else {
        showUploadDialog.value = false
        uploadFiles.value = []
    }
}

// 批量上传文件
async function handleBatchUpload() {
    if (uploadFiles.value.length === 0) return

    uploading.value = true
    let successCount = 0
    let failCount = 0

    try {
        // 如果是文件夹上传模式，需要先创建文件夹结构
        const folderMap = new Map() // 用于存储创建的文件夹ID映射

        if (uploadMode.value === 'folder') {
            // 收集所有需要创建的文件夹路径
            const folderPaths = new Set()
            uploadFiles.value.forEach(fileItem => {
                if (fileItem.folderPath) {
                    console.log(`文件 ${fileItem.originalName} 的文件夹路径:`, fileItem.folderPath)
                    const paths = fileItem.folderPath.split('/')
                    let currentPath = ''
                    paths.forEach(folderName => {
                        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName
                        folderPaths.add(currentPath)
                    })
                }
            })

            console.log('需要创建的文件夹路径列表:', Array.from(folderPaths))

            // 按路径深度排序，确保父文件夹先创建
            const sortedPaths = Array.from(folderPaths).sort((a, b) => {
                return a.split('/').length - b.split('/').length
            })

            console.log('排序后的文件夹路径:', sortedPaths)

            // 依次创建文件夹
            for (const path of sortedPaths) {
                try {
                    const pathParts = path.split('/')
                    const folderName = pathParts[pathParts.length - 1]
                    const parentPath = pathParts.slice(0, -1).join('/')

                    console.log(`正在创建文件夹: ${path}, 文件夹名: ${folderName}, 父路径: ${parentPath}`)

                    // 查找父文件夹ID
                    const parentId = parentPath ? folderMap.get(parentPath) : null

                    console.log(`父文件夹ID: ${parentId}`)

                    // 创建文件夹
                    const result = await fileStore.createFolder(folderName, parentId)

                    console.log(`创建文件夹返回结果:`, result)

                    if (result && result.success && result.data && result.data.id) {
                        folderMap.set(path, result.data.id)
                        console.log(`✓ 创建文件夹成功: ${path}, ID: ${result.data.id}`)
                    } else {
                        console.error(`✗ 创建文件夹失败: ${path}, 返回结果:`, result)
                    }
                } catch (error) {
                    console.error(`✗ 创建文件夹 ${path} 异常:`, error)
                }
            }

            console.log('最终的 folderMap:', folderMap)
        }

        // 上传所有文件
        for (let i = 0; i < uploadFiles.value.length; i++) {
            const fileItem = uploadFiles.value[i]

            try {
                // 获取文件类型
                const ext = fileItem.originalName.split('.').pop().toLowerCase()
                let fileType = 'other'
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) fileType = 'image'
                else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) fileType = 'video'
                else if (['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) fileType = 'document'
                else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) fileType = 'zip'
                else if (['exe', 'msi', 'dmg', 'pkg'].includes(ext)) fileType = 'exe'

                // 创建新文件对象（使用新文件名）
                const newFile = new File([fileItem.file], fileItem.newName, { type: fileItem.file.type })

                // 确定文件所属的文件夹ID
                let folderId = undefined // 改为 undefined，表示未指定
                if (uploadMode.value === 'folder' && fileItem.folderPath) {
                    folderId = folderMap.get(fileItem.folderPath) || undefined
                    console.log(`文件 ${fileItem.newName} 的文件夹路径: ${fileItem.folderPath}, 文件夹ID: ${folderId}`)
                }
                // 如果是单文件上传模式，folderId 保持 undefined，会使用当前文件夹

                // 上传到OSS
                const result = await uploadFileToOSS(
                    newFile,
                    `netdisk/${fileType}`,
                    (progress) => {
                        fileItem.progress = Math.floor(progress * 100)
                    }
                )

                if (result.success) {
                    // 保存文件记录到数据库
                    await fileStore.createFile({
                        name: fileItem.newName,
                        url: result.url,
                        ossPath: result.name,
                        size: fileItem.file.size,
                        fileType: fileType,
                        folderId: folderId // 关联到对应的文件夹
                    })

                    console.log(`文件 ${fileItem.newName} 上传成功，关联文件夹ID: ${folderId}`)

                    fileItem.progress = 100
                    successCount++
                } else {
                    failCount++
                    console.error(`文件 ${fileItem.newName} 上传失败:`, result.error)
                }
            } catch (error) {
                failCount++
                console.error(`文件 ${fileItem.newName} 上传失败:`, error)
            }
        }

        // 显示结果
        if (failCount === 0) {
            ElMessage.success(`成功上传 ${successCount} 个文件`)
        } else {
            ElMessage.warning(`成功上传 ${successCount} 个文件，失败 ${failCount} 个文件`)
        }

        // 关闭对话框并清空列表
        showUploadDialog.value = false
        uploadFiles.value = []

    } catch (error) {
        console.error('批量上传失败:', error)
        ElMessage.error('批量上传失败')
    } finally {
        uploading.value = false
    }
}

// 监听时间戳开关变化
watch(addTimestamp, (newVal) => {
    uploadFiles.value.forEach(fileItem => {
        if (newVal) {
            // 如果文件名还没有时间戳，添加时间戳
            if (!fileItem.newName.includes('_')) {
                fileItem.newName = addTimestampToFileName(fileItem.originalName)
            }
        } else {
            // 移除时间戳，恢复原文件名
            fileItem.newName = fileItem.originalName
        }
    })
})

// 创建文件夹
async function handleCreateFolder() {
    if (!newFolderName.value.trim()) {
        ElMessage.warning('请输入文件夹名称')
        return
    }

    const result = await fileStore.createFolder(newFolderName.value.trim())
    if (result.success) {
        ElMessage.success('创建成功')
        showCreateFolderDialog.value = false
        newFolderName.value = ''
        // 重新加载所有文件夹以更新文件夹树
        await fileStore.loadAllFolders()
    } else {
        ElMessage.error('创建失败')
    }
}

// 打开重命名文件夹对话框
function handleRenameFolder(folder) {
    renamingFolder.value = folder
    newFolderName.value = folder.name
    showRenameFolderDialog.value = true
}

// 确认重命名文件夹
async function handleConfirmRename() {
    if (!newFolderName.value.trim()) {
        ElMessage.warning('请输入文件夹名称')
        return
    }

    if (newFolderName.value.trim() === renamingFolder.value.name) {
        ElMessage.warning('文件夹名称未改变')
        return
    }

    const result = await fileStore.renameFolder(renamingFolder.value.id, newFolderName.value.trim())
    if (result.success) {
        ElMessage.success('重命名成功')
        showRenameFolderDialog.value = false
        newFolderName.value = ''
        renamingFolder.value = null
        // 重新加载所有文件夹以更新文件夹树
        await fileStore.loadAllFolders()
    } else {
        ElMessage.error('重命名失败')
    }
}

// 删除
async function handleDelete(row) {
    try {
        await ElMessageBox.confirm(
            `确定要删除 "${row.name}" 吗？${row.type === 'folder' ? '（将同时删除文件夹内所有内容）' : ''}`,
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        if (row.type === 'folder') {
            // 显示加载提示
            const loading = ElMessage({ message: '正在删除文件夹...', duration: 0 })

            // 删除文件夹（会返回需要删除的OSS文件列表）
            const result = await fileStore.deleteFolder(row.id)

            if (result.success) {
                // 删除OSS文件（只删除没有被其他用户引用的文件）
                if (result.ossFilesToDelete && result.ossFilesToDelete.length > 0) {
                    console.log(`准备删除 ${result.ossFilesToDelete.length} 个OSS文件（已检查引用计数）`)
                    const deletePromises = result.ossFilesToDelete.map(ossPath =>
                        deleteFileFromOSS(ossPath).catch(err => {
                            console.warn(`删除OSS文件失败 [${ossPath}]:`, err)
                            return { success: false }
                        })
                    )
                    await Promise.all(deletePromises)
                } else {
                    console.log('文件夹中的文件仍被其他用户引用，不删除OSS文件')
                }

                loading.close()
                ElMessage.success('删除成功')

                // 重新加载所有文件夹以更新文件夹树
                await fileStore.loadAllFolders()
            } else {
                loading.close()
                ElMessage.error('删除失败')
            }
        } else {
            // 删除数据库记录（后端会检查引用计数）
            const result = await fileStore.deleteFile(row.id)

            // 如果后端返回需要删除OSS文件，则删除
            if (result.success && result.shouldDeleteOSS) {
                console.log(`文件未被其他用户引用，删除OSS文件: ${result.ossPath}`)
                const ossResult = await deleteFileFromOSS(result.ossPath)
                if (!ossResult.success) {
                    console.warn('OSS文件删除失败:', ossResult.error)
                }
            } else if (result.success) {
                console.log('文件仍被其他用户引用，不删除OSS文件')
            }

            if (result.success) {
                ElMessage.success('删除成功')
            } else {
                ElMessage.error('删除失败')
            }
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除失败:', error)
            ElMessage.error('删除失败')
        }
    }
}

// 判断文件是否可以预览
function canPreview(row) {
    const ext = row.name.split('.').pop().toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf',
        'txt', 'md', 'json', 'js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'html',
        'xml', 'java', 'py', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml',
        'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)
}

// 预览文件
function handlePreview(row) {
    const ext = row.name.split('.').pop().toLowerCase()
    console.log('预览文件:', row.name, '扩展名:', ext)
    previewFile.value = row
    previewUrl.value = row.url

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg'].includes(ext)) {
        // 图片预览
        console.log('打开图片预览')
        showImagePreview.value = true
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
        // 视频预览
        console.log('打开视频预览')
        showVideoPreview.value = true
    } else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) {
        // 音频预览
        console.log('打开音频预览')
        showAudioPreview.value = true
    } else if (ext === 'pdf') {
        // PDF 文件使用浏览器原生预览
        console.log('打开 PDF 预览')
        window.open(row.url, '_blank')
    } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
        // Office 文档预览
        console.log('打开 Office 文档预览')
        openDocumentPreview(row)
    } else if (['txt', 'md', 'json', 'js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'html',
        'xml', 'java', 'py', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml'].includes(ext)) {
        // 文本/代码预览
        console.log('打开文本/代码预览')
        openTextPreview(row)
    } else {
        ElMessage.warning('该文件类型暂不支持预览')
    }
}

// 打开文档预览（Office 文档）
function openDocumentPreview(row) {
    console.log('openDocumentPreview 被调用, URL:', row.url)
    documentLoading.value = true
    // 使用微软Office在线预览服务
    // 需要将文件URL编码后传递给微软的预览服务
    const encodedUrl = encodeURIComponent(row.url)
    documentPreviewUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`
    console.log('文档预览URL:', documentPreviewUrl.value)
    showDocumentPreview.value = true
    console.log('showDocumentPreview 设置为 true')
}

// 文档加载完成
function handleDocumentLoad() {
    documentLoading.value = false
}

// 切换全屏
function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
}

// 关闭预览
function closePreview() {
    // 如果是音频预览，暂停播放
    if (audioPlayerRef.value) {
        audioPlayerRef.value.pause()
        audioPlayerRef.value.currentTime = 0
    }

    previewUrl.value = ''
    previewFile.value = null
    imageDimensions.value = { width: 0, height: 0 }
    imagePreviewStyle.value = {}
    documentPreviewUrl.value = ''
    documentLoading.value = true
    isFullscreen.value = false
    textContent.value = ''
    isEditing.value = false
    textLoading.value = false
}

// 打开文本/代码预览
async function openTextPreview(row) {
    showTextPreview.value = true
    textLoading.value = true
    isEditing.value = false

    try {
        // 从OSS获取文件内容
        const response = await fetch(row.url)
        const text = await response.text()
        textContent.value = text

        // 自动应用语法高亮
        await applyHighlight()
    } catch (error) {
        console.error('加载文件内容失败:', error)
        ElMessage.error('加载文件内容失败')
        textContent.value = '无法加载文件内容'
    } finally {
        textLoading.value = false
    }
}

// 应用语法高亮
async function applyHighlight() {
    if (!previewFile.value) return

    // 等待下一帧确保DOM已渲染
    await new Promise(resolve => setTimeout(resolve, 100))

    const codeBlock = document.querySelector('.text-preview-content code')
    if (codeBlock) {
        // 使用 highlight.js 进行语法高亮
        const ext = previewFile.value.name.split('.').pop().toLowerCase()
        const language = getLanguageClass(ext)

        try {
            // 先清除之前的高亮
            codeBlock.removeAttribute('data-highlighted')
            codeBlock.className = ''

            // 使用 hljs.highlight 手动高亮
            const result = hljs.highlight(textContent.value, {
                language: language,
                ignoreIllegals: true
            })

            // 设置高亮后的HTML
            codeBlock.innerHTML = result.value
            codeBlock.className = `hljs language-${language}`
        } catch (error) {
            console.error('语法高亮失败:', error)
            // 如果高亮失败，使用自动检测
            try {
                const result = hljs.highlightAuto(textContent.value)
                codeBlock.innerHTML = result.value
                codeBlock.className = `hljs`
            } catch (e) {
                console.error('自动高亮也失败:', e)
            }
        }
    }
}

// 获取语言类名
function getLanguageClass(ext) {
    const langMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'jsx': 'javascript',
        'tsx': 'typescript',
        'py': 'python',
        'md': 'markdown',
        'yml': 'yaml',
        'sh': 'bash',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'cpp',
        'java': 'java',
        'php': 'php',
        'go': 'go',
        'rs': 'rust',
        'sql': 'sql',
        'html': 'html',
        'xml': 'xml',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'json': 'json',
        'vue': 'html',
        'txt': 'plaintext'
    }
    return langMap[ext] || 'plaintext'
}

// 切换编辑模式
function toggleEditMode() {
    isEditing.value = !isEditing.value
}

// 保存文本内容
async function saveTextContent() {
    if (!previewFile.value || !textContent.value) {
        ElMessage.warning('没有可保存的内容')
        return
    }

    try {
        const loading = ElMessage({ message: '正在保存...', duration: 0 })

        // 将文本转换为Blob
        const blob = new Blob([textContent.value], { type: 'text/plain;charset=utf-8' })
        const file = new File([blob], previewFile.value.name, { type: 'text/plain' })

        // 上传到OSS（覆盖原文件）
        const result = await uploadFileToOSS(
            file,
            previewFile.value.ossPath.substring(0, previewFile.value.ossPath.lastIndexOf('/')),
            () => { }
        )

        if (result.success) {
            ElMessage.success('保存成功')
            isEditing.value = false

            // 更新文件URL
            previewFile.value.url = result.url
            previewUrl.value = result.url
        } else {
            ElMessage.error('保存失败: ' + result.error)
        }

        loading.close()
    } catch (error) {
        console.error('保存文件失败:', error)
        ElMessage.error('保存失败')
    }
}

// 图片加载完成，计算显示样式
function handleImageLoad(e) {
    const img = e.target
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight

    // 保存原始尺寸
    imageDimensions.value = {
        width: naturalWidth,
        height: naturalHeight
    }

    // 计算宽高比
    const aspectRatio = naturalWidth / naturalHeight

    // 容器最大尺寸
    const maxWidth = window.innerWidth * 0.8  // 90%对话框的约80%
    const maxHeight = window.innerHeight * 0.7 // 70vh

    let displayWidth, displayHeight

    if (aspectRatio > 1) {
        // 宽度大于高度（横图）：优先显示全高度
        displayHeight = Math.min(naturalHeight, maxHeight)
        displayWidth = displayHeight * aspectRatio

        // 如果宽度超出，则按宽度限制
        if (displayWidth > maxWidth) {
            displayWidth = maxWidth
            displayHeight = displayWidth / aspectRatio
        }
    } else {
        // 高度大于宽度（竖图）：优先显示全宽度
        displayWidth = Math.min(naturalWidth, maxWidth)
        displayHeight = displayWidth / aspectRatio

        // 如果高度超出，则按高度限制
        if (displayHeight > maxHeight) {
            displayHeight = maxHeight
            displayWidth = displayHeight * aspectRatio
        }
    }

    imagePreviewStyle.value = {
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        maxWidth: '100%',
        maxHeight: '70vh',
        objectFit: 'contain'
    }
}

// 下载文件
function handleDownload(row) {
    window.open(row.url, '_blank')
}

// 分享文件到广场
async function handleShare(row) {
    try {
        // 确认分享
        await ElMessageBox.confirm(
            `确定要将 "${row.name}" 分享到广场吗？`,
            '分享到广场',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }
        )

        const result = await shareApi.shareFile(row.id)
        if (result.success) {
            ElMessage.success('文件已分享到广场')
            // 重新加载当前目录
            await fileStore.loadCurrentDir()
        } else {
            ElMessage.error('分享失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('分享文件失败:', error)
            ElMessage.error('分享失败')
        }
    }
}

// 取消分享文件
async function handleUnshare(row) {
    try {
        await ElMessageBox.confirm(
            `确定要取消分享 "${row.name}" 吗？`,
            '取消分享',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const result = await shareApi.unshareFile(row.id)
        if (result.success) {
            ElMessage.success('已取消分享')
            // 重新加载当前目录
            await fileStore.loadCurrentDir()
        } else {
            ElMessage.error('取消分享失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('取消分享失败:', error)
            ElMessage.error('取消分享失败')
        }
    }
}

// 加载分享广场文件
async function loadSharedFiles() {
    try {
        const result = await shareApi.getSharedFiles({
            page: currentPage.value,
            pageSize: pageSize.value,
            fileType: fileTypeFilter.value || 'all'
        })

        if (result.success) {
            sharedFiles.value = result.data || []
            sharedFilesTotal.value = result.total || 0
        } else {
            ElMessage.error('加载分享广场失败')
        }
    } catch (error) {
        console.error('加载分享广场失败:', error)
        ElMessage.error('加载分享广场失败')
    }
}

// 保存分享文件到我的网盘
async function handleSaveSharedFile(row) {
    try {
        await ElMessageBox.confirm(
            `确定要将 "${row.name}" 保存到您的网盘吗？`,
            '保存文件',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }
        )

        const result = await shareApi.saveSharedFile(row.id, fileStore.currentFolderId)
        if (result.success) {
            ElMessage.success('文件已保存到您的网盘')

            // 更新用户存储空间
            if (result.storage) {
                userStore.updateStorageUsed(result.storage.storage_used)
            }

            // 刷新当前目录，使新保存的文件立即显示
            await fileStore.loadCurrentDir()
            // 同时刷新所有文件列表（用于侧边栏筛选）
            allFilesList.value = await fileStore.getAllFiles()
        } else {
            ElMessage.error('保存失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('保存文件失败:', error)
            ElMessage.error('保存失败')
        }
    }
}

// 复制文件链接
async function handleCopyLink(row) {
    if (!row.url) {
        ElMessage.warning('该文件没有可用的链接')
        return
    }

    try {
        // 使用 Clipboard API 复制链接
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(row.url)
            ElMessage.success({
                message: '链接已复制到剪贴板',
                duration: 2000,
                showClose: true
            })
        } else {
            // 降级方案：使用传统方法
            const textArea = document.createElement('textarea')
            textArea.value = row.url
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()

            try {
                document.execCommand('copy')
                ElMessage.success({
                    message: '链接已复制到剪贴板',
                    duration: 2000,
                    showClose: true
                })
            } catch (err) {
                console.error('复制失败:', err)
                ElMessage.error('复制失败，请手动复制')
                // 显示链接供用户手动复制
                showShareDialog(row.url)
            } finally {
                textArea.remove()
            }
        }
    } catch (error) {
        console.error('复制链接失败:', error)
        ElMessage.error('复制失败，请手动复制')
        // 显示链接供用户手动复制
        showShareDialog(row.url)
    }
}

// 显示分享对话框（备用方案）
function showShareDialog(url) {
    ElMessageBox.alert(
        `<div style="word-break: break-all; padding: 10px; background: #f5f7fa; border-radius: 4px; font-family: monospace;">${url}</div>`,
        '文件分享链接',
        {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '关闭'
        }
    )
}

// 判断是否是图片
function isImage(item) {
    if (item.type === 'folder') return false
    const ext = item.name.split('.').pop().toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg'].includes(ext)
}

// 判断是否是视频
function isVideo(item) {
    if (item.type === 'folder') return false
    const ext = item.name.split('.').pop().toLowerCase()
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)
}

// 判断是否是文档
function isDocument(item) {
    if (item.type === 'folder') return false
    const ext = item.name.split('.').pop().toLowerCase()
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'].includes(ext)
}

// 判断是否是文本/代码文件
function isTextFile(item) {
    if (item.type === 'folder') return false
    const ext = item.name.split('.').pop().toLowerCase()
    return ['txt', 'md', 'json', 'js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less', 'html',
        'xml', 'java', 'py', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml'].includes(ext)
}

// 视频加载错误处理
function handleVideoError(e) {
    console.error('视频加载失败:', e)
}

// 卡片点击处理
function handleCardClick(item) {
    if (item.type === 'folder') {
        // 文件夹，进入目录
        fileStore.enterFolder(item)
    } else if (canPreview(item)) {
        // 图片或视频，打开预览
        handlePreview(item)
    } else {
        // 其他文件，下载
        handleDownload(item)
    }
}

// ========== 筛选相关函数 ==========

// 执行搜索（实际上计算属性会自动响应）
function handleSearch() {
    // 计算属性会自动更新，这里可以添加一些提示
    console.log('筛选条件已更新')
}

// 重置所有筛选条件
function resetFilters() {
    searchKeyword.value = ''
    fileTypeFilter.value = ''
    dateRange.value = null
    sizeFilter.value = ''
    shareStatusFilter.value = ''
    sortBy.value = 'time'
    ElMessage.success('已重置筛选条件')
}

// 刷新数据
async function handleRefresh() {
    try {
        refreshLoading.value = true

        // 重置分页到第1页
        currentPage.value = 1

        // 重置所有筛选条件
        searchKeyword.value = ''
        fileTypeFilter.value = ''
        dateRange.value = null
        sizeFilter.value = ''
        shareStatusFilter.value = ''
        sortBy.value = 'time'

        // 切换到全部文件（如果不是分享广场）
        if (activeMenu.value !== 'share-square') {
            activeMenu.value = 'all'

            // 返回根目录（如果在子文件夹中）
            if (fileStore.currentFolderId !== 0) {
                // 重置面包屑导航到根目录
                await fileStore.navigateTo(0)
            }
        }

        // 根据当前菜单刷新对应的数据
        if (activeMenu.value === 'share-square') {
            // 刷新分享广场
            await loadSharedFiles()
            ElMessage.success('分享广场数据已刷新')
        } else {
            // 刷新当前目录和文件夹
            await fileStore.loadCurrentDir()
            await fileStore.loadAllFolders()
            // 同时刷新所有文件列表（用于侧边栏筛选）
            allFilesList.value = await fileStore.getAllFiles()
            ElMessage.success('文件列表已刷新')
        }
    } catch (error) {
        console.error('刷新失败:', error)
        ElMessage.error('刷新失败，请稍后重试')
    } finally {
        refreshLoading.value = false
    }
}

// ========== 批量操作相关函数 ==========

// 表格选中变化
function handleSelectionChange(selection) {
    selectedFiles.value = selection.filter(item => item.type !== 'folder')
}

// 判断行是否可选（只有文件可选，文件夹不可选）
function isSelectableRow(row) {
    return row.type !== 'folder'
}

// 判断文件是否被选中
function isFileSelected(item) {
    return selectedFiles.value.some(f => f.id === item.id)
}

// 切换文件选中状态（卡片视图）
function toggleFileSelection(item) {
    const index = selectedFiles.value.findIndex(f => f.id === item.id)
    if (index > -1) {
        selectedFiles.value.splice(index, 1)
    } else {
        selectedFiles.value.push(item)
    }
}

// 全选/取消全选
function handleSelectAll(val) {
    if (val) {
        selectedFiles.value = filteredTableData.value.filter(item => item.type !== 'folder')
    } else {
        selectedFiles.value = []
    }
}

// 清空选择
function clearSelection() {
    selectedFiles.value = []
    selectAll.value = false
}

// 移动到上一级目录
async function moveToParent() {
    if (breadcrumb.value.length <= 1) {
        ElMessage.warning('已经在根目录')
        return
    }

    const parentId = breadcrumb.value[breadcrumb.value.length - 2].id
    await batchMoveFiles(parentId)
}

// 批量移动文件
async function batchMoveFiles(targetFolderId) {
    if (selectedFiles.value.length === 0) {
        ElMessage.warning('请先选择文件')
        return
    }

    try {
        const loading = ElMessage({ message: '正在移动文件...', duration: 0 })

        // 批量移动
        const promises = selectedFiles.value.map(file =>
            fileStore.moveFile(file.id, targetFolderId)
        )

        const results = await Promise.all(promises)
        const successCount = results.filter(r => r.success).length

        loading.close()

        if (successCount === selectedFiles.value.length) {
            ElMessage.success(`成功移动 ${successCount} 个文件`)
        } else {
            ElMessage.warning(`成功移动 ${successCount}/${selectedFiles.value.length} 个文件`)
        }

        clearSelection()
    } catch (error) {
        console.error('批量移动失败:', error)
        ElMessage.error('批量移动失败')
    }
}

// 处理文件夹节点点击
function handleFolderNodeClick(data) {
    selectedTargetFolder.value = data
}

// 确认移动到文件夹
async function confirmMoveToFolder() {
    if (!selectedTargetFolder.value) {
        ElMessage.warning('请选择目标文件夹')
        return
    }

    await batchMoveFiles(selectedTargetFolder.value.id)
    showMoveDialog.value = false
    selectedTargetFolder.value = null
}

// 批量删除
async function batchDelete() {
    if (selectedFiles.value.length === 0) {
        ElMessage.warning('请先选择文件')
        return
    }

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
            '批量删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const loading = ElMessage({ message: '正在删除文件...', duration: 0 })

        // 批量删除
        const promises = selectedFiles.value.map(async file => {
            try {
                // 删除数据库记录（后端会检查引用计数）
                const result = await fileStore.deleteFile(file.id)

                // 如果后端返回需要删除OSS文件，则删除
                if (result.success && result.shouldDeleteOSS) {
                    console.log(`文件 [${file.name}] 未被其他用户引用，删除OSS文件`)
                    const ossResult = await deleteFileFromOSS(result.ossPath)
                    if (!ossResult.success) {
                        console.warn(`OSS文件删除失败 [${file.name}]:`, ossResult.error)
                    }
                } else if (result.success) {
                    console.log(`文件 [${file.name}] 仍被其他用户引用，不删除OSS文件`)
                }

                return result
            } catch (error) {
                console.error(`删除文件失败 [${file.name}]:`, error)
                return { success: false }
            }
        })

        const results = await Promise.all(promises)
        const successCount = results.filter(r => r.success).length

        loading.close()

        if (successCount === selectedFiles.value.length) {
            ElMessage.success(`成功删除 ${successCount} 个文件`)
        } else {
            ElMessage.warning(`成功删除 ${successCount}/${selectedFiles.value.length} 个文件`)
        }

        clearSelection()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量删除失败:', error)
            ElMessage.error('批量删除失败')
        }
    }
}

// ========== 拖拽相关函数 ==========

// 开始拖拽
function handleDragStart(event, item) {
    if (item.type === 'folder') return

    draggingFileId.value = item.id
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)

    // 设置拖拽时的半透明效果
    event.target.style.opacity = '0.5'
}

// 拖拽经过文件夹
function handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
}

// 拖拽进入文件夹
function handleDragEnter(event, folder) {
    event.preventDefault()
    if (draggingFileId.value && folder.type === 'folder') {
        dragOverFolderId.value = folder.id
    }
}

// 拖拽离开文件夹
function handleDragLeave(event) {
    // 检查是否真的离开了元素（不是进入子元素）
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
        dragOverFolderId.value = null
    }
}

// 放下文件到文件夹
async function handleDrop(event, folder) {
    event.preventDefault()
    event.stopPropagation()

    dragOverFolderId.value = null

    if (!draggingFileId.value || folder.type !== 'folder') return

    try {
        // 调用移动文件API
        const result = await fileStore.moveFile(draggingFileId.value, folder.id)
        if (result.success) {
            ElMessage.success(`文件已移动到 "${folder.name}"`)
        } else {
            ElMessage.error('移动文件失败')
        }
    } catch (error) {
        console.error('移动文件失败:', error)
        ElMessage.error('移动文件失败')
    }

    draggingFileId.value = null
}

// 拖拽结束
function handleDragEnd(event) {
    event.target.style.opacity = '1'
    draggingFileId.value = null
    dragOverFolderId.value = null
}

</script>

<style scoped>
.netdisk-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.header {
    height: 60px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: bold;
    color: #409EFF;
}

.logo .logo-image {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.logo .el-icon {
    font-size: 28px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-info {
    margin-right: 10px;
}

.user-dropdown {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.user-dropdown:hover {
    background-color: #f5f7fa;
}

.username {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
}

.storage-info {
    padding: 10px;
    min-width: 200px;
}

.storage-info p {
    margin: 5px 0;
    font-size: 13px;
    color: #606266;
}

.storage-text {
    text-align: center;
    font-size: 12px;
    color: #909399;
    margin-top: 8px !important;
}

.main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.sidebar {
    width: 200px;
    background-color: #fff;
    border-right: 1px solid #e4e7ed;
}

.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: auto;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}



.breadcrumb-item {
    cursor: pointer;
}

.breadcrumb-item:hover {
    color: #409EFF;
}

.view-switch {
    display: flex;
    align-items: center;
}

/* 筛选工具栏样式 */
.filter-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 15px 20px;
    border-radius: 4px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.filter-right {
    display: flex;
    align-items: center;
}

/* 批量操作工具栏样式 */
.batch-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #ecf5ff 0%, #e1f0ff 100%);
    border: 1px solid #d9ecff;
    color: #606266;
    padding: 12px 20px;
    border-radius: 4px;
    margin-bottom: 20px;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.1);
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.batch-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.batch-count {
    font-size: 15px;
    font-weight: 500;
    color: #409EFF;
}

.batch-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.batch-actions .el-button {
    /* background-color: #fff; */
    color: #303133;
}

.batch-actions .el-button:hover {
    opacity: 0.9;
}

.file-list {
    background-color: #fff;
    border-radius: 4px;
    padding: 10px;
}

.file-name {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.file-name:hover {
    color: #409EFF;
}

/* 文件夹名称可点击样式 */
.folder-name-clickable {
    cursor: pointer;
    transition: all 0.3s;
}

.folder-name-clickable:hover {
    color: #409EFF;
    text-decoration: underline;
}

/* 文件名称可点击样式 */
.file-name-clickable {
    cursor: pointer;
    transition: all 0.3s;
}

.file-name-clickable:hover {
    color: #67C23A;
    text-decoration: underline;
}

.upload-area {
    padding: 20px;
}

.upload-info {
    margin-top: 20px;
}

.upload-info p {
    margin-bottom: 10px;
    color: #606266;
}

.image-preview-container,
.video-preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.image-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 300px;
    max-height: 70vh;
    overflow: hidden;
}

.image-wrapper img {
    display: block;
    transition: all 0.3s ease;
}

.preview-info {
    margin-top: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    width: 100%;
}

.preview-info p {
    margin: 5px 0;
    color: #606266;
    font-size: 14px;
}

/* 卡片视图样式 */
.file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    background-color: #fff;
    border-radius: 4px;
    padding: 20px;
}

.file-card {
    position: relative;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    height: 240px;
}

.file-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-4px);
}

/* 卡片选中状态 */
.file-card.selected {
    border: 2px solid #409EFF;
    box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

/* 卡片复选框 */
.card-checkbox {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 5;
    /* background-color: rgba(255, 255, 255, 0.9); */
    border-radius: 4px;
    padding: 4px;
}

.file-card:hover .card-actions {
    opacity: 1;
}

.card-thumbnail {
    width: 100%;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
}

.folder-icon,
.file-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.image-thumbnail {
    width: 100%;
    height: 100%;
}

.image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #f5f7fa;
}

.video-thumbnail {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
}

.video-play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    /* background-color: rgba(0, 0, 0, 0.4); */
    /* border-radius: 50%; */
    /* border-radius: 10px; */
    /* width: 70px; */
    /* height: 70px; */
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: all 0.3s;
    opacity: 0;
}

.file-card:hover .video-play-icon {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.4);
    transform: translate(-50%, -50%) scale(1.1);
}

.play-text {
    color: #fff;
    font-size: 12px;
    margin-top: 4px;
    font-weight: 500;
}

/* 图片预览遮罩 */
.image-thumbnail {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
}

.preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
    pointer-events: none;
}

.preview-overlay span {
    color: #fff;
    font-size: 14px;
    margin-top: 8px;
    font-weight: 500;
}

.file-card:hover .preview-overlay {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.5);
}

.card-info {
    padding: 12px;
    background-color: #fff;
    flex-shrink: 0;
}

.card-name {
    font-size: 14px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8px;
    font-weight: 500;
}

.card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-size {
    font-size: 12px;
    color: #909399;
}

.card-sharer {
    display: flex;
    align-items: center;
    margin-top: 8px;
    padding: 4px 0;
}

.sharer-info {
    display: flex;
    align-items: center;
}


.card-actions {
    position: absolute;
    width: 120px;
    top: 14px;
    right: 6px;
    display: flex;
    flex-direction: row-reverse;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.3s;
}

.card-actions .el-button {
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.9);
    color: #303133;
    margin: 0;
}

/* 文档预览样式 */
.document-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 20px;
}

.document-preview-container {
    width: 100%;
    height: 70vh;
    position: relative;
    background-color: #f5f7fa;
}

.document-iframe {
    width: 100%;
    height: 100%;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
}

.loading-container p {
    margin-top: 15px;
    font-size: 14px;
}

.preview-tip {
    color: #909399 !important;
    font-style: italic;
    margin-top: 10px !important;
}

/* 文本/代码预览样式 */
.text-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 20px;
}

.text-preview-container {
    width: 100%;
    min-height: 500px;
    max-height: 75vh;
    position: relative;
    background-color: #f5f7fa;
}

.text-preview-content {
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: #282c34;
    border-radius: 4px;
    padding: 0;
}

.text-preview-content pre {
    margin: 0;
    padding: 20px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    background-color: transparent !important;
}

.text-preview-content code {
    display: block;
    font-family: inherit;
    padding: 0 !important;
    background-color: transparent !important;
}

.text-editor :deep(.el-textarea__inner) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    background-color: #282c34;
    color: #abb2bf;
    border-color: #3e4451;
    min-height: 500px !important;
    max-height: 75vh;
}

.text-editor :deep(.el-textarea__inner):focus {
    border-color: #409EFF;
}

/* 上传文件列表样式 */
.upload-files-list {
    margin-top: 20px;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 14px;
    font-weight: 500;
}

.file-name-text {
    display: inline-block;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.upload-area {
    padding: 20px 0;
}

.el-upload__tip {
    margin-top: 10px;
    font-size: 12px;
    color: #909399;
    text-align: center;
}

/* 上传模式选择器 */
.upload-mode-selector {
    margin-bottom: 20px;
    text-align: center;
}

/* 文件夹上传区域 */
.folder-upload-area {
    margin-top: 20px;
}

.folder-upload-trigger {
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background-color: #fafafa;
    transition: all 0.3s;
    padding: 40px 0;
    text-align: center;
}

.folder-upload-trigger:hover {
    border-color: #409eff;
}

.folder-upload-trigger .el-icon--upload {
    font-size: 67px;
    color: #c0c4cc;
    margin-bottom: 16px;
    line-height: 50px;
}

.folder-upload-trigger:hover .el-icon--upload {
    color: #409eff;
}

.file-path-text {
    display: inline-block;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: #909399;
}

.document-header span {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
}

.document-preview-container {
    width: 100%;
    height: 75vh;
    position: relative;
    background-color: #f5f7fa;
    border-radius: 4px;
    overflow: hidden;
}

.document-iframe {
    width: 100%;
    height: 100%;
    border: none;
}

.loading-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.loading-container p {
    color: #606266;
    font-size: 14px;
}

.preview-tip {
    color: #909399;
    font-size: 12px;
    font-style: italic;
    margin-top: 5px;
}

.is-loading {
    animation: rotating 2s linear infinite;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* ========== 拖拽相关样式 ========== */

/* 拖拽中的文件卡片 */
.file-card.dragging {
    opacity: 0.5;
    cursor: move;
}

/* 文件可拖拽的光标样式 */
.file-card[draggable="true"] {
    cursor: grab;
}

.file-card[draggable="true"]:active {
    cursor: grabbing;
}

/* 列表视图文件名可拖拽 */
.file-name[draggable="true"] {
    cursor: grab;
}

.file-name[draggable="true"]:active {
    cursor: grabbing;
}

/* 拖拽悬停在文件夹上的高亮效果 */
.file-card.drag-over {
    border: 2px dashed #67C23A;
    background-color: #f0f9ff;
    box-shadow: 0 0 15px rgba(103, 194, 58, 0.3);
}

.file-name.drag-over {
    background-color: #f0f9ff;
    padding: 8px;
    border-radius: 4px;
    border: 2px dashed #67C23A;
}

/* 拖拽提示遮罩（卡片视图） */
.drop-hint {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(103, 194, 58, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 8px;
    animation: pulse 1s infinite;
    pointer-events: none;
    /* 不阻止点击事件 */
}

.drop-hint p {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    margin-top: 10px;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.9;
    }

    50% {
        opacity: 1;
    }
}

/* ========== 移动对话框样式 ========== */

.move-dialog-content {
    max-height: 400px;
    overflow-y: auto;
    padding: 10px;
}

.tree-node {
    display: flex;
    align-items: center;
    font-size: 14px;
}

.selected-folder-info {
    margin-top: 15px;
}

/* ========== 音频预览样式 ========== */

.audio-preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
}

.audio-cover {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    animation: audioRotate 10s linear infinite;
}

@keyframes audioRotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.audio-cover .el-icon {
    color: #fff;
}

.audio-preview-container audio {
    max-width: 100%;
    outline: none;
}

.audio-preview-container audio::-webkit-media-controls-panel {
    background-color: #f5f7fa;
}

.audio-preview-container .preview-info {
    width: 100%;
    margin-top: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

/* ========== 分页样式 ========== */

.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
    background-color: #fff;
}

.file-grid-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.file-grid-container .file-grid {
    flex: 1;
}
</style>
