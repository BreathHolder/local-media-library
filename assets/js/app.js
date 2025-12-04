// Dummy data for now – swap this out with real data later
const mediaItems = [
  {
    name: "Song One.mp3",
    type: "audio",
    sizeBytes: 5_242_880,
    path: "music/Song One.mp3",
  },
  {
    name: "Holiday-Clip.mp4",
    type: "video",
    sizeBytes: 104_857_600,
    path: "videos/Holiday-Clip.mp4",
  },
  {
    name: "Cover-Art.png",
    type: "image",
    sizeBytes: 1_572_864,
    path: "images/Cover-Art.png",
  },
  {
    name: "Notes.txt",
    type: "other",
    sizeBytes: 8_192,
    path: "docs/Notes.txt",
  },
];

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const sortSelect = document.getElementById("sortSelect");
const mediaGrid = document.getElementById("mediaGrid");
const emptyState = document.getElementById("emptyState");
const statsContainer = document.getElementById("libraryStats");

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return "–";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
}

function computeStats(items) {
  const total = items.length;
  const totalBytes = items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
  const byType = items.reduce((acc, item) => {
    const type = item.type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return { total, totalBytes, byType };
}

function renderStats(items) {
  const { total, totalBytes, byType } = computeStats(items);
  statsContainer.innerHTML = "";

  const stats = document.createElement("div");
  stats.className = "stats-row";

  const totalItem = document.createElement("div");
  totalItem.className = "stats-item";
  totalItem.innerHTML = `
    <span class="stats-label">Items</span>
    <span class="stats-value">${total}</span>
  `;
  stats.appendChild(totalItem);

  const sizeItem = document.createElement("div");
  sizeItem.className = "stats-item";
  sizeItem.innerHTML = `
    <span class="stats-label">Total Size</span>
    <span class="stats-value">${formatSize(totalBytes)}</span>
  `;
  stats.appendChild(sizeItem);

  const byTypeItem = document.createElement("div");
  byTypeItem.className = "stats-item";
  const typeParts = Object.entries(byType)
    .map(([type, count]) => `${type}: ${count}`)
    .join(" · ");
  byTypeItem.innerHTML = `
    <span class="stats-label">By Type</span>
    <span class="stats-value">${typeParts || "–"}</span>
  `;
  stats.appendChild(byTypeItem);

  statsContainer.appendChild(stats);
}

function applyFilters() {
  const searchTerm = (searchInput.value || "").toLowerCase();
  const type = typeFilter.value;
  const sort = sortSelect.value;

  let filtered = mediaItems.filter((item) => {
    const matchesType = type === "all" || item.type === type;
    const haystack = `${item.name} ${item.type} ${item.path}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  filtered.sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "size-asc":
        return (a.sizeBytes || 0) - (b.sizeBytes || 0);
      case "size-desc":
        return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      default:
        return 0;
    }
  });

  renderGrid(filtered);
  renderStats(filtered);
}

function renderGrid(items) {
  mediaGrid.innerHTML = "";

  if (!items.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "media-card";

    card.innerHTML = `
      <div class="media-name">${item.name}</div>
      <div class="media-meta">
        <span class="media-type">${item.type || "other"}</span>
        &nbsp;&middot;&nbsp;
        <span>${formatSize(item.sizeBytes)}</span>
      </div>
      <div class="media-path">${item.path || ""}</div>
    `;

    mediaGrid.appendChild(card);
  }
}

// Wire up events
searchInput.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

// Initial render
applyFilters();
