# 数据导入说明

## 概述

本文档说明如何将 `file.sql` 中的数据导入到后端数据库中。

## 数据库信息

### 源数据库（file.sql）
- 服务器: 120.48.51.185:3306
- 数据库名: qiniucloud
- 表名: `file`

### 目标数据库（后端项目）
- 服务器: localhost（本地）
- 数据库名: netdisk
- 表名: `files`

## 数据表结构映射

### 源表（file）字段说明
```
file_id           -> 文件主键ID
file_createtime   -> 上传时间
file_type         -> 文件类型（0-8）
file_name         -> 文件名
file_suffix       -> 文件后缀名
file_link         -> 文件地址链接
file_size         -> 文件大小（字节）
file_region       -> 存储区域
file_user_id      -> 所属用户ID
file_user_name    -> 用户昵称
file_likes        -> 点赞数量
file_views        -> 浏览量
file_remark       -> 备注
file_address      -> 上传地址位置
file_public       -> 是否公开（0-私有 1-公开）
```

### 目标表（files）字段说明
```
id                -> 文件主键ID（自增）
name              -> 文件名（含后缀）
url               -> 文件URL地址
oss_path          -> OSS存储路径
size              -> 文件大小（字节）
file_type         -> 文件类型（image/video/audio等）
parent_id         -> 父文件夹ID（默认0表示根目录）
user_id           -> 所属用户ID
created_at        -> 创建时间
updated_at        -> 更新时间
```

### 文件类型映射
```
0 (图片)     -> image
1 (视频)     -> video
2 (音乐)     -> audio
3 (压缩包)   -> archive
4 (安装包)   -> application
5 (代码文本) -> code
6 (记事本)   -> text
7 (office)   -> document
8 (其他)     -> other
```

### 用户ID映射
```
原始用户ID 1 (coderxp@qq.com) -> 本地用户ID 1
原始用户ID 2 (浅呤)           -> 本地用户ID 2
原始用户ID 3 (徐瑶)           -> 本地用户ID 3
```

## 导入步骤

### 1. 确保数据库已初始化

首先确保数据库和表已经创建：

```bash
cd end
```

### 2. 运行用户迁移（如果还没运行过）

```bash
npm run migrate:users
```

这将创建用户表并添加默认管理员账户。

### 3. 执行数据导入

```bash
npm run import:data
```

导入过程会：
1. 读取项目根目录下的 `file.sql` 文件
2. 解析SQL中的INSERT语句
3. 将数据转换为目标表格式
4. 跳过重复的文件（基于URL或OSS路径）
5. 显示导入进度和统计信息

### 4. 查看导入结果

脚本执行完成后会显示：
- ✓ 成功导入的记录数
- ⊗ 跳过的重复记录数
- ✗ 导入失败的记录数
- 📦 当前数据库文件总数

## 注意事项

1. **数据去重**: 脚本会自动检查并跳过已存在的文件（基于URL或OSS路径）

2. **用户映射**: 如果本地用户数量不足，多余的文件会分配给第一个用户

3. **文件位置**: 所有导入的文件默认放在根目录（parent_id = 0）

4. **事务安全**: 导入过程使用数据库事务，如果出错会自动回滚

5. **ID映射表**: 脚本会创建 `file_import_mapping` 表来记录原始ID和新ID的映射关系

## 手动导入（备选方案）

如果自动脚本有问题，可以手动导入：

```bash
# 方式1: 使用MySQL命令行
mysql -u root -p netdisk < file.sql

# 方式2: 使用MySQL Workbench
# 1. 打开MySQL Workbench
# 2. 连接到本地数据库
# 3. 选择 Server -> Data Import
# 4. 选择 file.sql 文件导入
```

**注意**: 手动导入可能需要修改SQL文件中的表名和字段名以匹配目标表结构。

## 故障排除

### 问题1: 无法连接数据库
**解决**: 检查 `.env` 文件中的数据库配置是否正确

### 问题2: 用户表为空
**解决**: 先运行 `npm run migrate:users` 创建用户

### 问题3: SQL解析错误
**解决**: 检查 `file.sql` 文件格式是否正确，确保是UTF-8编码

### 问题4: 导入后数据不显示
**解决**: 检查用户ID映射是否正确，确保文件关联到正确的用户

## 数据验证

导入完成后，可以通过以下SQL语句验证：

```sql
-- 查看文件总数
SELECT COUNT(*) FROM files;

-- 按用户统计文件数
SELECT user_id, COUNT(*) as file_count 
FROM files 
GROUP BY user_id;

-- 按文件类型统计
SELECT file_type, COUNT(*) as count 
FROM files 
GROUP BY file_type;

-- 查看最近导入的文件
SELECT id, name, file_type, size, created_at 
FROM files 
ORDER BY created_at DESC 
LIMIT 10;
```

## 清理导入的数据（如需重新导入）

```sql
-- 删除所有导入的文件
DELETE FROM files;

-- 删除ID映射表
DROP TABLE IF EXISTS file_import_mapping;

-- 重置自增ID
ALTER TABLE files AUTO_INCREMENT = 1;
```

## 相关文件

- `db/import-file-data.js` - 数据导入脚本
- `db/migrate-users.js` - 用户表迁移脚本
- `db/connection.js` - 数据库连接配置
- `.env` - 环境变量配置
- `file.sql` - 源数据文件（项目根目录）
