console.log('测试开始...')
console.log('Node版本:', process.version)
console.log('当前目录:', process.cwd())

// 测试读取.env文件
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

try {
  const envPath = resolve(__dirname, '.env')
  console.log('\n读取.env文件:', envPath)
  const envContent = readFileSync(envPath, 'utf8')
  console.log('内容:')
  console.log(envContent)
} catch (error) {
  console.error('读取.env失败:', error.message)
}

// 测试读取SQL文件
try {
  const sqlPath = resolve(__dirname, '..', 'file.sql')
  console.log('\n检查file.sql文件:', sqlPath)
  const sqlContent = readFileSync(sqlPath, 'utf8')
  const lines = sqlContent.split('\n')
  console.log(`文件行数: ${lines.length}`)
  console.log('前5行:')
  lines.slice(0, 5).forEach((line, i) => {
    console.log(`  ${i + 1}: ${line.substring(0, 80)}`)
  })
  
  // 统计INSERT语句数量
  const insertCount = (sqlContent.match(/INSERT INTO `file` VALUES/g) || []).length
  console.log(`\nINSERT语句数量: ${insertCount}`)
  
} catch (error) {
  console.error('读取file.sql失败:', error.message)
}

console.log('\n测试完成！')
