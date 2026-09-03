document.getElementById("year").textContent = new Date().getFullYear();

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const GAMES_COLLECTION = "games";

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const addBtn = document.getElementById("add-btn");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const gameForm = document.getElementById("game-form");
const fieldTitle = document.getElementById("field-title");
const fieldDesc = document.getElementById("field-desc");
const fieldTags = document.getElementById("field-tags");
const fieldUrl = document.getElementById("field-url");
const fieldThumb = document.getElementById("field-thumb");
const formError = document.getElementById("form-error");
const modalCancel = document.getElementById("modal-cancel");

let editingId = null;

const THUMB_COLORS = ["#4b5563", "#2563eb", "#c2410c", "#7e22ce", "#be185d", "#0f766e", "#b45309", "#3730a3"];

function generateThumbDataUri(title) {
  const ch = (title || "?").trim().charAt(0) || "?";
  let hash = 0;
  for (let i = 0; i < (title || "").length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  const color = THUMB_COLORS[hash % THUMB_COLORS.length];
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>` +
    `<rect width='400' height='400' fill='${color}'/>` +
    `<text x='50%' y='50%' font-size='160' fill='white' text-anchor='middle' dominant-baseline='central' font-family='sans-serif'>${ch}</text>` +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

async function seedInitialGamesIfEmpty() {
  const snapshot = await db.collection(GAMES_COLLECTION).limit(1).get();
  if (!snapshot.empty) return;

  const res = await fetch("games.json");
  const initialGames = await res.json();

  const batch = db.batch();
  initialGames.forEach((game, index) => {
    const ref = db.collection(GAMES_COLLECTION).doc(game.id);
    batch.set(ref, {
      title: game.title,
      desc: game.desc || "",
      tags: game.tags || [],
      url: game.url,
      thumb: game.thumb,
      createdAt: firebase.firestore.Timestamp.fromMillis(index),
    });
  });
  await batch.commit();
}

function renderGames(games) {
  grid.innerHTML = "";

  if (!games || games.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const frag = document.createDocumentFragment();

  for (const game of games) {
    const card = document.createElement("a");
    card.className = "card";
    card.href = game.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const thumbWrap = document.createElement("div");
    thumbWrap.className = "thumb-wrap";
    const img = document.createElement("img");
    img.src = game.thumb;
    img.alt = game.title;
    img.loading = "lazy";
    thumbWrap.appendChild(img);

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.textContent = "✎ 編集";
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal("edit", game);
    });
    thumbWrap.appendChild(editBtn);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = game.title;

    const desc = document.createElement("p");
    desc.className = "card-desc";
    desc.textContent = game.desc || "";

    const tags = document.createElement("div");
    tags.className = "tags";
    for (const t of game.tags || []) {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tags.appendChild(span);
    }

    body.append(title, desc, tags);
    card.append(thumbWrap, body);
    frag.appendChild(card);
  }

  grid.appendChild(frag);
}

function subscribeGames() {
  db.collection(GAMES_COLLECTION)
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (snapshot) => {
        const games = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderGames(games);
      },
      (err) => {
        console.error("games の読み込みに失敗しました", err);
        empty.hidden = false;
      }
    );
}

function openModal(mode, game) {
  formError.hidden = true;
  formError.textContent = "";

  if (mode === "edit") {
    editingId = game.id;
    modalTitle.textContent = "ゲームを編集";
    fieldTitle.value = game.title || "";
    fieldDesc.value = game.desc || "";
    fieldTags.value = (game.tags || []).join(", ");
    fieldUrl.value = game.url || "";
    fieldThumb.value = game.thumb && game.thumb.startsWith("data:") ? "" : game.thumb || "";
  } else {
    editingId = null;
    modalTitle.textContent = "ゲームを追加";
    gameForm.reset();
  }

  modalOverlay.hidden = false;
  fieldTitle.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  editingId = null;
}

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const title = fieldTitle.value.trim();
  const desc = fieldDesc.value.trim();
  const tags = fieldTags.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 5);
  const url = fieldUrl.value.trim();
  const thumbInput = fieldThumb.value.trim();

  if (!title || title.length > 99) {
    showFormError("タイトルは1〜99文字で入力してください。");
    return;
  }
  if (desc.length >= 500) {
    showFormError("説明は500文字未満で入力してください。");
    return;
  }
  if (!url || url.length >= 500 || !/^https?:\/\//.test(url)) {
    showFormError("リンクURLはhttp(s)://で始まる形式で入力してください。");
    return;
  }

  const thumb = thumbInput || generateThumbDataUri(title);
  if (thumb.length >= 500) {
    showFormError("サムネイル画像URLが長すぎます。");
    return;
  }

  const data = { title, desc, tags, url, thumb };

  const saveBtn = document.getElementById("modal-save");
  saveBtn.disabled = true;
  try {
    if (editingId) {
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(GAMES_COLLECTION).doc(editingId).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(GAMES_COLLECTION).add(data);
    }
    closeModal();
  } catch (err) {
    console.error(err);
    showFormError("保存に失敗しました。しばらくしてから再度お試しください。");
  } finally {
    saveBtn.disabled = false;
  }
}

addBtn.addEventListener("click", () => openModal("add"));
modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
gameForm.addEventListener("submit", handleFormSubmit);

seedInitialGamesIfEmpty()
  .catch((err) => console.error("初期データの登録に失敗しました", err))
  .finally(subscribeGames);
