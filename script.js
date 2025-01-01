/*******************************************************
 * DOM REFERENCES & GLOBALS 
 *******************************************************/
const collapseAllBtn = document.getElementById("collapseAllBtn");
const expandAllBtn = document.getElementById("expandAllBtn");
const indexList = document.getElementById("indexList");
const newCardBtn = document.getElementById("newCardBtn");
const newCardBtnHeader = document.getElementById("newCardBtnHeader");
const importJsonBtn = document.getElementById("importJsonBtn");
const placeholderView = document.getElementById("placeholderView");
const cardDetails = document.getElementById("cardDetails");
const cameraBtn = document.getElementById("cameraBtn");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const detailIndex = document.getElementById("detailIndex");
const detailName = document.getElementById("detailName");
const detailFront = document.getElementById("detailFront");
const detailBack = document.getElementById("detailBack");
const detailKeywords = document.getElementById("detailKeywords");
const detailConnections = document.getElementById("detailConnections");
const cardTitle = document.getElementById("cardTitle");
const newCardModal = document.getElementById("newCardModal");
const modalIndex = document.getElementById("modalIndex");
const modalName = document.getElementById("modalName");
const modalKeywords = document.getElementById("modalKeywords");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const addCardBtn = document.getElementById("addCardBtn");
const infoModal = document.getElementById("infoModal");
const infoModalTitle = document.getElementById("infoModalTitle");
const infoModalMessage = document.getElementById("infoModalMessage");
const closeInfoModalBtn = document.getElementById("closeInfoModalBtn");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const jsonImportFile = document.getElementById("jsonImportFile");
const deleteCardModal = document.getElementById("deleteCardModal");
const confirmDeleteCardBtn = document.getElementById("confirmDeleteCardBtn");
const cancelDeleteCardBtn = document.getElementById("cancelDeleteCardBtn");
const deleteCardBtn = document.getElementById("deleteCardBtn");

let cards = {};
let selectedCardIndex = null;

/*******************************************************
 * APP INITIALIZATION
 *******************************************************/
function init() {
  feather.replace();
  fetch("zetteldex.json")
    .then(r => r.json())
    .then(data => {
      cards = data;
      buildIndexList();
    })
    .catch(() => {});
  setupEvents();
}

