const books = [
  {
    id: "ramen-quest",
    laneId: "contextual-situation",
    laneName: "Contextual Situation",
    title: "RAMEN QUEST",
    chapterNumber: "01",
    chapterName: "The First Bowl",
    accent: "#e2ad54",
    coverBase: "assets/contextual-situation/ramen-quest/covers",
    pages: [
      "assets/contextual-situation/ramen-quest/pages/page-001/metadata.json",
      "assets/contextual-situation/ramen-quest/pages/page-002/metadata.json",
      "assets/contextual-situation/ramen-quest/pages/page-003/metadata.json",
      "assets/contextual-situation/ramen-quest/pages/page-004/metadata.json",
    ],
  },
  {
    id: "tokyo-train-quest",
    laneId: "contextual-situation",
    laneName: "Contextual Situation",
    title: "TOKYO TRAIN QUEST",
    chapterNumber: "02",
    chapterName: "The First Commute",
    accent: "#2474bf",
    coverBase: "assets/contextual-situation/tokyo-train-quest/covers",
    hasWebp: false,
    pages: [
      "assets/contextual-situation/tokyo-train-quest/pages/page-001/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-002/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-003/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-004/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-005/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-006/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-007/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-008/metadata.json",
      "assets/contextual-situation/tokyo-train-quest/pages/page-009/metadata.json",
    ],
  },
  {
    id: "nodeheart-luminus",
    laneId: "nodeheart-series",
    laneName: "Nodeheart Series",
    title: "NODEHEART LUMINUS",
    chapterNumber: "01",
    chapterName: "The Shark King",
    accent: "#61c7d8",
    coverBase: "assets/nodeheart-series/nodeheart-luminus/covers",
    pages: [
      "assets/nodeheart-series/nodeheart-luminus/pages/page-001/metadata.json",
      "assets/nodeheart-series/nodeheart-luminus/pages/page-002/metadata.json",
      "assets/nodeheart-series/nodeheart-luminus/pages/page-003/metadata.json",
      "assets/nodeheart-series/nodeheart-luminus/pages/page-004/metadata.json",
      "assets/nodeheart-series/nodeheart-luminus/pages/page-005/metadata.json",
    ],
  },
  {
    id: "crows-of-ashes",
    laneId: "naruto-shinden",
    laneName: "Naruto Shinden",
    title: "NARUTO: THE CROWS OF ASHES",
    chapterNumber: "01",
    chapterName: "The Crows of Ashes",
    accent: "#c9362c",
    coverBase: "assets/naruto-shinden/crows-of-ashes/covers",
    hasWebp: false,
    pages: [
      "assets/naruto-shinden/crows-of-ashes/pages/page-001/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-002/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-003/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-004/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-005/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-006/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-007/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-008/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-009/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-010/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-011/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-012/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-013/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-014/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-015/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-016/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-017/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-018/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-019/metadata.json",
      "assets/naruto-shinden/crows-of-ashes/pages/page-020/metadata.json",
    ],
  },
];

