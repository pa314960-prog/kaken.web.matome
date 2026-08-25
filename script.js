document.getElementById("year").textContent = new Date().getFullYear();

fetch("games.json")
  .then((res) => res.json())
  .then(renderGames)
  .catch((err) => {
    console.error("games.json の読み込みに失敗しました", err);
    document.getElementById("empty").hidden = false;
  });

function renderGames(games) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");

  if (!games || games.length === 0) {
    empty.hidden = false;
    return;
  }

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
