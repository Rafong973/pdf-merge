const fileInput = document.getElementById('file-input')
const dropZone = document.getElementById('drop-zone')
const browseBtn = document.getElementById('browse')
const mergeBtn = document.getElementById('merge-btn')
const clearBtn = document.getElementById('clear-btn')
const fileList = document.getElementById('file-list')
const previewWrap = document.getElementById('preview-wrap')
const previewModal = document.getElementById('preview-modal')
const modalPreviewBody = document.getElementById('modal-preview-body')
const zoomPreviewBtn = document.getElementById('zoom-preview')
const closePreviewModal = document.getElementById('close-preview-modal')
const progressFill = document.getElementById('progress-fill')
const compressCheckbox = document.getElementById('compress')
const statusEl = document.getElementById('status')
const downloadBtn = document.getElementById('download-btn')

let selectedFiles = []
let mergedBlobUrl = null

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function refreshFileList() {
  fileList.innerHTML = ''
  if (!selectedFiles.length) {
    fileList.innerHTML = '<div class="empty">还没有上传任何 PDF 文件。</div>'
    statusEl.innerText = '未选择文件'
    mergeBtn.disabled = true
    clearBtn.disabled = true
    resetPreview()
    return
  }

  mergeBtn.disabled = false
  clearBtn.disabled = false
  selectedFiles.forEach((file, idx) => {
    const item = document.createElement('div')
    item.className = 'file-item'

    const left = document.createElement('div')
    left.className = 'left'
    left.innerHTML = `<div class="name">${file.name}</div><div class="size">${humanSize(file.size)}</div>`

    const actions = document.createElement('div')
    actions.className = 'actions'

    const up = document.createElement('button')
    up.innerText = '上移'
    up.disabled = idx === 0
    up.onclick = () => {
      ;[selectedFiles[idx - 1], selectedFiles[idx]] = [selectedFiles[idx], selectedFiles[idx - 1]]
      refreshFileList()
    }

    const down = document.createElement('button')
    down.innerText = '下移'
    down.disabled = idx === selectedFiles.length - 1
    down.onclick = () => {
      ;[selectedFiles[idx], selectedFiles[idx + 1]] = [selectedFiles[idx + 1], selectedFiles[idx]]
      refreshFileList()
    }

    const remove = document.createElement('button')
    remove.innerText = '移除'
    remove.onclick = () => {
      selectedFiles.splice(idx, 1)
      refreshFileList()
    }

    actions.appendChild(up)
    actions.appendChild(down)
    actions.appendChild(remove)

    item.appendChild(left)
    item.appendChild(actions)
    fileList.appendChild(item)
  })

  statusEl.innerText = `${selectedFiles.length} 个文件已选择`
}

function showError(message) {
  alert(`操作失败：${message}`)
}

function resetPreview() {
  if (mergedBlobUrl) {
    URL.revokeObjectURL(mergedBlobUrl)
    mergedBlobUrl = null
  }
  previewWrap.innerHTML = '<div class="empty">合并后 PDF 预览将在这里显示</div>'
  downloadBtn.disabled = true
  progressFill.style.width = '0%'
}

function addFiles(fileListObj, replace = false) {
  const pdfs = Array.from(fileListObj).filter(
    (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  )
  if (!pdfs.length) return

  if (replace) {
    selectedFiles = []
    resetPreview()
  }

  for (const f of pdfs) {
    const has = selectedFiles.some((x) => x.name === f.name && x.size === f.size)
    if (!has) selectedFiles.push(f)
  }
  refreshFileList()
}

browseBtn.onclick = () => fileInput.click()
fileInput.onchange = (event) => addFiles(event.target.files, true)

dropZone.ondragover = (event) => {
  event.preventDefault()
  dropZone.style.borderColor = '#4f46e5'
  dropZone.style.background = '#eef2ff'
}
dropZone.ondragleave = () => {
  dropZone.style.borderColor = '#a5b4fc'
  dropZone.style.background = '#f8fafc'
}
dropZone.ondrop = (event) => {
  event.preventDefault()
  dropZone.style.borderColor = '#a5b4fc'
  dropZone.style.background = '#f8fafc'
  addFiles(event.dataTransfer.files, true)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const base64 = result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('读取文件失败'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

mergeBtn.onclick = async () => {
  if (!selectedFiles.length) {
    statusEl.innerText = '请先上传至少一个 PDF 文件。'
    return
  }

  statusEl.innerText = '合并中，请稍候...'
  progressFill.style.width = '10%'
  const filesForMain = []

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i]
    const data = await fileToBase64(file)
    filesForMain.push({ name: file.name, data })
    progressFill.style.width = `${10 + Math.floor((i / selectedFiles.length) * 55)}%`
  }

  const compress = compressCheckbox.checked
  const result = await window.electronApi.mergePdf(filesForMain, compress)

  if (!result.success) {
    statusEl.innerText = `合并失败：${result.error}`
    progressFill.style.width = '0%'
    showError(result.error)
    return
  }

  progressFill.style.width = '90%'
  const bytes = Uint8Array.from(atob(result.output), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'application/pdf' })

  if (mergedBlobUrl) {
    URL.revokeObjectURL(mergedBlobUrl)
  }
  mergedBlobUrl = URL.createObjectURL(blob)

  previewWrap.innerHTML = `<iframe src="${mergedBlobUrl}" title="合并预览"></iframe>`
  progressFill.style.width = '100%'
  downloadBtn.disabled = false
  statusEl.innerText = `已成功合并 ${selectedFiles.length} 个文件。`
}

zoomPreviewBtn.onclick = () => {
  if (!mergedBlobUrl) return
  modalPreviewBody.innerHTML = `<iframe src="${mergedBlobUrl}" title="放大预览"></iframe>`
  previewModal.classList.remove('hidden')
}

closePreviewModal.onclick = () => {
  previewModal.classList.add('hidden')
  modalPreviewBody.innerHTML = ''
}

window.onclick = (event) => {
  if (event.target === previewModal) {
    previewModal.classList.add('hidden')
    modalPreviewBody.innerHTML = ''
  }
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk)
  }
  return btoa(binary)
}

downloadBtn.onclick = async () => {
  if (!mergedBlobUrl) return
  const defaultName = 'merged.pdf'
  const filePath = await window.electronApi.showSaveDialog(defaultName)
  if (!filePath) return

  try {
    const response = await fetch(mergedBlobUrl)
    const arrayBuffer = await response.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    const saveResult = await window.electronApi.saveFile(filePath, base64)
    if (!saveResult.success) {
      statusEl.innerText = `保存失败：${saveResult.error}`
      showError(saveResult.error)
      return
    }
    statusEl.innerText = `已保存到：${filePath}`
  } catch (error) {
    statusEl.innerText = `保存失败：${error.message}`
    showError(error.message)
  }
}

clearBtn.onclick = () => {
  selectedFiles = []
  refreshFileList()
  resetPreview()
  statusEl.innerText = '已清空文件列表'
}

refreshFileList()
