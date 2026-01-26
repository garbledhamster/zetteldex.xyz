let cards = []
let bibCards = []
let selectedCard = null
let currentImageIndex = 0
let scale = 1
let offsetX = 0
let offsetY = 0
let isDragging = false
let startX = 0
let startY = 0
let isEditMode = false
let viewMode = 'zettel'
let isResizing = false
let isAddingCard = false
let isAddingBibCard = false
const HIERARCHY_THRESHOLD = 1000
document.addEventListener('DOMContentLoaded', () => {
  feather.replace()
  loadFromLocalStorage()
  renderSidebar()
  setupListeners()
  showPlaceholder()
  updateViewModeUI()
})
function setupListeners() {
  document.getElementById('homeBtn').addEventListener('click', () => {
    selectedCard = null
    showPlaceholder()
  })
  document.getElementById('toggleViewModeBtn').addEventListener('click', toggleViewMode)
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
  document.getElementById('cancelBibModalBtn').addEventListener('click', closeNewCardModal)
  document.getElementById('addBibCardBtn').addEventListener('click', addBibCardFromModal)
  document.getElementById('editBtn').addEventListener('click', toggleEditMode)
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
  document.getElementById('imageViewerModal').addEventListener('click', e => {
    if (e.target.id === 'imageViewerModal') closeImageViewer()
  })
  const container = document.getElementById('imageViewerContainer')
  container.addEventListener('wheel', e => {
    if (!selectedCard) return
    if (e.ctrlKey) {
      e.preventDefault()
      if (e.deltaY < 0) scale += 0.1
      else scale -= 0.1
      if (scale < 0.1) scale = 0.1
      applyTransform()
    }
  })
  const img = document.getElementById('viewerImage')
  img.addEventListener('mousedown', e => {
    if (scale <= 1) return
    isDragging = true
    startX = e.clientX - offsetX
    startY = e.clientY - offsetY
    e.preventDefault()
  })
  container.addEventListener('mousemove', e => {
    if (!isDragging) return
    offsetX = e.clientX - startX
    offsetY = e.clientY - startY
    applyTransform()
  })
  container.addEventListener('mouseup', () => {
    isDragging = false
  })
  container.addEventListener('mouseleave', () => {
    isDragging = false
  })
}
function showPlaceholder() {
  document.getElementById('placeholderView').style.display = 'block'
  document.getElementById('cardDetails').classList.remove('visible')
}
function toggleViewMode() {
  viewMode = viewMode === 'zettel' ? 'bibliography' : 'zettel'
  selectedCard = null
  updateViewModeUI()
  renderSidebar()
  showPlaceholder()
}
function updateViewModeUI() {
  const btn = document.getElementById('newCardBtnHeader')
  const placeholderBtn = document.getElementById('newCardBtn')
  if (viewMode === 'bibliography') {
    btn.setAttribute('title', 'Add Bibliography Card')
    placeholderBtn.textContent = 'Make new bibliography card'
  } else {
    btn.setAttribute('title', 'Add Note Card')
    placeholderBtn.textContent = 'Make new card'
  }
}
function openNewCardModal() {
  if (viewMode === 'bibliography') {
    document.getElementById('modalAuthor').value = ''
    document.getElementById('modalTitle').value = ''
    document.getElementById('modalSubtitle').value = ''
    document.getElementById('modalYear').value = ''
    document.getElementById('newBibCardModal').classList.add('visible')
  } else {
    document.getElementById('modalIndex').value = ''
    document.getElementById('modalName').value = ''
    document.getElementById('modalKeywords').value = ''
    document.getElementById('newCardModal').classList.add('visible')
  }
}
function closeNewCardModal() {
  document.getElementById('newCardModal').classList.remove('visible')
  document.getElementById('newBibCardModal').classList.remove('visible')
}
function addCardFromModal() {
  // Prevent duplicate submissions
  if (isAddingCard) {
    return
  }

  const index = document.getElementById('modalIndex').value.trim()
  const name = document.getElementById('modalName').value.trim()
  const keywords = document.getElementById('modalKeywords').value.trim()
  if (!index || !name) {
    showInfoModal('Missing Fields','Index and Name are required.')
    return
  }

  isAddingCard = true

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

  // Reset flag after a short delay
  setTimeout(() => {
    isAddingCard = false
  }, 500)
}
function addBibCardFromModal() {
  // Prevent duplicate submissions
  if (isAddingBibCard) {
    return
  }

  const author = document.getElementById('modalAuthor').value.trim()
  const title = document.getElementById('modalTitle').value.trim()
  const subtitle = document.getElementById('modalSubtitle').value.trim()
  const year = document.getElementById('modalYear').value.trim()
  if (!author || !title) {
    showInfoModal('Missing Fields','Author and Title are required.')
    return
  }

  isAddingBibCard = true

  const c = {
    author,
    title,
    subtitle,
    year,
    summary: '',
    goal: '',
    images: []
  }
  bibCards.push(c)
  closeNewCardModal()
  saveToLocalStorage()
  renderSidebar()

  // Reset flag after a short delay
  setTimeout(() => {
    isAddingBibCard = false
  }, 500)
}
function renderSidebar() {
  const ul = document.getElementById('indexList').querySelector('ul')
  ul.innerHTML = ''
  const currentCards = viewMode === 'zettel' ? cards : bibCards
  if (viewMode === 'zettel') {
    currentCards.sort(compareCardIndexes)
  } else {
    currentCards.sort((a, b) => (a.author + a.title).localeCompare(b.author + b.title))
  }
  currentCards.forEach(card => {
    const li = document.createElement('li')
    if (viewMode === 'zettel') {
      li.textContent = `${card.index} - ${card.name}`
    } else {
      li.textContent = `${card.author} - ${card.title}`
    }
    li.addEventListener('click', () => {
      selectedCard = card
      showCardDetails(card)
      renderSidebar()
    })
    
    // Add tooltip event listeners
    addTooltipEventListeners(li, card)
    
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
  
  if (viewMode === 'zettel') {
    document.getElementById('cardTitle').textContent = card.name || '[No Title]'
    document.getElementById('noteFields').style.display = 'block'
    document.getElementById('bibFields').style.display = 'none'
    document.getElementById('detailIndex').value = card.index
    document.getElementById('detailName').value = card.name
    document.getElementById('detailFront').value = card.front || ''
    document.getElementById('detailBack').value = card.back || ''
    document.getElementById('detailKeywords').value = card.keywords || ''
    document.getElementById('detailConnections').value = card.connections || ''
  } else {
    document.getElementById('cardTitle').textContent = card.title || '[No Title]'
    document.getElementById('noteFields').style.display = 'none'
    document.getElementById('bibFields').style.display = 'block'
    document.getElementById('detailAuthor').value = card.author
    document.getElementById('detailBibTitle').value = card.title
    document.getElementById('detailSubtitle').value = card.subtitle || ''
    document.getElementById('detailYear').value = card.year || ''
    document.getElementById('detailSummary').value = card.summary || ''
    document.getElementById('detailGoal').value = card.goal || ''
  }
  
  exitEditMode()
  renderImageGallery(card)
}
function renderImageGallery(card) {
  const gal = document.getElementById('imageGallery')
  gal.innerHTML = ''
  if (!card.images || card.images.length === 0) return
  card.images.forEach((src, i) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'image-thumb-wrapper'
    const thumb = document.createElement('img')
    thumb.className = 'image-thumb'
    thumb.src = src
    thumb.addEventListener('click', () => openImageViewer(i))
    if (isEditMode) {
      const delBtn = document.createElement('button')
      delBtn.className = 'delete-thumb-btn'
      delBtn.textContent = 'X'
      delBtn.style.display = 'block'
      delBtn.addEventListener('click', e => {
        e.stopPropagation()
        if (!selectedCard) return
        selectedCard.images.splice(i,1)
        saveToLocalStorage()
        showCardDetails(selectedCard)
      })
      wrapper.appendChild(delBtn)
    }
    wrapper.appendChild(thumb)
    gal.appendChild(wrapper)
  })
}
function toggleEditMode() {
  if (!selectedCard) return
  if (!isEditMode) {
    enterEditMode()
  } else {
    exitEditMode()
  }
}
function enterEditMode() {
  if (!selectedCard) return
  isEditMode = true
  if (viewMode === 'zettel') {
    document.getElementById('detailIndex').readOnly = false
    document.getElementById('detailName').readOnly = false
    document.getElementById('detailFront').readOnly = false
    document.getElementById('detailBack').readOnly = false
    document.getElementById('detailKeywords').readOnly = false
    document.getElementById('detailConnections').readOnly = false
  } else {
    document.getElementById('detailAuthor').readOnly = false
    document.getElementById('detailBibTitle').readOnly = false
    document.getElementById('detailSubtitle').readOnly = false
    document.getElementById('detailYear').readOnly = false
    document.getElementById('detailSummary').readOnly = false
    document.getElementById('detailGoal').readOnly = false
  }
  document.getElementById('saveBtn').style.display = 'inline-flex'
  renderImageGallery(selectedCard)
}
function exitEditMode() {
  isEditMode = false
  if (viewMode === 'zettel') {
    document.getElementById('detailIndex').readOnly = true
    document.getElementById('detailName').readOnly = true
    document.getElementById('detailFront').readOnly = true
    document.getElementById('detailBack').readOnly = true
    document.getElementById('detailKeywords').readOnly = true
    document.getElementById('detailConnections').readOnly = true
  } else {
    document.getElementById('detailAuthor').readOnly = true
    document.getElementById('detailBibTitle').readOnly = true
    document.getElementById('detailSubtitle').readOnly = true
    document.getElementById('detailYear').readOnly = true
    document.getElementById('detailSummary').readOnly = true
    document.getElementById('detailGoal').readOnly = true
  }
  document.getElementById('saveBtn').style.display = 'none'
  renderImageGallery(selectedCard)
}
function saveCardChanges() {
  if (!selectedCard) return
  if (viewMode === 'zettel') {
    selectedCard.index = document.getElementById('detailIndex').value.trim()
    selectedCard.name = document.getElementById('detailName').value.trim()
    selectedCard.front = document.getElementById('detailFront').value
    selectedCard.back = document.getElementById('detailBack').value
    selectedCard.keywords = document.getElementById('detailKeywords').value.trim()
    selectedCard.connections = document.getElementById('detailConnections').value.trim()
  } else {
    selectedCard.author = document.getElementById('detailAuthor').value.trim()
    selectedCard.title = document.getElementById('detailBibTitle').value.trim()
    selectedCard.subtitle = document.getElementById('detailSubtitle').value.trim()
    selectedCard.year = document.getElementById('detailYear').value.trim()
    selectedCard.summary = document.getElementById('detailSummary').value
    selectedCard.goal = document.getElementById('detailGoal').value
  }
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
async function confirmDeleteCard() {
  if (!selectedCard) return

  // Delete from Firebase first if available
  if (window.deleteFromFirebase) {
    try {
      const cardType = viewMode === 'zettel' ? 'note' : 'bibliography'
      await window.deleteFromFirebase(selectedCard, cardType)
    } catch (error) {
      console.error('Error deleting from Firebase:', error)
      // Continue with local deletion even if Firebase fails
    }
  }

  // Delete from local storage
  if (viewMode === 'zettel') {
    removeCard(selectedCard.index)
  } else {
    removeBibCard(selectedCard.author, selectedCard.title)
  }
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
function removeBibCard(author, title) {
  for (let i = 0; i < bibCards.length; i++) {
    if (bibCards[i].author === author && bibCards[i].title === title) {
      bibCards.splice(i,1)
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
        if (viewMode === 'zettel') {
          cards = imported
        } else {
          bibCards = imported
        }
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
  const currentData = viewMode === 'zettel' ? cards : bibCards
  const data = JSON.stringify(currentData, null, 2)
  const b = new Blob([data], { type: 'application/json' })
  const u = URL.createObjectURL(b)
  const a = document.createElement('a')
  a.href = u
  a.download = viewMode === 'zettel' ? 'notes.json' : 'bibliography.json'
  a.click()
  URL.revokeObjectURL(u)
}
function loadFromLocalStorage() {
  const d = localStorage.getItem('notesData')
  if (d) {
    try {
      cards = JSON.parse(d)
    } catch (e) {
      cards = []
    }
  }
  const bd = localStorage.getItem('bibCardsData')
  if (bd) {
    try {
      bibCards = JSON.parse(bd)
    } catch (e) {
      bibCards = []
    }
  }
}
function saveToLocalStorage() {
  localStorage.setItem('notesData', JSON.stringify(cards))
  localStorage.setItem('bibCardsData', JSON.stringify(bibCards))

  // Sync to Firebase if available
  if (window.syncAllToFirebase) {
    window.syncAllToFirebase(cards, bibCards).catch(err => {
      console.error('Error syncing to Firebase:', err)
    })
  }
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
  const currentCards = viewMode === 'zettel' ? cards : bibCards
  const filtered = currentCards.filter(c => {
    if (viewMode === 'zettel') {
      const s = (c.index + ' ' + c.name + ' ' + (c.keywords||'')).toLowerCase()
      return s.includes(fq)
    } else {
      const s = (c.author + ' ' + c.title + ' ' + (c.subtitle||'')).toLowerCase()
      return s.includes(fq)
    }
  })
  if (viewMode === 'zettel') {
    filtered.sort(compareCardIndexes)
  } else {
    filtered.sort((a, b) => (a.author + a.title).localeCompare(b.author + b.title))
  }
  filtered.forEach(card => {
    const li = document.createElement('li')
    if (viewMode === 'zettel') {
      li.textContent = `${card.index} - ${card.name}`
    } else {
      li.textContent = `${card.author} - ${card.title}`
    }
    li.addEventListener('click', () => {
      selectedCard = card
      showCardDetails(card)
      filterCards(q)
    })
    
    // Add tooltip event listeners
    addTooltipEventListeners(li, card)
    
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
  resetTransform()
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
  resetTransform()
}
function resetTransform() {
  scale = 1
  offsetX = 0
  offsetY = 0
  applyTransform()
}
function applyTransform() {
  const img = document.getElementById('viewerImage')
  img.style.transform = 'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')'
}

// Function to extract parent indexes from a card index
function getParentIndexes(cardIndex) {
  const parents = []
  let currentIndex = cardIndex.trim()
  
  while (currentIndex) {
    // Remove slash suffix (e.g., "1010.1/1" -> "1010.1")
    if (currentIndex.includes('/')) {
      currentIndex = currentIndex.substring(0, currentIndex.lastIndexOf('/'))
      parents.push(currentIndex)
      continue
    }
    
    // Remove dot suffix (e.g., "1010.1" -> "1010")
    if (currentIndex.includes('.')) {
      currentIndex = currentIndex.substring(0, currentIndex.lastIndexOf('.'))
      parents.push(currentIndex)
      continue
    }
    
    // For numeric-only indexes, go to the parent level (e.g., "1010" -> "1000", "1100" -> "1000")
    // This assumes a standard Zettelkasten numbering system
    const numMatch = currentIndex.match(/^(\d+)$/)
    if (numMatch) {
      const num = parseInt(numMatch[1])
      if (num >= HIERARCHY_THRESHOLD) {
        // Round down to nearest 1000 for the parent (1010 -> 1000, 1100 -> 1000, 2345 -> 2000)
        const parent = Math.floor(num / HIERARCHY_THRESHOLD) * HIERARCHY_THRESHOLD
        if (parent > 0 && parent < num) {
          currentIndex = parent.toString()
          parents.push(currentIndex)
          continue
        }
      }
    }
    
    break
  }
  
  return parents
}

// Function to build tooltip content with parent card names
function buildTooltipContent(cardIndex) {
  const parentIndexes = getParentIndexes(cardIndex)
  
  if (parentIndexes.length === 0) {
    return '' // No parents, no tooltip
  }
  
  const pathParts = []
  parentIndexes.forEach(parentIdx => {
    const parentCard = cards.find(c => c.index === parentIdx)
    if (parentCard) {
      pathParts.push(`${parentCard.index} - ${parentCard.name}`)
    } else {
      pathParts.push(`${parentIdx} (not found)`)
    }
  })
  
  return pathParts.join('\n↓ ')
}

// Show tooltip
function showTooltip(event, content) {
  if (!content) return
  
  let tooltip = document.getElementById('cardTooltip')
  if (!tooltip) {
    tooltip = document.createElement('div')
    tooltip.id = 'cardTooltip'
    tooltip.className = 'card-tooltip'
    document.body.appendChild(tooltip)
  }
  
  tooltip.textContent = content
  tooltip.style.display = 'block'
  
  // Position tooltip near the mouse
  const x = event.clientX + 10
  const y = event.clientY + 10
  tooltip.style.left = x + 'px'
  tooltip.style.top = y + 'px'
}

// Hide tooltip
function hideTooltip() {
  const tooltip = document.getElementById('cardTooltip')
  if (tooltip) {
    tooltip.style.display = 'none'
  }
}

// Add tooltip event listeners to a list item
function addTooltipEventListeners(li, card) {
  li.addEventListener('mouseenter', (e) => {
    const tooltipContent = buildTooltipContent(card.index)
    if (tooltipContent) {
      showTooltip(e, tooltipContent)
    }
  })
  li.addEventListener('mouseleave', () => {
    hideTooltip()
  })
  li.addEventListener('mousemove', (e) => {
    // Update tooltip position as mouse moves
    const tooltip = document.getElementById('cardTooltip')
    if (tooltip && tooltip.style.display === 'block') {
      tooltip.style.left = (e.clientX + 10) + 'px'
      tooltip.style.top = (e.clientY + 10) + 'px'
    }
  })
}

// Firebase sync callbacks - called by main.js when data is updated from Firestore
window.updateCardsFromFirebase = function(newCards) {
  console.log('Updating cards from Firebase:', newCards.length)
  cards = newCards
  localStorage.setItem('notesData', JSON.stringify(cards))
  if (viewMode === 'zettel') {
    renderSidebar()
    // Re-select current card if it still exists
    if (selectedCard) {
      const stillExists = cards.find(c => c.index === selectedCard.index || c.artifactId === selectedCard.artifactId)
      if (stillExists) {
        selectedCard = stillExists
        showCardDetails(selectedCard)
      } else {
        showPlaceholder()
      }
    }
  }
}

window.updateBibCardsFromFirebase = function(newBibCards) {
  console.log('Updating bibliography cards from Firebase:', newBibCards.length)
  bibCards = newBibCards
  localStorage.setItem('bibCardsData', JSON.stringify(bibCards))
  if (viewMode === 'bibliography') {
    renderSidebar()
    // Re-select current card if it still exists
    if (selectedCard) {
      const stillExists = bibCards.find(c => c.title === selectedCard.title || c.artifactId === selectedCard.artifactId)
      if (stillExists) {
        selectedCard = stillExists
        showCardDetails(selectedCard)
      } else {
        showPlaceholder()
      }
    }
  }
}
