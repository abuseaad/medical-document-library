# Medical Document Library

A lightweight medical reference library for storing, browsing, previewing, and downloading clinical and educational materials such as PDFs and presentation decks. The project is designed for quick local use, after deployed for public and supports a clean category-based document experience for studying and review.

## Overview

This application provides a simple library interface for organizing medical documents by topic or specialty area. It is especially useful for:

- medical education resources
- case-based learning materials
- departmental study folders
- quick reference document access
- local archive management without a database backend

The project reads document metadata from a JSON file and presents it as searchable cards that can be opened directly or downloaded as needed.

## Features

- Document cards grouped by category or topic
- Search by title, description, or keyword
- Support for PDF, PPT, and PPTX files
- Browser-based preview for supported files
- Direct download of original source files
- Simple status tracking for each document
- No database required; metadata is stored in JSON
- Easy addition of new documents using a guided CLI command

## Supported file types

- PDF
- PPT
- PPTX

## Requirements

Before running the app, make sure you have:

- Node.js installed
- npm installed
- LibreOffice (optional, but recommended for generating readable previews of PowerPoint files)

If LibreOffice is not installed, the app will still work, but PowerPoint files may open as downloads instead of in-browser previews.

## Quick start

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

Then open the local app in your browser:

```text
http://localhost:5173
```

## Project structure

```text
medical-document-library/
├── public/
│   ├── data/
│   ├── documents/
│   └── ...
├── src/
│   ├── components/
│   ├── styles/
│   ├── utils/
│   └── App.jsx
├── scripts/
│   └── add-document.js
├── package.json
├── server.js
├── vite.config.js
└── README.md
```

## Adding a document

Use the built-in script to add a new medical document to the library:

```bash
npm run add-doc
```

The script will prompt you for:

- the full file path
- title
- description
- category/topic

The original file is copied into the project document folder, and a new entry is added to the library metadata file. No source code changes are needed for each new document entry.

## How the library works

The app stores document metadata in a JSON file under the public data directory. Each record includes the document title, category, description, file type, and storage path. The UI reads that metadata, groups documents by category, and renders each item as a card with a preview or download action.

For presentations, the project can create a PDF preview using LibreOffice headless conversion when available. This allows the document to be opened in-browser without altering the original source file.

## Development commands

Run in development mode:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Notes

- This project is intended for local or internal use.
- Document storage is file-based rather than database-driven.
- The interface is intentionally simple and easy to adapt for medical education, departments, or study collections.

## Recommended use

This library is suitable for:

- internal clinical study repositories
- educational document collections
- specialty review folders
- local access to lecture presentations and reference PDFs

If you are integrating this into a larger application, the current structure makes it relatively easy to extend with additional metadata, filtering, tagging, user roles, or remote document storage.
