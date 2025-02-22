let cards = []
let selectedCard = null
let currentImageIndex = 0
document.addEventListener('DOMContentLoaded', () => {
  feather.replace()
  loadFromLocalStorage()
  renderSidebar()
  setupListeners()
  showPlaceholder()
})
function setupListeners() {
  document.getElementById('homeBtn').addEventListener('click', () => {
    selectedCard = null
    showPlaceholder()
  })
  document.getElementById('newCardBtn').addEventListener('click', openNewCardModal)
  document.getElementById('newCardBtnHeader').addEventListener('click', openNewCardModal)
  document.getElementById('deleteCardBtn').addEventListener('click', openDeleteModal)
  document.getElementById('cancelDeleteCardBtn').addEventListener('click', closeDeleteModal)
  document.getElementById('confirmDeleteCardBtn').addEventListener('click', confirmDeleteCard)
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('jsonImportFile').click()
  })
  document.getElementById('jsonImportFile').addEventListener('change', handleImport)
  document.getElementById('exportBtn').addEventListener('click', exportToJson)
  document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('jsonImportFile').click()
  })
  document.getElementById('cancelModalBtn').addEventListener('click', closeNewCardModal)
  document.getElementById('addCardBtn').addEventListener('click', addCardFromModal)
  document.getElementById('editBtn').addEventListener('click', enterEditMode)
  document.getElementById('saveBtn').addEventListener('click', saveCardChanges)
  document.getElementById('closeInfoModalBtn').addEventListener('click', closeInfoModal)
  document.getElementById('searchBar').addEventListener('input', e => filterCards(e.target.value))
  const divider = document.getElementById('sidebarDivider')
  divider.addEventListener('mousedown', startSidebarResize)
  document.getElementById('cameraBtn').addEventListener('click', openPhotoOptions)
  document.getElementById('closePhotoOptionsBtn').addEventListener('click', () => {
    document.getElementById('photoOptionsModal').classList.remove('visible')
  })
  document.getElementById('useCameraBtn').addEventListener('click', () => {
    document.getElementById('cameraFileInput').click()
  })
  document.getElementById('uploadImageBtn').addEventListener('click', () => {
    document.getElementById('uploadFileInput').click()
  })
  document.getElementById('cameraFileInput').addEventListener('change', handleImageInput)
  document.getElementById('uploadFileInput').addEventListener('change', handleImageInput)
  document.getElementById('closeImageViewerBtn').addEventListener('click', closeImageViewer)
  document.getElementById('prevImageBtn').addEventListener('click', () => showImageAt(currentImageIndex - 1))
  document.getElementById('nextImageBtn').addEventListener('click', () => showImageAt(currentImageIndex + 1))
}
function showPlaceholder() {
  document.getElementById('placeholderView').style.display = 'block'
  document.getElementById('cardDetails').classList.remove('visible')
}
function openNewCardModal() {
  document.getElementById('modalIndex').value = ''
  document.getElementById('modalName').value = ''
  document.getElementById('modalKeywords').value = ''
  document.getElementById('newCardModal').classList.add('visible')
}
function closeNewCardModal() {
  document.getElementById('newCardModal').classList.remove('visible')
}
function addCardFromModal() {
  const index = document.getElementById('modalIndex').value.trim()
  const name = document.getElementById('modalName').value.trim()
  const keywords = document.getElementById('modalKeywords').value.trim()
  if (!index || !name) {
    showInfoModal('Missing Fields','Index and Name are required.')
    return
  }
  const c = {
    index,
    name,
    front: '',
    back: '',
    keywords,
    connections: '',
    images: []
  }
  cards.push(c)
  closeNewCardModal()
  saveToLocalStorage()
  renderSidebar()
}
function renderSidebar() {
  const ul = document.getElementById('indexList').querySelector('ul')
  ul.innerHTML = ''
  cards.sort(compareCardIndexes)
  cards.forEach(card => {
    const li = document.createElement('li')
    li.textContent = `${card.index} - ${card.name}`
    li.addEventListener('click', () => {
      selectedCard = card
      showCardDetails(card)
      renderSidebar()
    })
    if (selectedCard && selectedCard.index === card.index) {
      li.classList.add('selected')
    }
    ul.appendChild(li)
  })
}
function showCardDetails(card) {
  document.getElementById('placeholderView').style.display = 'none'
  const cd = document.getElementById('cardDetails')
  cd.classList.add('visible')
  document.getElementById('cardTitle').textContent = card.name || '[No Title]'
  document.getElementById('detailIndex').value = card.index
  document.getElementById('detailName').value = card.name
  document.getElementById('detailFront').value = card.front || ''
  document.getElementById('detailBack').value = card.back || ''
  document.getElementById('detailKeywords').value = card.keywords || ''
  document.getElementById('detailConnections').value = card.connections || ''
  exitEditMode()
  renderImageGallery(card)
}
function renderImageGallery(card) {
  const gal = document.getElementById('imageGallery')
  gal.innerHTML = ''
  if (!card.images || card.images.length === 0) return
  card.images.forEach((imgSrc, i) => {
    const thumb = document.createElement('img')
    thumb.className = 'image-thumb'
    thumb.src = imgSrc
    thumb.addEventListener('click', () => openImageViewer(i))
    gal.appendChild(thumb)
  })
}
function enterEditMode() {
  if (!selectedCard) return
  document.getElementById('detailIndex').readOnly = false
  document.getElementById('detailName').readOnly = false
  document.getElementById('detailFront').readOnly = false
  document.getElementById('detailBack').readOnly = false
  document.getElementById('detailKeywords').readOnly = false
  document.getElementById('detailConnections').readOnly = false
  document.getElementById('saveBtn').style.display = 'inline-flex'
}
function exitEditMode() {
  document.getElementById('detailIndex').readOnly = true
  document.getElementById('detailName').readOnly = true
  document.getElementById('detailFront').readOnly = true
  document.getElementById('detailBack').readOnly = true
  document.getElementById('detailKeywords').readOnly = true
  document.getElementById('detailConnections').readOnly = true
  document.getElementById('saveBtn').style.display = 'none'
}
function saveCardChanges() {
  if (!selectedCard) return
  selectedCard.index = document.getElementById('detailIndex').value.trim()
  selectedCard.name = document.getElementById('detailName').value.trim()
  selectedCard.front = document.getElementById('detailFront').value
  selectedCard.back = document.getElementById('detailBack').value
  selectedCard.keywords = document.getElementById('detailKeywords').value.trim()
  selectedCard.connections = document.getElementById('detailConnections').value.trim()
  exitEditMode()
  saveToLocalStorage()
  renderSidebar()
  showCardDetails(selectedCard)
}
function openDeleteModal() {
  if (!selectedCard) {
    showInfoModal('No Card Selected','Please select a card to delete.')
    return
  }
  document.getElementById('deleteCardModal').classList.add('visible')
}
function closeDeleteModal() {
  document.getElementById('deleteCardModal').classList.remove('visible')
}
function confirmDeleteCard() {
  if (!selectedCard) return
  removeCard(selectedCard.index)
  selectedCard = null
  closeDeleteModal()
  saveToLocalStorage()
  renderSidebar()
  showPlaceholder()
}
function removeCard(idx) {
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].index === idx) {
      cards.splice(i,1)
      return
    }
  }
}
function handleImport(e) {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result)
      if (Array.isArray(imported)) {
        cards = imported
        saveToLocalStorage()
        renderSidebar()
        showPlaceholder()
      } else {
        showInfoModal('Import Error','JSON format not recognized.')
      }
    } catch (err) {
      showInfoModal('Import Error', err.message)
    }
  }
  r.readAsText(f)
  e.target.value = ''
}
function exportToJson() {
  const data = JSON.stringify(cards, null, 2)
  const b = new Blob([data], { type: 'application/json' })
  const u = URL.createObjectURL(b)
  const a = document.createElement('a')
  a.href = u
  a.download = 'zettel-dex.json'
  a.click()
  URL.revokeObjectURL(u)
}
function loadFromLocalStorage() {
  const d = localStorage.getItem('zetteldexData')
  if (d) {
    try {
      cards = JSON.parse(d)
    } catch (e) {
      cards = []
    }
  }
}
function saveToLocalStorage() {
  localStorage.setItem('zetteldexData', JSON.stringify(cards))
}
function showInfoModal(t, m) {
  document.getElementById('infoModalTitle').textContent = t
  document.getElementById('infoModalMessage').textContent = m
  document.getElementById('infoModal').classList.add('visible')
}
function closeInfoModal() {
  document.getElementById('infoModal').classList.remove('visible')
}
function compareCardIndexes(a,b) {
  return a.index.localeCompare(b.index, undefined, { numeric: true, sensitivity: 'base' })
}
function filterCards(q) {
  const ul = document.getElementById('indexList').querySelector('ul')
  ul.innerHTML = ''
  if (!q) {
    renderSidebar()
    return
  }
  const fq = q.toLowerCase()
  const filtered = cards.filter(c => {
    const s = (c.index + ' ' + c.name + ' ' + (c.keywords||'')).toLowerCase()
    return s.includes(fq)
  })
  filtered.sort(compareCardIndexes)
  filtered.forEach(card => {
    const li = document.createElement('li')
    li.textContent = `${card.index} - ${card.name}`
    li.addEventListener('click', () => {
      selectedCard = card
      showCardDetails(card)
      filterCards(q)
    })
    if (selectedCard && selectedCard.index === card.index) {
      li.classList.add('selected')
    }
    ul.appendChild(li)
  })
}
function startSidebarResize(e) {
  isResizing = true
  document.addEventListener('mousemove', resizeSidebar)
  document.addEventListener('mouseup', stopSidebarResize)
}
function resizeSidebar(e) {
  if (!isResizing) return
  const sb = document.querySelector('.sidebar')
  const nw = Math.min(Math.max(e.clientX, 200), window.innerWidth * 0.6)
  sb.style.width = nw + 'px'
}
function stopSidebarResize() {
  isResizing = false
  document.removeEventListener('mousemove', resizeSidebar)
  document.removeEventListener('mouseup', stopSidebarResize)
}
function openPhotoOptions() {
  if (!selectedCard) {
    showInfoModal('No Card Selected','Please select a card first.')
    return
  }
  document.getElementById('photoOptionsModal').classList.add('visible')
}
function handleImageInput(e) {
  const file = e.target.files[0]
  document.getElementById('photoOptionsModal').classList.remove('visible')
  e.target.value = ''
  if (!file || !selectedCard) return
  const reader = new FileReader()
  reader.onload = ev => {
    if (!selectedCard.images) selectedCard.images = []
    selectedCard.images.push(ev.target.result)
    saveToLocalStorage()
    showCardDetails(selectedCard)
  }
  reader.readAsDataURL(file)
}
function openImageViewer(i) {
  currentImageIndex = i
  showImageAt(currentImageIndex)
  document.getElementById('imageViewerModal').classList.add('visible')
}
function showImageAt(i) {
  if (!selectedCard || !selectedCard.images) return
  const len = selectedCard.images.length
  if (i < 0) i = len - 1
  if (i >= len) i = 0
  currentImageIndex = i
  document.getElementById('viewerImage').src = selectedCard.images[currentImageIndex]
}
function closeImageViewer() {
  document.getElementById('imageViewerModal').classList.remove('visible')
}
let isResizing = false
