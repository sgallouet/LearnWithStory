const lanes = [
  {
    id: "contextual-situation",
    title: "Contextual Situation",
    books: [
      {
        id: "ramen-quest",
        title: "RAMEN QUEST",
        chapter: "Chapter 1: The First Bowl",
        accent: "#e2ad54",
        coverBase: "assets/contextual-situation/ramen-quest/covers",
      },
    ],
  },
  {
    id: "nodeheart-series",
    title: "Nodeheart Series",
    books: [
      {
        id: "nodeheart-luminus",
        title: "NODEHEART LUMINUS",
        chapter: "Chapter 1: The Shark King",
        accent: "#61c7d8",
        coverBase: "assets/nodeheart-series/nodeheart-luminus/covers",
      },
    ],
  },
];

const railRoot = document.querySelector("[data-rails]");

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
  webp.sizes = "(max-width: 700px) 82vw, (max-width: 1100px) 44vw, 460px";

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

function createBookCard(book, isFirstBook) {
  const card = document.createElement("button");
  card.className = "book-card";
  card.type = "button";
  card.dataset.bookId = book.id;
  card.style.setProperty("--book-accent", book.accent);
  card.setAttribute("aria-label", `${book.title}, ${book.chapter}`);
  card.setAttribute("aria-pressed", String(isFirstBook));

  const cover = document.createElement("span");
  cover.className = "cover-shell";
  cover.append(createCoverPicture(book, isFirstBook ? "eager" : "lazy"));

  const chapter = document.createElement("span");
  chapter.className = "book-chapter";
  chapter.textContent = book.chapter;

  card.append(cover, chapter);
  card.addEventListener("click", () => selectBook(card));
  return card;
}

function createRail(lane, laneIndex) {
  const section = document.createElement("section");
  section.className = "rail";
  section.setAttribute("aria-labelledby", `${lane.id}-title`);

  const title = document.createElement("h2");
  title.className = "rail-title";
  title.id = `${lane.id}-title`;
  title.textContent = lane.title;

  const track = document.createElement("div");
  track.className = "rail-track";
  track.setAttribute("aria-label", lane.title);
  track.setAttribute("tabindex", "0");

  lane.books.forEach((book, bookIndex) => {
    track.append(createBookCard(book, laneIndex === 0 && bookIndex === 0));
  });

  section.append(title, track);
  return section;
}

function selectBook(selectedCard) {
  document.querySelectorAll(".book-card").forEach((card) => {
    card.setAttribute("aria-pressed", String(card === selectedCard));
  });
}

function renderLibrary() {
  const fragment = document.createDocumentFragment();
  lanes.forEach((lane, index) => fragment.append(createRail(lane, index)));
  railRoot.replaceChildren(fragment);
}

renderLibrary();
