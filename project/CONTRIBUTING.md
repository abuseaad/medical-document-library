# Contributing to Medical Document Library

Thank you for your interest in contributing to the Medical Document Library project. This project is designed to help organize, preview, and access medical study documents in a simple and maintainable way. Contributions are welcome from developers, content contributors, researchers, and anyone improving the project for medical education and document management.

This guide explains the expected contribution workflow so contributors can collaborate in a clear and consistent way.

## 1. Before you begin

Please read the main project documentation first:

- [README.md](./README.md)

Make sure you understand:

- the project's purpose
- supported file types (PDF, PPT, PPTX)
- the local setup steps
- how documents are stored and displayed

If you are contributing code, please also check the existing project structure and scripts before creating new files or changing functionality.

## 2. Set up your local environment

Follow these steps on your machine:

1. Clone the repository.

```bash
git clone <repository-url>
cd medical-document-library
```

2. Install project dependencies.

```bash
npm install
```

3. Start the app locally.

```bash
npm start
```

4. Open the app in your browser:

```text
http://localhost:5173
```

If you plan to work on PowerPoint preview behavior or document import flows, ensure that LibreOffice is available when possible for preview generation.

## 3. Create a working branch

Always create a dedicated branch before making changes.

Use a branch name that clearly describes the task, for example:

```bash
git checkout -b feature/add-search-filter
```

Recommended branch naming patterns:

- `feature/...` for new functionality
- `fix/...` for bug fixes
- `docs/...` for documentation updates
- `chore/...` for maintenance work
- `data/...` for document or content additions

## 4. Understand the project structure

The project is organized as follows:

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
├── README.md
├── CONTRIBUTING.md
└── ...
```

Before editing code, identify which area you are changing:

- UI and layout changes live under `src/`
- document metadata storage logic is usually under `public/data/`
- document import behavior is managed in `scripts/add-document.js`
- build and development commands are defined in `package.json`

## 5. Choose the type of contribution

Contributors may help in the following ways:

### A. Code contributions

Examples include:

- improving the document grid or card layout
- adding filters or search enhancements
- improving preview behavior
- fixing file handling issues
- adding accessibility improvements
- improving responsiveness for mobile and desktop

### B. Documentation contributions

Examples include:

- improving setup instructions
- clarifying the project purpose
- adding examples for contributors
- improving run instructions and troubleshooting notes

### C. Medical content contributions

Examples include:

- adding educational document entries
- organizing categories or topics
- improving metadata quality for existing records
- adding new topics for study collections

If you add or update medical documents, do not modify the source file content in ways that distort the original material. Preserve the file as originally provided.

## 6. Follow the contribution workflow step by step

### Step 1: Identify an issue or improvement

Before editing, decide what you want to improve.

Possible starting points:

- open an issue in the repository
- propose a feature idea
- fix a local bug
- improve documentation
- add a missing document category

If you are unsure, open a discussion or issue first so the change is aligned with the project's direction.

### Step 2: Keep the change focused

Only make changes related to the task.

Avoid mixing:

- documentation updates with unrelated code changes
- feature work with formatting-only cleanup
- multiple unrelated bug fixes in a single PR

A clean, focused pull request is easier to review and safer to merge.

### Step 3: Make the change

After creating your branch:

1. edit the relevant files
2. keep code readable and consistent
3. do not introduce unnecessary dependencies
4. preserve the current app behavior unless the change explicitly alters it

When working with document data, be careful to preserve valid JSON structure and consistent metadata entries.

### Step 4: Test locally

Run the relevant checks before submitting your work.

```bash
npm install
npm run build
```

If your change affects app behavior, also run the local app and verify the UI manually in the browser.

```bash
npm start
```

For document entries, also validate that:

- the file path is correct
- the metadata is valid
- the document appears in the library
- the file opens or downloads as expected

## 7. Adding or updating documents

If you are contributing document data, use the project's add-document workflow:

```bash
npm run add-doc
```

The script will ask for:

- a file path
- document title
- document description
- category/topic

The imported file is copied into the document storage area and the corresponding metadata is added to the library data file.

When contributing document entries:

- use clear, accurate titles
- write concise but useful descriptions
- group documents under meaningful categories
- avoid duplicate entries
- use valid file types only

## 8. Code quality expectations

Please follow these general expectations:

- keep code easy to read
- use clear naming for functions and variables
- avoid unnecessary complexity
- keep documentation and comments focused on important logic
- prefer small, testable changes
- do not commit unrelated files or generated artifacts unless required

## 9. Commit message guidance

Use simple, descriptive commit messages.

Good examples:

```bash
git commit -m "Add search filter for document categories"
git commit -m "Fix PowerPoint preview generation fallback"
git commit -m "Improve README contributor setup instructions"
```

Avoid vague messages like:

```bash
git commit -m "Update stuff"
```

## 10. Submit a pull request

When your work is ready, follow this process:

1. Check that your branch is clean and contains only intended changes.
2. Review your diff carefully.
3. Push your branch.

```bash
git push origin <your-branch-name>
```

4. Open a pull request in the repository.
5. Provide a clear title and description.

Your PR description should include:

- what changed
- why it was needed
- which files were updated
- how it was validated
- any follow-up work if relevant

Example:

```text
## Summary
Adds a category filter to the document library and improves the card layout for mobile devices.

## Changes
- added filtering logic in the app
- updated card layout styling
- improved responsive behavior for smaller screens

## Validation
- ran npm run build
- started app locally
- checked the library UI in browser
```

## 11. Review process

Project maintainers may review your contribution and suggest changes. Please be open to feedback and make improvements when needed.

Common review items include:

- clarity of the change
- relevance to the project goals
- code consistency
- documentation updates
- correctness of document metadata or file handling

## 12. Contribution etiquette

Please be respectful and collaborative.

- be constructive in feedback
- avoid destructive or unrelated changes
- respect existing patterns and structure
- keep discussions focused on the task at hand
- be patient if maintainers request updates

## 13. What to do if you are stuck

If you are unsure how to proceed:

- read the README and code carefully
- check existing scripts and patterns
- open an issue with a clear description
- ask for help before making large or risky changes

## 14. Thank you

Contributions help improve the project for medical learning, document access, and institutional knowledge sharing. Every improvement—whether documentation, UI work, bug fixes, or content organization—makes the library more useful.

Thank you for helping maintain and grow the Medical Document Library.
