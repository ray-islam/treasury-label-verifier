# TTB Label Verifier — AI-Powered Alcohol Label Compliance Tool

A standalone proof-of-concept web application that helps TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance agents verify key alcohol beverage label fields against application data using OCR and simple field comparison.

## Live Demo

https://treasury-label-verifier-three.vercel.app

## Overview

TTB agents review approximately 150,000 label applications per year. A significant portion of review time is spent on routine field matching — verifying that what appears on a label matches what is in the application. This prototype automates that matching step using OCR, so agents can focus on judgment-based review instead of manual data checks.

### Core Workflow

1. Agent uploads a label image.
2. Agent enters application data fields (brand name, class/type, alcohol content, net contents, government warning).
3. The app extracts text from the label image using OCR.
4. The tool compares extracted values against application data.
5. Results are displayed with clear status indicators per field:
   - **Match**
   - **Possible match**
   - **Needs review**
   - **Mismatch**
6. An overall status banner summarizes whether issues were found during verification.

## Features

- Label image upload with preview.
- AI-powered OCR using **Tesseract.js** (runs entirely in the browser, no external API calls).
- Field-by-field verification for:
  - Brand name  
  - Class / Type  
  - Alcohol content  
  - Net contents  
  - Government warning
- Simple fuzzy matching: case-insensitive comparison with normalization and substring checks, to tolerate minor formatting differences (e.g., `ON YOUR SIX` vs `ON YOUR SIX BOURBON WHISKEY`).
- Per-field statuses plus an overall status banner (success / warning / error).
- Fast, fully client-side prototype — no backend or data persistence.

## Tech Stack

- Frontend: React + Vite
- OCR Engine: [Tesseract.js](https://github.com/naptha/tesseract.js) (WebAssembly, in-browser)
- Styling: Plain CSS (`index.css`)
- Deployment: Vercel

## Setup and Run

### Prerequisites

- Node.js (LTS)
- npm

### Install

```bash
git clone https://github.com/ray-islam/treasury-label-verifier.git
cd treasury-label-verifier
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL printed in the terminal (usually http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## Approach and Key Decisions

**Client-side OCR with Tesseract.js**  
Tesseract.js was chosen over cloud OCR APIs because:

- The instructions note that Treasury networks can block outbound calls to external ML endpoints, which can break cloud-based solutions.
- For a prototype, keeping all processing in the browser ensures no label data leaves the user’s machine.

**Field comparison and fuzzy matching**  
For each field, the app:

- Normalizes values (Unicode normalization, uppercasing, stripping punctuation, collapsing whitespace).
- Treats exact normalized equality as **Match**.
- Treats “one string contains the other” as **Possible match** (e.g., `ON YOUR SIX` vs `ON YOUR SIX BOURBON WHISKEY`).
- If OCR does not confidently detect a field or the extracted value looks obviously noisy (very short or garbled), the app surfaces **Needs review** instead of a hard **Mismatch**, prompting human oversight.
- Otherwise, the field is marked **Mismatch**.

This mirrors how agents described their work: the tool highlights likely issues but does not replace human judgment.

**Government warning handling**  
The prototype:

- Detects the `GOVERNMENT WARNING` section in the OCR text and extracts a fixed-length snippet for review.
- Surfaces whether a warning was found and allows side-by-side comparison with the expected text.

A production system would need to enforce the exact wording and formatting required by TTB regulations (e.g., the standard health warning text and `GOVERNMENT WARNING:` in all caps).[web:648]

**No backend / no storage**  
The app is a fully stateless frontend prototype:

- No data is stored or transmitted to a server.
- There is no integration with COLA or any other internal Treasury systems, consistent with the instructions that this is a standalone proof-of-concept.

## Assumptions and Limitations

- **OCR accuracy**: Works best on clear, straight-on label images. Angled, low-resolution, or glare-heavy images may produce noisy text.
- **Brand and class/type extraction**: Relies on simple heuristics (line-based filtering and keyword lists). More advanced layout/ML techniques could improve accuracy.
- **Government warning validation**: Prototype focuses on detection and basic comparison. It does not yet enforce every formatting and typographical requirement from the CFR.[web:648]
- **English labels only**: The prototype assumes English-language labels.
- **No batch processing**: Labels are processed one at a time in this version.
- **No authentication**: A production deployment would need appropriate authentication/authorization and logging per federal standards.

## Future Improvements

- More robust brand and class/type extraction (e.g., ML-based key-field detection).
- Improved handling of rotated/angled images and glare.
- Batch upload and queue-based processing for large importer submissions.
- Export verification results as CSV or PDF for audit trails.
- Deeper, rule-based government warning validation against the exact regulatory text.
- Accessibility review and improvements toward WCAG 2.1 AA compliance.

## Author

Dr. Ray Islam  
https://github.com/ray-islam
