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

  // 1️⃣ Try loading data from localStorage
  const localData = localStorage.getItem("zetteldex");
  if (localData) {
    try {
      cards = JSON.parse(localData);
      buildIndexList();
    } catch (err) {
      console.error("Local cache parse error:", err);
      // If something goes wrong, fetch from server
      fetchAndCacheZetteldex();
    }
  } else {
    // If no data in localStorage, fetch from server
    fetchAndCacheZetteldex();
  }

  setupEvents();
}

/**
 * Fetch zetteldex.json from server, then store in localStorage
 * so that subsequent loads will come from the cache.
 */
function fetchAndCacheZetteldex() {
  fetch("zetteldex.json")
    .then(r => r.json())
    .then(data => {
      cards = data;
      localStorage.setItem("zetteldex", JSON.stringify(cards));
      buildIndexList();
    })
    .catch(err => {
      console.error("Fetch zetteldex.json error:", err);
    });
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
      // 2️⃣ Update localStorage so the new card is persisted
      localStorage.setItem("zetteldex", JSON.stringify(cards));
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
    // 3️⃣ Update localStorage on save
    localStorage.setItem("zetteldex", JSON.stringify(cards));
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
    // 4️⃣ Update localStorage so the deletion is persisted
    localStorage.setItem("zetteldex", JSON.stringify(cards));
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
        // Merge new data into existing cards
        cards = { ...cards, ...d };
        // Update localStorage with merged data
        localStorage.setItem("zetteldex", JSON.stringify(cards));
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
    // 5️⃣ Always export as zetteldex.json
    a.download = "zetteldex.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showInfoModal("Export JSON", "Your data has been exported as zetteldex.json!");
  });
}

/*******************************************************
 * HELPER FUNCTIONS
 *******************************************************/

/**
 * Show a simple info modal.
 */
function showInfoModal(t, m) {
  infoModalTitle.textContent = t || "";
  infoModalMessage.textContent = m || "";
  infoModal.classList.add("visible");
}

/**
 * Load details for a selected card.
 */
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

/**
 * Toggle between read-only and edit mode on the details.
 */
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

/**
 * Our new parseIndex() that treats each digit as a "folder".
 * - Removes dots entirely
 * - Splits each character into an array
 *
 * "1110" => ["1","1","1","0"]
 * "1111" => ["1","1","1","1"]
 * "1110.1" => "11101" => ["1","1","1","0","1"]
 */
function parseIndex(str) {
  // Remove dots, then split each digit
  let noDots = str.replace(/\./g, "");
  return noDots.split("");
}

/**
 * A helper to see if `prefix` is indeed a prefix of `arr`.
 * i.e. prefix = ["1","1","1"], arr = ["1","1","1","0"] => true
 */
function isPrefixArray(prefix, arr) {
  if (arr.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== arr[i]) return false;
  }
  return true;
}

/**
 * Build the nested index list.
 */
function buildIndexList() {
  let u = indexList.querySelector("ul");
  u.innerHTML = "";

  function buildNestedTree(allIndexes) {
    let root = {};

    // Sort indexes in a natural ascending style
    let sorted = allIndexes.slice().sort((a, b) => {
      let aParsed = parseIndex(a);
      let bParsed = parseIndex(b);
      // Compare digit by digit
      for (let i = 0; i < Math.max(aParsed.length, bParsed.length); i++) {
        let aNum = parseInt(aParsed[i] || "0", 10) || 0;
        let bNum = parseInt(bParsed[i] || "0", 10) || 0;
        if (aNum !== bNum) return aNum - bNum;
      }
      return 0;
    });

    // Build a nested tree object
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
    // Filter out self-duplicates
    childKeys = childKeys.filter(
      k => nodeObj.children[k].actualIndex !== nodeObj.actualIndex
    );

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

/**
 * Collapse or expand all indexes.
 */
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

/**
 * Update the arrow symbols after expansions/collapses.
 */
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

/**
 * Delete the "folder" (minus its last digit) and everything inside it.
 * If "1110" => expansions ["1","1","1","0"],
 * we remove the last chunk => ["1","1","1"] => that is the "parent folder".
 * Then ANY index that starts with ["1","1","1"] gets deleted.
 */
function deleteCardAndChildren(idx) {
  // 1. parse the expansions of the selected index
  const expansions = parseIndex(idx);
  // 2. remove the last digit => treat that as the "folder path" we want to nuke
  expansions.pop(); // e.g. "1110" => ["1","1","1","0"] => pop => ["1","1","1"]

  // 3. Filter all cards that start with those expansions
  const keysToDelete = Object.keys(cards).filter(key => {
    const childExp = parseIndex(key);
    return isPrefixArray(expansions, childExp);
  });

  // 4. Delete them all
  keysToDelete.forEach(k => delete cards[k]);
}

/*******************************************************
 * LAUNCH
 *******************************************************/
window.addEventListener("DOMContentLoaded", init);
