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
        "x": 0.5,
        "y": 0.5,
        "scale": 2.3
      }
    ]
  },
  "metadata": {}
}
```

Use normalized `x` and `y` values from `0` to `1`, where `(0, 0)` is the top-left of the image and `(1, 1)` is the bottom-right. Choose zoom points by reading the page and centering each important speech bubble, menu, panel, or action beat in a sensible reading order. Use a `scale` that makes Japanese text readable on a phone without forcing manual pinch zoom. Include romaji for both sentence and vocabulary entries.

## Add A Book

1. Choose kebab-case `laneId` and `bookId`.
2. Create `covers/`, `pages/page-001/`, `universe/characters/`, `universe/places/`, `universe/monsters/`, and `story/`.
3. Add cover assets using the established filenames when possible: `cover-original.png`, `cover-480`, `cover-720`, `cover-960`, and `cover-1086` in `.jpg` and `.webp`.
4. Create `pages/page-001/metadata.json` with image dimensions, learning notes, and guided zoom points.
5. Add one entry to `app.js` so the book appears in the single cover list.
6. If the new book becomes the first visible book, update the preload image in `index.html`.

## Add A Page

1. Find the next page number under `pages/` and create `page-XXX/`.
2. Rename the supplied page image to `page-XXX-short-description.ext`, place it in that folder, and record its exact width and height.
3. Read the Japanese text in the image. Add sentence explanations for English speakers learning Japanese, including `japanese`, `reading`, `romaji`, `english`, and a compact `note`.
4. Add vocabulary entries for the main words, phrases, signs, menu items, and sound effects learners should notice. Include `term`, `reading`, `romaji`, `meaning`, and `note`.
5. Choose guided zoom points in reading order. Include a clear `label`, normalized `x`, normalized `y`, and page-specific `scale`.
6. Add the metadata path to the book's `pages` array in `app.js`.
7. Only update the library chapter label if the visible cover should represent a different chapter.

## Reader Behavior

Preserve these interactions when modifying the app:

1. Selecting a book with registered pages opens the reader.
2. The first time a book opens on a device, show a small one-time controls intro. Store the completed state in `localStorage` by book id.
3. Normal horizontal swipes and keyboard left/right arrows move between pages.
4. A diagonal up-left swipe opens the learning overlay.
5. The learning overlay displays semi-transparent buttons built from `learning.sentences` and `learning.vocabulary`, including kana reading, romaji, English, and a short note.
6. The fullscreen button stays at the bottom-right of the reader.
7. Keep persistent reader UI minimal. Do not show a page number counter unless the user asks for it.
8. The zoom button toggles guided zoom mode. In guided zoom mode, horizontal swipes and keyboard left/right arrows move between `zoom.points`. When the reader passes the final zoom point, continue to zoom point 1 of the next page. When moving backward before the first zoom point, continue to the final zoom point of the previous page.

## Add Universe Or Story Data

Use focused Markdown or JSON files. Prefer one file per character, place, monster, concept, or story outline section so future generation can load only the relevant material. Keep names kebab-case and descriptive.

## Verification

Validate JSON before finishing. Run `node --check app.js` after app changes. For UI changes, serve `index.html` and confirm the cover list, reader, page navigation, fullscreen button, learning overlay, and guided zoom behavior.