function setupEvents() {
  closeInfoModalBtn.addEventListener("click", () => {
    infoModal.classList.remove("visible");
  });

  collapseAllBtn.addEventListener("click", () => {
    handleExpansionForAll("false");
  });

  expandAllBtn.addEventListener("click", () => {
    handleExpansionForAll("true");
  });

  indexList.addEventListener("click", e => {
    if (e.target.classList.contains("collapse-arrow")) {
      let li = e.target.closest("li");
      let subUl = li.querySelector("ul");
      if (subUl) {
        let s = li.getAttribute("data-expanded") === "true";
        li.setAttribute("data-expanded", s ? "false" : "true");
        subUl.style.display = s ? "none" : "block";
      }
      handleArrowsRefresh();
      e.stopPropagation();
    } else if (e.target.closest(".collapse-toggle")) {
      let li = e.target.closest("li");
      indexList.querySelectorAll("li").forEach(x => x.classList.remove("selected"));
      li.classList.add("selected");
      let idx = li.querySelector(".index-number");
      let nm = li.querySelector(".card-name");
      if (idx && nm) {
        loadCardDetails(idx.textContent.trim(), nm.textContent.trim());
        selectedCardIndex = idx.textContent.trim();
      }
      e.stopPropagation();
    }
  });

  [newCardBtn, newCardBtnHeader].forEach(b => {
    b.addEventListener("click", () => {
      modalIndex.value = "";
      modalName.value = "";
      modalKeywords.value = "";
      newCardModal.classList.add("visible");
      modalIndex.focus();
    });
  });

  importJsonBtn.addEventListener("click", () => {
    jsonImportFile.click();
  });

  cancelModalBtn.addEventListener("click", () => {
    newCardModal.classList.remove("visible");
  });

  addCardBtn.addEventListener("click", () => {
    let i = modalIndex.value.trim();
    let n = modalName.value.trim();
    let k = modalKeywords.value.trim();
    if (i && n) {
      cards[i] = { index: i, name: n, front: "", back: "", keywords: k, connections: "" };
      newCardModal.classList.remove("visible");
      showInfoModal("Card Added", "Index: " + i + "\nName: " + n);
      buildIndexList();
    } else {
      showInfoModal("Incomplete Data", "Please enter both Index and Name.");
    }
  });

  editBtn.addEventListener("click", () => {
    setCardEditMode(true);
  });

  saveBtn.addEventListener("click", () => {
    let i = detailIndex.value.trim();
    if (!i) {
      showInfoModal("Error", "Invalid card index.");
      return;
    }
    cards[i] = {
      index: detailIndex.value,
      name: detailName.value,
      front: detailFront.value,
      back: detailBack.value,
      keywords: detailKeywords.value,
      connections: detailConnections.value
    };
    setCardEditMode(false);
    showInfoModal("Success", "Your card was saved!");
  });

  deleteCardBtn.addEventListener("click", () => {
    if (!selectedCardIndex) {
      showInfoModal("No Card Selected", "Please select a card before deleting.");
      return;
    }
    deleteCardModal.classList.add("visible");
  });

  cancelDeleteCardBtn.addEventListener("click", () => {
    deleteCardModal.classList.remove("visible");
  });

  confirmDeleteCardBtn.addEventListener("click", () => {
    if (!selectedCardIndex) {
      showInfoModal("Error", "No card is selected.");
      deleteCardModal.classList.remove("visible");
      return;
    }
    deleteCardAndChildren(selectedCardIndex);
    selectedCardIndex = null;
    cardDetails.classList.remove("visible");
    placeholderView.style.display = "block";
    indexList.querySelectorAll("li").forEach(x => x.classList.remove("selected"));
    deleteCardModal.classList.remove("visible");
    showInfoModal("Deleted", "Card and any child cards removed.");
    buildIndexList();
  });

  cameraBtn.addEventListener("click", () => {
    showInfoModal("Feature Coming Soon", "You'll be able to upload images.");
  });

  importBtn.addEventListener("click", () => {
    jsonImportFile.click();
  });

  jsonImportFile.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = h => {
      try {
        const d = JSON.parse(h.target.result);
        cards = { ...cards, ...d };
        showInfoModal("Import JSON", "JSON imported and merged into cards.");
        buildIndexList();
      } catch (i) {
        showInfoModal("Error", "Invalid JSON file.");
      }
    };
    r.readAsText(f);
  });

  exportBtn.addEventListener("click", () => {
    let s = JSON.stringify(cards, null, 2);
    const blob = new Blob([s], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zetteldex_export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showInfoModal("Export JSON", "Your data has been exported!");
  });
}

/*******************************************************
 * HELPER FUNCTIONS
 *******************************************************/
function showInfoModal(t, m) {
  infoModalTitle.textContent = t || "";
  infoModalMessage.textContent = m || "";
  infoModal.classList.add("visible");
}

function loadCardDetails(i, n) {
  placeholderView.style.display = "none";
  cardDetails.classList.add("visible");
  if (cards[i]) {
    detailIndex.value = cards[i].index;
    detailName.value = cards[i].name;
    detailFront.value = cards[i].front || "";
    detailBack.value = cards[i].back || "";
    detailKeywords.value = cards[i].keywords || "";
    detailConnections.value = cards[i].connections || "";
    cardTitle.textContent = cards[i].name;
  } else {
    detailIndex.value = i;
    detailName.value = n;
    detailFront.value = "";
    detailBack.value = "";
    detailKeywords.value = "";
    detailConnections.value = "";
    cardTitle.textContent = n;
  }
  setCardEditMode(false);
}

function setCardEditMode(e) {
  detailIndex.readOnly = !e;
  detailName.readOnly = !e;
  detailFront.readOnly = !e;
  detailBack.readOnly = !e;
  detailKeywords.readOnly = !e;
  detailConnections.readOnly = !e;
  editBtn.style.display = e ? "none" : "inline-block";
  saveBtn.style.display = e ? "inline-block" : "none";
}

