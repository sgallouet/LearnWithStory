# Japanese Book Library

A lightweight static book-cover app for Japanese learning stories.

Asset layout:

```text
assets/
  contextual-situation/
    ramen-quest/
      covers/
      pages/
        page-001/
          metadata.json
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

The UI only shows the cover list and centered label. `universe/` and `story/`
are hidden project data used by the book-generation workflow.

Open `index.html` directly, or serve the folder with `python -m http.server`.
