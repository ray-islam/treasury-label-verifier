# TTB Label Verifier — AI-Powered Alcohol Label Compliance Tool

A standalone proof-of-concept web application that helps TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance agents verify alcohol beverage labels against application data using AI-powered OCR and field extraction.

## Live Demo

[Deployed App URL] — update after deployment

## Overview

TTB agents review approximately 150,000 label applications per year. A significant portion of review time is spent on routine field matching — verifying that what appears on a label matches what is in the application. This tool automates that matching step using AI image analysis, so agents can focus on judgment-based review.

### Core Workflow

1. Agent uploads a label image
2. Agent enters application data fields (brand name, ABV, class/type, etc.)
3. AI extracts text from the label image
4. Tool compares extracted values against application data
5. Results displayed with clear PASS / FLAG indicators per field
6. Fuzzy matching handles minor formatting differences

## Features

- Label image upload with drag-and-drop support
- AI-powered OCR using Tesseract.js (runs entirely in-browser, no external API calls)
- Field-by-field verification: brand name, ABV, class/type, net contents, government warning
- Government warning checker — validates exact wording and mandatory ALL CAPS requirement
- Fuzzy matching — tolerates capitalization and minor formatting differences
- Batch upload support for processing multiple labels
- Target response time under 5 seconds per label

## Tech Stack

- Frontend: React 19, Vite 8
- OCR Engine: Tesseract.js 7 (in-browser WebAssembly)
- Styling: CSS Modules
- Linting: ESLint 10
- Deployment: Vercel

## Setup and Run

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Install
git clone https://github.com/ray-islam/treasury-label-verifier.git
cd treasury-label-verifier
npm install

### Run locally
npm run dev

Open http://localhost:5173 in your browser.

### Build for production
npm run build
npm run preview

### Lint
npm run lint

## Approach and Key Decisions

**Tesseract.js (in-browser OCR)** was chosen over cloud APIs because TTB's network blocks outbound traffic to many external ML endpoints, and no label data should leave the browser in a prototype context.

**Fuzzy matching** uses normalized string comparison with case-folding. This handles real-world scenarios like STONE'S THROW vs Stone's Throw — flagging it as a likely match rather than an automatic rejection, preserving agent judgment.

**Government warning validation** checks for the exact TTB-required text verbatim, including the mandatory GOVERNMENT WARNING: in all caps per 27 CFR Section 16.21.

**No backend, no storage** — fully stateless frontend prototype. No labels or application data are transmitted or stored anywhere.

## Assumptions and Limitations

- OCR accuracy: Tesseract works well on clean straight-on label photos. Angled or glare-affected images may require cloud OCR in production.
- Field extraction relies on keyword anchoring. Complex label layouts may need tuning.
- English-language labels only in this prototype.
- Not integrated with the COLA system — standalone prototype as specified.
- No authentication layer — production would require SSO or PIV card integration.

## Future Improvements

- Cloud OCR fallback for low-quality images
- Direct COLA system integration for automatic application data pull
- PDF label support
- Export verification results as CSV or PDF report
- Full WCAG 2.1 AA accessibility audit for federal deployment

## Author

Dr. Ray Islam
https://github.com/ray-islam