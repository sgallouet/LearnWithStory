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
    id: "nodeheart-luminus",
    laneId: "nodeheart-series",
    laneName: "Nodeheart Series",
    title: "NODEHEART LUMINUS",
    chapterNumber: "01",
    chapterName: "The Shark King",
    accent: "#61c7d8",
    coverBase: "assets/nodeheart-series/nodeheart-luminus/covers",
    pages: [],
  },
];

const libraryRoot = document.querySelector("[data-library]");
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

function coverSources(book) {
  return {
    webp: [
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
}

function createCoverPicture(book, loading) {
  const sources = coverSources(book);
  const picture = document.createElement("picture");
  const webp = document.createElement("source");
  const jpg = document.createElement("source");
  const img = document.createElement("img");

  webp.type = "image/webp";
  webp.srcset = sources.webp;
  webp.sizes = "(max-width: 760px) 84vw, 430px";

  jpg.type = "image/jpeg";
  jpg.srcset = sources.jpg;
  jpg.sizes = webp.sizes;

  img.src = sources.fallback;
  img.alt = `${book.title} cover`;
  img.width = 1086;
  img.height = 1448;
  img.loading = loading;
  img.decoding = "async";
  img.fetchPriority = loading === "eager" ? "high" : "auto";

  picture.append(webp, jpg, img);
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
  fragment.append(list);
  libraryRoot.replaceChildren(fragment);
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
    const pages = await Promise.all(
      book.pages.map(async (metadataPath) => {
        const metadataUrl = new URL(metadataPath, window.location.href);
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          throw new Error(`Could not load ${metadataPath}`);
        }
        const page = await response.json();
        return {
          ...page,
          metadataPath,
          imageUrl: new URL(page.image, metadataUrl).toString(),
        };
      }),
    );

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
  const points = currentPage().zoom?.points || [];
  return points[state.zoomIndex] || points[0] || { x: 0.5, y: 0.5, scale: 2.2 };
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
  const points = currentPage().zoom?.points || [];
  const nextIndex = state.zoomIndex + delta;

  if (nextIndex >= 0 && nextIndex < points.length) {
    state.zoomIndex = nextIndex;
    renderReader();
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
    state.zoomIndex = Math.max((currentPage().zoom?.points?.length || 1) - 1, 0);
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
  const viewportWidth = window.visualViewport?.width || window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const imageRatio = page.width / page.height;
  let displayWidth = viewportWidth;
  let displayHeight = displayWidth / imageRatio;

  if (displayHeight > viewportHeight) {
    displayHeight = viewportHeight;
    displayWidth = displayHeight * imageRatio;
  }

  frame.style.width = `${displayWidth}px`;
  frame.style.height = `${displayHeight}px`;

  const img = document.createElement("img");
  img.className = "reader-page-image";
  img.src = page.imageUrl;
  img.alt = page.displayTitle || page.pageTitle || `${page.pageId} image`;
  img.width = page.width;
  img.height = page.height;
  img.draggable = false;

  if (state.zoomed) {
    const point = currentZoomPoint();
    const scale = point.scale || 2.2;
    const baseLeft = (viewportWidth - displayWidth) / 2;
    const baseTop = (viewportHeight - displayHeight) / 2;
    const translateX = viewportWidth / 2 - baseLeft - point.x * displayWidth * scale;
    const translateY = viewportHeight / 2 - baseTop - point.y * displayHeight * scale;
    frame.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
  }

  frame.append(img);
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
    "Use zoom for guided close-ups. In zoom mode, left and right move through focus points.",
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

  const previous = createButton("reader-nav reader-nav-left", state.zoomed ? "Previous zoom point" : "Previous page", "<");
  previous.disabled = state.zoomed
    ? state.pageIndex === 0 && state.zoomIndex === 0
    : state.pageIndex === 0;
  previous.addEventListener("click", () => setPage(-1));

  const next = createButton("reader-nav reader-nav-right", state.zoomed ? "Next zoom point" : "Next page", ">");
  const pointCount = currentPage().zoom?.points?.length || 1;
  next.disabled = state.zoomed
    ? state.pageIndex >= state.pages.length - 1 && state.zoomIndex >= pointCount - 1
    : state.pageIndex >= state.pages.length - 1;
  next.addEventListener("click", () => setPage(1));

  const controls = document.createElement("div");
  controls.className = "reader-controls";

  const zoom = createButton("reader-action reader-zoom", state.zoomed ? "Zoom out" : "Zoom in", state.zoomed ? "-" : "+");
  zoom.addEventListener("click", toggleZoom);

  const fullscreen = createButton("reader-action reader-fullscreen", "Toggle fullscreen", "[]");
  fullscreen.addEventListener("click", toggleFullscreen);

  controls.append(zoom, fullscreen);
  reader.append(topBar, stage, previous, next, controls);

  if (state.overlayOpen) {
    reader.append(createLearningOverlay(page));
  }

  if (state.introOpen) {
    reader.append(createControlsIntro());
  }

  libraryRoot.replaceChildren(reader);
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

renderLibrary();
