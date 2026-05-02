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
  },
];

const libraryRoot = document.querySelector("[data-library]");

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

function createBookCard(book, isFirstBook) {
  const card = document.createElement("li");
  card.className = "book-card";
  card.dataset.bookId = book.id;
  card.style.setProperty("--book-accent", book.accent);

  const cover = document.createElement("span");
  cover.className = "cover-shell";
  cover.append(createCoverPicture(book, isFirstBook ? "eager" : "lazy"));

  const chapter = document.createElement("span");
  chapter.className = "book-label";
  chapter.textContent = bookLabel(book);

  card.append(cover, chapter);
  return card;
}

function renderLibrary() {
  const fragment = document.createDocumentFragment();
  const list = document.createElement("ul");
  list.className = "book-list";
  list.setAttribute("aria-label", "Book covers");

  books.forEach((book, index) => list.append(createBookCard(book, index === 0)));
  fragment.append(list);
  libraryRoot.replaceChildren(fragment);
}

renderLibrary();
