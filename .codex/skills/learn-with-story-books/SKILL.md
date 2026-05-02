---
name: learn-with-story-books
description: Maintain the LearnWithStory static book workflow. Use when Codex needs to add or update a book, cover, page, chapter label, universe lore folder, story outline, or book-generation data in this repository.
---

# Learn With Story Books

## Overview

Use this skill to keep LearnWithStory books consistent across the static UI, asset folders, and hidden generation data. The public UI is intentionally minimal: one centered list of book covers, each with the label `{laneName} - CHAPTER {chapterNumber} - {chapterName}`.

## Project Shape

Book folders live at:

```text
assets/{laneId}/{bookId}/
  covers/
  pages/
    page-001/
      metadata.json
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
}
```

Do not reintroduce lane rails or lane headings unless the user explicitly asks. The visible label is generated from `laneName`, `chapterNumber`, and `chapterName`.

## Add A Book

1. Choose kebab-case `laneId` and `bookId`.
2. Create `covers/`, `pages/page-001/`, `universe/characters/`, `universe/places/`, `universe/monsters/`, and `story/`.
3. Add cover assets using the established filenames when possible: `cover-original.png`, `cover-480`, `cover-720`, `cover-960`, and `cover-1086` in `.jpg` and `.webp`.
4. Create `pages/page-001/metadata.json` with `laneId`, `laneName`, `bookId`, `pageId`, `chapterNumber`, `chapterName`, `chapter`, `image`, and `metadata`.
5. Add one entry to `app.js` so the book appears in the single cover list.
6. If the new book becomes the first visible book, update the preload image in `index.html`.

## Add A Page

1. Find the next page number under `pages/` and create `page-XXX/`.
2. Add `metadata.json` with the same schema as existing pages.
3. Put generated page images or page-specific assets in that page folder.
4. Only update `app.js` if the visible chapter label should change to this page or chapter.

## Add Universe Or Story Data

Use focused Markdown or JSON files. Prefer one file per character, place, monster, concept, or story outline section so future generation can load only the relevant material. Keep names kebab-case and descriptive.

## Verification

Validate JSON before finishing. For UI changes, open or serve `index.html` and confirm only the cover list and centered labels are visible.
