# Japanese Book Library

A lightweight static book-cover and reader app for Japanese learning stories.

Asset layout:

```text
assets/
  contextual-situation/
    ramen-quest/
      covers/
      pages/
        page-001/
          metadata.json
          page-001-ramen-shop-discovery.png
        page-002/
          metadata.json
          page-002-ordering-tonkotsu.png
        page-003/
          metadata.json
          page-003-choosing-toppings.png
        page-004/
          metadata.json
          page-004-paying-and-farewell.png
      universe/
        characters/
        places/
        monsters/
      story/
  nodeheart-series/
    nodeheart-luminus/
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

The UI starts with the cover list and centered label. Selecting Ramen Quest opens
the reader with page swipes, keyboard arrows, fullscreen, a learning overlay, and
guided zoom points. The first reader launch shows a one-time control intro, and
the learning overlay includes kana readings, romaji, English, and short notes.
`universe/` and `story/` are hidden project data used by the book-generation
workflow.

Open `index.html` directly, or serve the folder with `python -m http.server`.
