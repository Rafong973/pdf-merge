const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')
if (!fs.existsSync(distDir)) {
  console.log('dist directory not found, nothing to clean.')
  process.exit(0)
}

const keepPatterns = [/\.exe$/i, /\.zip$/i]

const entries = fs.readdirSync(distDir)
for (const entry of entries) {
  const p = path.join(distDir, entry)
  const stat = fs.lstatSync(p)
  const keep = keepPatterns.some((regex) => regex.test(entry))
  if (!keep) {
    if (stat.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true })
      console.log('deleted dir:', entry)
    } else {
      fs.unlinkSync(p)
      console.log('deleted file:', entry)
    }
  }
}

console.log('dist cleanup complete. Retained only .exe/.zip packages.')
