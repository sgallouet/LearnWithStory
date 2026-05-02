---
name: learn-with-story-books
description: Maintain the LearnWithStory static book workflow. Use when Codex needs to add or update a book, cover, reader page, guided zoom metadata, Japanese learning overlay metadata, chapter label, universe lore folder, story outline, or book-generation data in this repository.
---

# Learn With Story Books

## Overview

Use this skill to keep LearnWithStory books consistent across the static UI, reader interactions, asset folders, and hidden generation data. The public library starts as one centered list of book covers, each with the label `{laneName} - CHAPTER {chapterNumber} - {chapterName}`. Books with pages can open into a reader.

## Project Shape

Book folders live at:

```text
assets/{laneId}/{bookId}/
  covers/
  pages/
    page-001/
      metadata.json
      page-001-short-description.png
  universe/
    characters/
    places/
    monsters/
  story/
```

Keep `universe/` and `story/` out of the UI. They are private source material for generating the book: character notes, places, monsters, lore, plot summaries, outlines, and continuity notes.

## App Data

Update `app.js` when the visible book list changes. Each book entry must include:

```js
{
  id: "book-id",
  laneId: "lane-id",
  laneName: "Lane Name",
  title: "DISPLAY TITLE",
  chapterNumber: "01",
  chapterName: "Chapter Name",
  accent: "#hex",
  coverBase: "assets/lane-id/book-id/covers",
  pages: [
    "assets/lane-id/book-id/pages/page-001/metadata.json",
  ],
}
```

Do not reintroduce lane rails or lane headings unless the user explicitly asks. The visible library label is generated from `laneName`, `chapterNumber`, and `chapterName`. The reader loads page metadata through the `pages` array, so every new visible page must be registered there.

## Page Metadata

Each `pages/page-XXX/metadata.json` must describe both the image and the reader intelligence:

```json
{
  "laneId": "lane-id",
  "laneName": "Lane Name",
  "bookId": "book-id",
  "pageId": "page-001",
  "pageNumber": 1,
  "pageTitle": "Short English Title",
  "displayTitle": "Page label from image",
  "chapterNumber": "01",
  "chapterName": "Chapter Name",
  "chapter": "Chapter 01: Chapter Name",
  "image": "page-001-short-description.png",
  "width": 936,
  "height": 1681,
  "learning": {
    "sentences": [
      {
        "japanese": "Japanese text from the page",
        "reading": "Learner-friendly kana reading",
        "romaji": "Learner-friendly romanization",
        "english": "Natural English meaning",
        "note": "Brief grammar or usage explanation"
      }
    ],
    "vocabulary": [
      {
        "term": "Word from the page",
        "reading": "Reading",
        "romaji": "Romanization",
        "meaning": "Meaning",
        "note": "Short learner note"
      }
    ]
  },
  "zoom": {
    "points": [
      {
        "label": "Focus label",
        "rect": {
          "x": 0.1,
          "y": 0.1,
          "w": 0.35,
          "h": 0.2
        },
        "scale": 2.3
      }
    ]
  },
  "metadata": {}
}
```

Use normalized `rect` values from `0` to `1`, where `(0, 0)` is the top-left of the image and `(1, 1)` is the bottom-right. Choose rectangles by reading the page and framing each important speech bubble, sign, menu, option label group, panel, or action beat in a sensible reading order. Do a coverage pass before finishing: every learner-relevant Japanese surface on the page should appear in the learning overlay and in at least one useful zoom point. For choice lists such as ramen flavors, toppings, or noodle firmness, include a dedicated focus frame for the labels/options before the character's selected response. Avoid redundant adjacent frames that show nearly the same content. The reader fits each rectangle into the viewport; small black margins are acceptable when an edge frame needs to stay centered. Use `scale` as the maximum zoom for that frame, never above `3`. Include romaji for both sentence and vocabulary entries.

## Add A Book

1. Choose kebab-case `laneId` and `bookId`.
2. Create `covers/`, `pages/page-001/`, `universe/characters/`, `universe/places/`, `universe/monsters/`, and `story/`.
3. Add cover assets using the established filenames when possible: `cover-original.png`, `cover-480`, `cover-720`, `cover-960`, and `cover-1086` in `.jpg` and `.webp`.
4. Create `pages/page-001/metadata.json` with image dimensions, learning notes, and guided zoom points.
5. Add one entry to `app.js` so the book appears in the single cover list.
6. If the new book becomes the first visible book, update the preload image in `index.html`.

