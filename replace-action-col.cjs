const fs = require('fs')
const path = require('path')

function traverse(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath)
    } else if (fullPath.endsWith('.vue')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      const original = content
      
      // Match `<el-table-column ... label="操作" ... width="xxx"`
      content = content.replace(/(<el-table-column[^>]*?label="操作"[^>]*?)\bwidth="/g, '$1min-width="')
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log('Updated', fullPath)
      }
    }
  }
}

traverse(path.join(__dirname, 'src'))
console.log('Done.')
