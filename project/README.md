# Medical Document Library (demo)

This is a **working, tested demo** of the document-library system, seeded
with 3 example documents (2 real PPT/PPTX files, 1 real PDF) so you can see
it work before merging it into your `multi-deck-reader` project.

## Try it right now

```bash
npm install
npm start
```

Then open **http://localhost:3000** — you'll see two topics ("Nephrology"
with 2 documents, "Sepsis" with 1), each rendered as a card. Click any card
to open the original file.

## Add another document

```bash
npm run add-doc
```

Answer the 4 prompts (file path, title, description, category) and refresh
the browser tab. No file in this project needs to change for that new card
to appear — see `js/library.js` for why.

## Merging into your real `multi-deck-reader` project

See the chat response for the full step-by-step merge instructions. Short
version:

1. Copy `data/`, `documents/`, `js/library.js`, `css/library.css`,
   `scripts/add-document.js`, and `server.js` into your project.
2. Add `"express": "^4.19.2"` to your `package.json` dependencies (or run
   `npm install express --save` inside your project) and add the `start` /
   `add-doc` scripts shown in the chat response.
3. Back up your current `index.html`, then replace it with the one in this
   folder (or merge the `<div id="library"></div>` + script tag into your
   existing markup/branding).
4. Delete the demo `data/documents.json` entries (or keep them as an
   example) and run `npm run add-doc` for each of your real topics.
5. Your existing `aecopd.html`, `sepsis.html`, `shock.html`, etc. files are
   untouched — you can leave them, or eventually retire them once their
   content is registered as documents in the new system.