## Add A Page

1. Build a source-to-target map before moving files. For each supplied image, decide the story order from the page content, then record the absolute source path, target `page-XXX/` folder, meaningful filename, title, and expected role in the story. Do not rely on download timestamps for story order.
2. Create all target page folders before copying images. Prefer a small Node script or native PowerShell `New-Item -Path ... -Force` plus `Copy-Item -LiteralPath ...`; avoid partial copy attempts where later page folders do not exist yet.
3. Rename each supplied page image to `page-XXX-short-description.ext`, place it in that folder, and record its exact width and height. For PNG files, a Node script can read width and height from bytes `16` and `20` without needing an image library.
4. For multi-page imports, prefer using Node to write `metadata.json` files as UTF-8. Japanese metadata can display as mojibake in Windows PowerShell if read with the wrong encoding; JSON validation should use Node `fs.readFileSync(file, "utf8")` or another explicit UTF-8 reader.
5. Read the Japanese text in the image. Add sentence explanations for English speakers learning Japanese, including `japanese`, `reading`, `romaji`, `english`, and a compact `note`.
6. Add vocabulary entries for the main words, phrases, signs, menu items, and sound effects learners should notice. Include `term`, `reading`, `romaji`, `meaning`, and `note`.
7. Choose guided zoom frames in reading order. Include a clear `label`, normalized `rect` with `x`, `y`, `w`, and `h`, and page-specific maximum `scale` no higher than `3`. Include menu/choice label groups as their own frames when the page uses them for learning context. Prefer fewer, well-framed regions over many overlapping frames.
8. Add the metadata path to the book's `pages` array in `app.js`.
9. Only update the library chapter label if the visible cover should represent a different chapter.

## Reader Behavior

Preserve these interactions when modifying the app:

1. Selecting a book with registered pages opens the reader.
2. The first time a book opens on a device, show a small one-time controls intro. Store the completed state in `localStorage` by book id.
3. Normal horizontal swipes and keyboard left/right arrows move between pages.
4. A diagonal up-left swipe opens the learning overlay.
5. The learning overlay displays semi-transparent buttons built from `learning.sentences` and `learning.vocabulary`, including kana reading, romaji, English, and a short note.
6. The fullscreen button stays at the bottom-right of the reader.
7. Keep persistent reader UI minimal. Do not show a page number counter unless the user asks for it.
8. Do not show persistent left/right arrow buttons in the reader. Navigation should stay gesture and keyboard driven after the tutorial.
9. The zoom button toggles guided zoom mode. In guided zoom mode, horizontal swipes and keyboard left/right arrows move between `zoom.points`. Each point fits a `rect` frame nicely in the viewport, with a quick animated movement between frames on the same page. When the reader passes the final zoom frame, continue to zoom frame 1 of the next page. When moving backward before the first zoom frame, continue to the final zoom frame of the previous page.
10. Preserve low-impact async preloading. The library should warm the first page metadata and image for each visible story, and the reader should warm the current, next, and previous page images without blocking rendering.

## Add Universe Or Story Data

Use focused Markdown or JSON files. Prefer one file per character, place, monster, concept, or story outline section so future generation can load only the relevant material. Keep names kebab-case and descriptive.

## Verification

Validate JSON before finishing. For Japanese metadata, prefer Node-based UTF-8 validation over PowerShell `ConvertFrom-Json` unless PowerShell is explicitly reading UTF-8. Check that every registered metadata path exists, every referenced image exists, image dimensions match metadata, every sentence has `japanese`, `reading`, `romaji`, `english`, and `note`, every vocabulary item has `term`, `reading`, `romaji`, `meaning`, and `note`, and every zoom `scale` is `<= 3`. Run `node --check app.js` after app changes. If the server is running, confirm `app.js`, at least one new metadata file, and at least one new page image return HTTP `200`. For UI changes, serve `index.html` and confirm the cover list, reader, page navigation, fullscreen button, learning overlay, and guided zoom behavior.
