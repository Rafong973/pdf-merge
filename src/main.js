const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { PDFDocument } = require('pdf-lib')

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 940,
    minHeight: 620,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'))
  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('dialog:showSave', async (_, defaultName) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  return result.canceled ? null : result.filePath
})

ipcMain.handle('pdf:merge', async (_, { files, compress }) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('没有选中文件')
    }
    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
      let inputPdf
      if (file.data) {
        const bytes = Buffer.from(file.data, 'base64')
        inputPdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
      } else if (file.path) {
        const data = fs.readFileSync(file.path)
        inputPdf = await PDFDocument.load(data, { ignoreEncryption: true })
      } else {
        throw new Error(`文件 ${file.name || 'unknown'} 无法读取`)
      }

      const copiedPages = await mergedPdf.copyPages(inputPdf, inputPdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    const options = {
      useObjectStreams: compress,
      compress: compress
    }
    const output = await mergedPdf.save(options)
    return { success: true, output: Buffer.from(output).toString('base64') }
  } catch (error) {
    console.error('pdf:merge error:', error)
    return { success: false, error: error.message || '合并失败' }
  }
})

ipcMain.handle('file:save', async (_, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