const MAX_ZOOM_SCALE = 3;
const OFFLINE_CACHE_NAME = "learn-with-story-offline-v3";
const OFFLINE_CACHE_KEY = "learn-with-story:cache-stories";
const OFFLINE_CACHE_SIGNATURE_KEY = "learn-with-story:cache-signature";
const libraryRoot = document.querySelector("[data-library]");
const pageMetadataCache = new Map();
const imagePreloadCache = new Set();
let offlineCachePromise = null;
const state = {
  view: "library",
  activeBook: null,
  pages: [],
  pageIndex: 0,
  zoomed: false,
  zoomIndex: 0,
  overlayOpen: false,
  introOpen: false,
  pointerStart: null,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pageMetadataUrl(metadataPath) {
  return new URL(metadataPath, window.location.href);
}

function absoluteUrl(path) {
  return new URL(path, window.location.href).toString();
}

function loadPageMetadata(metadataPath) {
  if (!pageMetadataCache.has(metadataPath)) {
    const pagePromise = fetch(pageMetadataUrl(metadataPath), { cache: "reload" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${metadataPath}`);
        }
        return response.json();
      })
      .then((page) => ({
        ...page,
        metadataPath,
        imageUrl: new URL(page.image, pageMetadataUrl(metadataPath)).toString(),
      }));

    pageMetadataCache.set(metadataPath, pagePromise);
  }

  return pageMetadataCache.get(metadataPath);
}

function preloadImage(url) {
  if (!url || imagePreloadCache.has(url)) {
    return;
  }

  imagePreloadCache.add(url);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
}

function preloadPageImage(page) {
  preloadImage(page?.imageUrl);
}

function preloadPageMetadataAndImage(metadataPath) {
  loadPageMetadata(metadataPath).then(preloadPageImage).catch(() => {});
}

function preloadFirstStoryPages() {
  const warmFirstPages = () => {
    for (const book of books) {
      if (book.pages.length > 0) {
        preloadPageMetadataAndImage(book.pages[0]);
      }
    }
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmFirstPages, { timeout: 1200 });
  } else {
    window.setTimeout(warmFirstPages, 120);
  }
}

function offlineCacheSupported() {
  return "caches" in window && "serviceWorker" in navigator && window.isSecureContext;
}

function getOfflineCacheEnabled() {
  try {
    return window.localStorage.getItem(OFFLINE_CACHE_KEY) !== "false";
  } catch {
    return true;
  }
}

function setOfflineCacheEnabled(enabled) {
  try {
    window.localStorage.setItem(OFFLINE_CACHE_KEY, enabled ? "true" : "false");
  } catch {
    // The toggle still works for this session if localStorage is unavailable.
  }
}

function offlineCacheSignature() {
  return JSON.stringify(
    books.map((book) => ({
      id: book.id,
      cacheName: OFFLINE_CACHE_NAME,
      coverBase: book.coverBase,
      pages: book.pages,
    })),
  );
}

function hasCurrentOfflineCacheSignature() {
  try {
    return window.localStorage.getItem(OFFLINE_CACHE_SIGNATURE_KEY) === offlineCacheSignature();
  } catch {
    return false;
  }
}

function markCurrentOfflineCacheSignature() {
  try {
    window.localStorage.setItem(OFFLINE_CACHE_SIGNATURE_KEY, offlineCacheSignature());
  } catch {
    // Cache completion does not depend on localStorage.
  }
}

function coverAssetUrls(book) {
  const widths = ["480", "720", "960", "1086"];
  const urls = [absoluteUrl(`${book.coverBase}/cover-original.png`)];

  for (const width of widths) {
    if (book.hasWebp !== false) {
      urls.push(absoluteUrl(`${book.coverBase}/cover-${width}.webp`));
    }
    urls.push(absoluteUrl(`${book.coverBase}/cover-${width}.jpg`));
  }

  return urls;
}

async function storyAssetUrls() {
  const urls = new Set([
    absoluteUrl("./"),
    absoluteUrl("index.html"),
    absoluteUrl("app.js"),
    absoluteUrl("styles.css"),
    absoluteUrl("sw.js"),
  ]);
  let complete = true;

  for (const book of books) {
    for (const url of coverAssetUrls(book)) {
      urls.add(url);
    }

    for (const metadataPath of book.pages) {
      urls.add(pageMetadataUrl(metadataPath).toString());

      try {
        const page = await loadPageMetadata(metadataPath);
        urls.add(page.imageUrl);
      } catch {
        complete = false;
        // Leave failed metadata unmarked so the next online load can retry.
      }
    }
  }

  return {
    complete,
    urls: [...urls],
  };
}

async function cacheUrl(cache, url) {
  const request = new Request(url, { cache: "reload" });
  const response = await fetch(request);

  if (!response.ok) {
    throw new Error(`Could not cache ${url}`);
  }

  await cache.put(request, response.clone());
}

async function cacheStoriesForOffline({ force = false } = {}) {
  if (!offlineCacheSupported() || !getOfflineCacheEnabled()) {
    return;
  }

  if (!force && hasCurrentOfflineCacheSignature()) {
    return;
  }

  if (offlineCachePromise) {
    return offlineCachePromise;
  }

  offlineCachePromise = (async () => {
    const { complete, urls } = await storyAssetUrls();
    const cache = await window.caches.open(OFFLINE_CACHE_NAME);
    const results = await Promise.allSettled(urls.map((url) => cacheUrl(cache, url)));
    const failed = !complete || results.some((result) => result.status === "rejected");

    if (!failed) {
      markCurrentOfflineCacheSignature();
    }
  })().finally(() => {
    offlineCachePromise = null;
  });

  return offlineCachePromise;
}

function scheduleOfflineStoryCache({ force = false } = {}) {
  if (!getOfflineCacheEnabled()) {
    return;
  }

  const startCaching = () => {
    cacheStoriesForOffline({ force }).catch((error) => {
      console.warn("Story offline cache failed", error);
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(startCaching, { timeout: 1600 });
  } else {
    window.setTimeout(startCaching, 180);
  }
}

function createOfflineToggle() {
  const shell = document.createElement("label");
  shell.className = "offline-toggle";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = getOfflineCacheEnabled();
  input.disabled = !offlineCacheSupported();
  input.setAttribute("aria-label", "Cache stories for offline reading");

  const text = document.createElement("span");
  text.className = "offline-toggle-text";
  text.textContent = "Offline";

  const track = document.createElement("span");
  track.className = "offline-toggle-track";
  track.setAttribute("aria-hidden", "true");

  input.addEventListener("change", () => {
    setOfflineCacheEnabled(input.checked);

    if (input.checked) {
      scheduleOfflineStoryCache({ force: true });
    }
  });

  shell.append(input, text, track);
  return shell;
}

function preloadReaderNeighbors() {
  for (const index of [state.pageIndex, state.pageIndex + 1, state.pageIndex - 1]) {
    preloadPageImage(state.pages[index]);
  }
}

function coverSources(book) {
  const sources = {
    webp: book.hasWebp === false ? "" : [
      `${book.coverBase}/cover-480.webp 480w`,
      `${book.coverBase}/cover-720.webp 720w`,
      `${book.coverBase}/cover-960.webp 960w`,
      `${book.coverBase}/cover-1086.webp 1086w`,
    ].join(", "),
    jpg: [
      `${book.coverBase}/cover-480.jpg 480w`,
      `${book.coverBase}/cover-720.jpg 720w`,
      `${book.coverBase}/cover-960.jpg 960w`,
      `${book.coverBase}/cover-1086.jpg 1086w`,
    ].join(", "),
    fallback: `${book.coverBase}/cover-original.png`,
  };

  return sources;
}

function createCoverPicture(book, loading) {
  const sources = coverSources(book);
  const picture = document.createElement("picture");
  const jpg = document.createElement("source");
  const img = document.createElement("img");

  if (sources.webp) {
    const webp = document.createElement("source");
    webp.type = "image/webp";
    webp.srcset = sources.webp;
    webp.sizes = "(max-width: 760px) 84vw, 430px";
    picture.append(webp);
  }

  jpg.type = "image/jpeg";
  jpg.srcset = sources.jpg;
  jpg.sizes = "(max-width: 760px) 84vw, 430px";

  img.src = sources.fallback;
  img.alt = `${book.title} cover`;
  img.width = 1086;
  img.height = 1448;
  img.loading = loading;
  img.decoding = "async";
  img.fetchPriority = loading === "eager" ? "high" : "auto";

  picture.append(jpg, img);
  return picture;
}

function bookLabel(book) {
  return `${book.laneName} - CHAPTER ${book.chapterNumber} - ${book.chapterName}`;
}

function createButton(className, label, text) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function createBookCard(book, isFirstBook) {
  const item = document.createElement("li");
  item.className = "book-item";

  const card = createButton("book-card", `${book.title}, ${bookLabel(book)}`, "");
  card.dataset.bookId = book.id;
  card.style.setProperty("--book-accent", book.accent);
  card.addEventListener("click", () => {
    if (book.pages.length > 0) {
      openBook(book);
    }
  });

  const cover = document.createElement("span");
  cover.className = "cover-shell";
  cover.append(createCoverPicture(book, isFirstBook ? "eager" : "lazy"));

  const chapter = document.createElement("span");
  chapter.className = "book-label";
  chapter.textContent = bookLabel(book);

  card.append(cover, chapter);
  item.append(card);
  return item;
}

function renderLibrary() {
  document.body.dataset.view = "library";
  libraryRoot.className = "library";
  state.view = "library";
  state.activeBook = null;
  state.pages = [];
  state.pageIndex = 0;
  state.zoomed = false;
  state.zoomIndex = 0;
  state.overlayOpen = false;
  state.introOpen = false;

  const fragment = document.createDocumentFragment();
  const list = document.createElement("ul");
  list.className = "book-list";
  list.setAttribute("aria-label", "Book covers");

  books.forEach((book, index) => list.append(createBookCard(book, index === 0)));
  fragment.append(createOfflineToggle(), list);
  libraryRoot.replaceChildren(fragment);
  preloadFirstStoryPages();
  scheduleOfflineStoryCache();
}

function renderLoading(book) {
  document.body.dataset.view = "reader";
  libraryRoot.className = "library is-reader";
  const loading = document.createElement("section");
  loading.className = "reader-loading";
  loading.textContent = `Loading ${book.title}`;
  libraryRoot.replaceChildren(loading);
}

async function openBook(book) {
  renderLoading(book);

  try {
    const pages = await Promise.all(book.pages.map(loadPageMetadata));

    state.view = "reader";
    state.activeBook = book;
    state.pages = pages;
    state.pageIndex = 0;
    state.zoomed = false;
    state.zoomIndex = 0;
    state.overlayOpen = false;
    state.introOpen = !hasSeenControlsIntro(book);
    renderReader();
  } catch (error) {
    renderReaderError(book, error);
  }
}

function renderReaderError(book, error) {
  const section = document.createElement("section");
  section.className = "reader-error";

  const back = createButton("reader-icon-button", "Back to books", "<");
  back.addEventListener("click", renderLibrary);

  const message = document.createElement("p");
  message.textContent = `${book.title} could not be opened. ${error.message}`;

  section.append(back, message);
  libraryRoot.replaceChildren(section);
}

function currentPage() {
  return state.pages[state.pageIndex];
}

function currentZoomPoint() {
  const points = resolvedZoomPoints(currentPage());
  return points[state.zoomIndex] || points[0] || { x: 0.5, y: 0.5, scale: 2.2 };
}

function normalizedCoordinate(value, fallback) {
  return clamp(Number.isFinite(value) ? value : fallback, 0, 1);
}

function normalizedZoomRect(point) {
  const rect = point?.rect;

  if (rect) {
    const x = clamp(rect.x, 0, 1);
    const y = clamp(rect.y, 0, 1);
    const w = clamp(rect.w, 0.04, 1 - x);
    const h = clamp(rect.h, 0.04, 1 - y);

    return { x, y, w, h };
  }

  const w = 0.34;
  const h = 0.24;
  const centerX = clamp(point?.x ?? 0.5, 0, 1);
  const centerY = clamp(point?.y ?? 0.5, 0, 1);

  return {
    x: clamp(centerX - w / 2, 0, 1 - w),
    y: clamp(centerY - h / 2, 0, 1 - h),
    w,
    h,
  };
}

function resolvedZoomPoints(page) {
  return page?.zoom?.points || [];
}

function normalizedFramePolygon(frame) {
  if (!Array.isArray(frame?.polygon) || frame.polygon.length < 3) {
    return [];
  }

  return frame.polygon.map((vertex) => ({
    x: normalizedCoordinate(vertex.x, 0.5),
    y: normalizedCoordinate(vertex.y, 0.5),
  }));
}

function currentZoomFrame(page, point) {
  if (!point?.frameId) {
    return null;
  }

  return (page?.zoom?.frames || []).find((frame) => frame.id === point.frameId) || null;
}

function zoomMaskPath(polygon) {
  const innerPath = polygon
    .map((vertex, index) => `${index === 0 ? "M" : "L"}${(vertex.x * 100).toFixed(3)} ${(vertex.y * 100).toFixed(3)}`)
    .join(" ");

  return `M0 0H100V100H0Z ${innerPath}Z`;
}

function zoomMaskUrl(polygon) {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">',
    `<path fill="white" fill-rule="evenodd" d="${zoomMaskPath(polygon)}"/>`,
    "</svg>",
  ].join("");

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function updateZoomSpotlight(spotlight, page, point) {
  if (!spotlight) {
    return;
  }

  const polygon = normalizedFramePolygon(currentZoomFrame(page, point));
  const points = polygon.map((vertex) => `${(vertex.x * 100).toFixed(3)},${(vertex.y * 100).toFixed(3)}`).join(" ");
  const shade = spotlight.querySelector(".zoom-spotlight-image");
  const outline = spotlight.querySelector(".zoom-focus-polygon");
  const maskUrl = polygon.length >= 3 ? zoomMaskUrl(polygon) : "";
  spotlight.classList.toggle("is-missing-frame", polygon.length < 3);

  if (shade) {
    shade.style.maskImage = maskUrl;
    shade.style.webkitMaskImage = maskUrl;
  }

  if (outline) {
    outline.setAttribute("points", points);
  }
}

function computePageFrame(page, point = currentZoomPoint()) {
  const viewportWidth = window.visualViewport?.width || window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const imageRatio = page.width / page.height;
  let displayWidth = viewportWidth;
  let displayHeight = displayWidth / imageRatio;

  if (displayHeight > viewportHeight) {
    displayHeight = viewportHeight;
    displayWidth = displayHeight * imageRatio;
  }

  if (!state.zoomed) {
    return {
      displayWidth,
      displayHeight,
      transform: "matrix(1, 0, 0, 1, 0, 0)",
    };
  }

  const region = normalizedZoomRect(point);
  const regionCenterX = region.x + region.w / 2;
  const regionCenterY = region.y + region.h / 2;
  let scale = Math.min(point.scale || 2.2, MAX_ZOOM_SCALE);

  const paddedViewportWidth = viewportWidth * (point.fitWidth || 0.9);
  const paddedViewportHeight = viewportHeight * (point.fitHeight || 0.86);
  const fitScale = Math.min(
    paddedViewportWidth / (region.w * displayWidth),
    paddedViewportHeight / (region.h * displayHeight),
  );
  scale = Math.min(fitScale, scale, MAX_ZOOM_SCALE);

  const scaledWidth = displayWidth * scale;
  const scaledHeight = displayHeight * scale;
  const baseLeft = (viewportWidth - displayWidth) / 2;
  const baseTop = (viewportHeight - displayHeight) / 2;
  const visualLeft = viewportWidth / 2 - regionCenterX * scaledWidth;
  const visualTop = viewportHeight / 2 - regionCenterY * scaledHeight;
  const translateX = visualLeft - baseLeft;
  const translateY = visualTop - baseTop;

  return {
    displayWidth,
    displayHeight,
    transform: `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`,
  };
}

function applyCurrentZoomFrame() {
  const frame = document.querySelector(".page-frame");
  if (!frame) {
    return false;
  }

  const layout = computePageFrame(currentPage());
  frame.style.width = `${layout.displayWidth}px`;
  frame.style.height = `${layout.displayHeight}px`;
  frame.style.transform = layout.transform;
  updateZoomSpotlight(frame.querySelector(".zoom-spotlight"), currentPage(), currentZoomPoint());
  return true;
}

function controlsIntroKey(book) {
  return `learn-with-story:controls-seen:${book.id}`;
}

function hasSeenControlsIntro(book) {
  try {
    return window.localStorage.getItem(controlsIntroKey(book)) === "true";
  } catch {
    return false;
  }
}

function markControlsIntroSeen() {
  try {
    window.localStorage.setItem(controlsIntroKey(state.activeBook), "true");
  } catch {
    // The intro should still close when localStorage is unavailable.
  }
  state.introOpen = false;
  renderReader();
}

function setPage(delta) {
  if (state.zoomed) {
    setZoomPoint(delta);
    return;
  }

  const nextIndex = clamp(state.pageIndex + delta, 0, state.pages.length - 1);
  if (nextIndex !== state.pageIndex) {
    state.pageIndex = nextIndex;
    state.zoomIndex = 0;
    state.overlayOpen = false;
    renderReader();
  }
}

function setZoomPoint(delta) {
  const points = resolvedZoomPoints(currentPage());
  const nextIndex = state.zoomIndex + delta;

  if (nextIndex >= 0 && nextIndex < points.length) {
    state.zoomIndex = nextIndex;
    state.overlayOpen = false;
    if (!applyCurrentZoomFrame()) {
      renderReader();
    }
    return;
  }

  if (delta > 0 && state.pageIndex < state.pages.length - 1) {
    state.pageIndex += 1;
    state.zoomIndex = 0;
    state.overlayOpen = false;
    renderReader();
    return;
  }

  if (delta < 0 && state.pageIndex > 0) {
    state.pageIndex -= 1;
    state.zoomIndex = Math.max((resolvedZoomPoints(currentPage()).length || 1) - 1, 0);
    state.overlayOpen = false;
    renderReader();
  }
}

function toggleZoom() {
  state.zoomed = !state.zoomed;
  state.zoomIndex = 0;
  state.overlayOpen = false;
  renderReader();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.warn("Fullscreen request failed", error);
  }
}

function openOverlay() {
  state.overlayOpen = true;
  renderReader();
}

function closeOverlay() {
  state.overlayOpen = false;
  renderReader();
}

function handlePointerStart(event) {
  if (state.introOpen) {
    return;
  }

  state.pointerStart = {
    x: event.clientX,
    y: event.clientY,
  };
}

function handlePointerEnd(event) {
  if (state.introOpen) {
    return;
  }

  if (!state.pointerStart) {
    return;
  }

  const dx = event.clientX - state.pointerStart.x;
  const dy = event.clientY - state.pointerStart.y;
  state.pointerStart = null;

  if (dx < -35 && dy < -35) {
    openOverlay();
    return;
  }

  if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) {
    setPage(dx < 0 ? 1 : -1);
  }
}

function createReaderImage(page) {
  const frame = document.createElement("div");
  frame.className = "page-frame";
  const layout = computePageFrame(page);
  frame.style.width = `${layout.displayWidth}px`;
  frame.style.height = `${layout.displayHeight}px`;
  frame.style.transform = layout.transform;

  const img = document.createElement("img");
  img.className = "reader-page-image";
  img.src = page.imageUrl;
  img.alt = page.displayTitle || page.pageTitle || `${page.pageId} image`;
  img.width = page.width;
  img.height = page.height;
  img.draggable = false;

  frame.append(img);

  if (state.zoomed) {
    const spotlight = document.createElement("div");
    spotlight.className = "zoom-spotlight";
    spotlight.setAttribute("aria-hidden", "true");

    const shade = document.createElement("img");
    shade.className = "zoom-spotlight-image";
    shade.src = page.imageUrl;
    shade.alt = "";
    shade.width = page.width;
    shade.height = page.height;
    shade.draggable = false;

    const outline = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    outline.classList.add("zoom-focus-outline");
    outline.setAttribute("viewBox", "0 0 100 100");
    outline.setAttribute("preserveAspectRatio", "none");

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.classList.add("zoom-focus-polygon");
    outline.append(polygon);

    spotlight.append(shade, outline);
    updateZoomSpotlight(spotlight, page, currentZoomPoint());
    frame.append(spotlight);
  }

  return frame;
}

function createLessonButton(item, kind) {
  const button = createButton("lesson-chip", `${kind}: ${item.japanese || item.term}`, "");

  const title = document.createElement("span");
  title.className = "lesson-title";
  title.textContent = item.japanese || item.term;

  const reading = document.createElement("span");
  reading.className = "lesson-reading";
  reading.textContent = item.reading;

  const romaji = document.createElement("span");
  romaji.className = "lesson-romaji";
  romaji.textContent = item.romaji;

  const english = document.createElement("span");
  english.className = "lesson-english";
  english.textContent = item.english || item.meaning;

  const note = document.createElement("span");
  note.className = "lesson-note";
  note.textContent = item.note;

  button.append(title, reading, romaji, english, note);
  return button;
}

function createControlsIntro() {
  const overlay = document.createElement("aside");
  overlay.className = "controls-intro";
  overlay.setAttribute("aria-label", "Reader controls");

  const panel = document.createElement("div");
  panel.className = "controls-intro-panel";

  const title = document.createElement("h2");
  title.textContent = "Reading controls";

  const list = document.createElement("ul");
  for (const text of [
    "Swipe left or right, or use arrow keys, to turn pages.",
    "Swipe up-left to open Japanese help.",
    "Use zoom for guided close-ups. In zoom mode, left and right move through fitted reading frames.",
    "Use the bottom-right fullscreen button for a cleaner phone view.",
  ]) {
    const item = document.createElement("li");
    item.textContent = text;
    list.append(item);
  }

  const start = createButton("reader-action controls-start", "Start reading", "Start");
  start.addEventListener("click", markControlsIntroSeen);

  panel.append(title, list, start);
  overlay.append(panel);
  return overlay;
}

function createLearningOverlay(page) {
  const overlay = document.createElement("aside");
  overlay.className = "lesson-overlay";
  overlay.setAttribute("aria-label", "Japanese reading notes");

  const panel = document.createElement("div");
  panel.className = "lesson-panel";

  const close = createButton("reader-icon-button lesson-close", "Close notes", "x");
  close.addEventListener("click", closeOverlay);

  const sentences = document.createElement("div");
  sentences.className = "lesson-grid";
  for (const item of page.learning?.sentences || []) {
    sentences.append(createLessonButton(item, "Sentence"));
  }

  const vocabulary = document.createElement("div");
  vocabulary.className = "lesson-grid lesson-grid-vocab";
  for (const item of page.learning?.vocabulary || []) {
    vocabulary.append(createLessonButton(item, "Vocabulary"));
  }

  panel.append(close, sentences, vocabulary);
  overlay.append(panel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeOverlay();
    }
  });
  return overlay;
}

function renderReader() {
  const page = currentPage();
  document.body.dataset.view = "reader";
  libraryRoot.className = "library is-reader";

  const reader = document.createElement("section");
  reader.className = `reader${state.zoomed ? " is-zoomed" : ""}`;
  reader.setAttribute("aria-label", `${state.activeBook.title} reader`);

  const topBar = document.createElement("div");
  topBar.className = "reader-topbar";

  const back = createButton("reader-icon-button", "Back to books", "<");
  back.addEventListener("click", renderLibrary);

  topBar.append(back);

  const stage = document.createElement("div");
  stage.className = "reader-stage";
  stage.addEventListener("pointerdown", handlePointerStart);
  stage.addEventListener("pointerup", handlePointerEnd);
  stage.append(createReaderImage(page));

  const controls = document.createElement("div");
  controls.className = "reader-controls";

  const zoom = createButton("reader-action reader-zoom", state.zoomed ? "Zoom out" : "Zoom in", state.zoomed ? "-" : "+");
  zoom.addEventListener("click", toggleZoom);

  const fullscreen = createButton("reader-action reader-fullscreen", "Toggle fullscreen", "[]");
  fullscreen.addEventListener("click", toggleFullscreen);

  controls.append(zoom, fullscreen);
  reader.append(topBar, stage, controls);

  if (state.overlayOpen) {
    reader.append(createLearningOverlay(page));
  }

  if (state.introOpen) {
    reader.append(createControlsIntro());
  }

  libraryRoot.replaceChildren(reader);
  preloadReaderNeighbors();
}

document.addEventListener("keydown", (event) => {
  if (state.view !== "reader") {
    return;
  }

  if (state.introOpen) {
    if (event.key === "Escape" || event.key === "Enter") {
      markControlsIntroSeen();
    }
    return;
  }

  if (event.key === "Escape" && state.overlayOpen) {
    closeOverlay();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    setPage(1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setPage(-1);
  }

  if (event.key.toLowerCase() === "z") {
    toggleZoom();
  }

  if (event.key.toLowerCase() === "i") {
    openOverlay();
  }
});

window.addEventListener("resize", () => {
  if (state.view === "reader" && state.zoomed) {
    renderReader();
  }
});

document.addEventListener("fullscreenchange", () => {
  if (state.view === "reader" && state.zoomed) {
    renderReader();
  }
});

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

renderLibrary();