function buildIndexList() {
  let u = indexList.querySelector("ul");
  u.innerHTML = "";

  function parseIndex(str) {
    let mainPart = str;
    let extra = [];
    if (str.includes(".")) {
      let parts = str.split(".");
      mainPart = parts.shift();
      extra = parts;
    }
    if (mainPart.length < 4) {
      mainPart = mainPart.padEnd(4, "0");
    }
    if (mainPart.length > 4) {
      let first4 = mainPart.slice(0, 4);
      let remain = mainPart.slice(4).split("");
      return [...first4, ...remain, ...extra];
    }
    return [...mainPart.split(""), ...extra];
  }

  function buildNestedTree(allIndexes) {
    let root = {};
    let sorted = allIndexes.slice().sort((a, b) => {
      let aParsed = parseIndex(a);
      let bParsed = parseIndex(b);
      for (let i = 0; i < Math.max(aParsed.length, bParsed.length); i++) {
        let aNum = parseFloat(aParsed[i] || "0") || 0;
        let bNum = parseFloat(bParsed[i] || "0") || 0;
        if (aNum !== bNum) return aNum - bNum;
      }
      return 0;
    });
    for (let idx of sorted) {
      let levels = parseIndex(idx);
      let curr = root;
      let pathSoFar = [];
      for (let lv of levels) {
        pathSoFar.push(lv);
        let key = pathSoFar.join("_");
        if (!curr[key]) {
          curr[key] = { actualIndex: idx, children: {} };
        }
        curr = curr[key].children;
      }
    }
    return root;
  }

  function createNestedLi(nodeObj, parentUl) {
    let li = document.createElement("li");
    li.setAttribute("data-expanded", "false");
    let div = document.createElement("div");
    div.classList.add("collapse-toggle");
    let arrow = document.createElement("span");
    arrow.classList.add("collapse-arrow");
    let childKeys = Object.keys(nodeObj.children);
    arrow.textContent = childKeys.length > 0 ? "▶" : "";
    let cardData = cards[nodeObj.actualIndex];
    let indexSpan = document.createElement("span");
    indexSpan.classList.add("index-number");
    indexSpan.textContent = cardData ? cardData.index : nodeObj.actualIndex;
    let nameSpan = document.createElement("span");
    nameSpan.classList.add("card-name");
    nameSpan.textContent = cardData ? cardData.name : nodeObj.actualIndex;
    div.appendChild(arrow);
    div.appendChild(indexSpan);
    div.appendChild(nameSpan);
    li.appendChild(div);
    parentUl.appendChild(li);
    if (childKeys.length > 0) {
      let subUl = document.createElement("ul");
      subUl.style.display = "none";
      childKeys.forEach(k => {
        createNestedLi(nodeObj.children[k], subUl);
      });
      li.appendChild(subUl);
    }
  }

  let tree = buildNestedTree(Object.keys(cards));
  Object.keys(tree).forEach(topKey => {
    createNestedLi(tree[topKey], u);
  });
  handleArrowsRefresh();
}

function handleExpansionForAll(e) {
  setAllExpansion(e);
  handleArrowsRefresh();
}

function setAllExpansion(e) {
  indexList.querySelectorAll("li").forEach(li => {
    li.setAttribute("data-expanded", e);
    let c = li.querySelector("ul");
    if (c) {
      c.style.display = e === "true" ? "block" : "none";
    }
  });
}

function handleArrowsRefresh() {
  indexList.querySelectorAll("li").forEach(li => {
    let arrow = li.querySelector(".collapse-arrow");
    let subUl = li.querySelector("ul");
    if (!arrow) return;
    if (!subUl) {
      arrow.textContent = "";
      arrow.style.cursor = "default";
    } else {
      arrow.textContent = li.getAttribute("data-expanded") === "true" ? "▼" : "▶";
    }
  });
}

function deleteCardAndChildren(idx) {
  delete cards[idx];
  Object.keys(cards).forEach(k => {
    if (k.startsWith(idx + ".")) {
      delete cards[k];
    }
  });
}

/*******************************************************
 * LAUNCH
 *******************************************************/
window.addEventListener("DOMContentLoaded", init);
