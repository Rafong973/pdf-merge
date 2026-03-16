const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronApi', {
  mergePdf: (files, compress) => ipcRenderer.invoke('pdf:merge', { files, compress }),
  showSaveDialog: (defaultName) => ipcRenderer.invoke('dialog:showSave', defaultName),
  saveFile: (filePath, data) => ipcRenderer.invoke('file:save', { filePath, data })
})
