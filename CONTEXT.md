# PraisePulse (TestimonialFlow) — System Context & Status

## 1. Executive Overview & Current App State

**PraisePulse** is a serverless, end-to-end testimonial collection, AI-enrichment, moderation, and display system built entirely on Google Workspace and Google Apps Script, powered by the Google Gemini API.

### Current Status
- **Core Implementation**: Fully functional across all 5 operational layers.
- **Runtime Environment**: Google Apps Script (V8 runtime), deployed as a Web App with query-parameter routing (`?page=form|admin|wall`).
- **Database**: Google Sheets (`Testimonials` sheet).
- **Media Asset Storage**: Google Drive folder for headshot images with public thumbnail view links.
- **AI Processing**: Google Gemini API (`gemini-2.5-flash`) for automated high-impact quote extraction and tag categorization.
- **Notifications**: Dual notification pipeline featuring Google Chat Webhooks (Cards V2) and direct email alerts (`MailApp`) to the administrator upon each submission.

---

## 2. Layer Breakdown & File Manifest

| File | Primary Role | Key Capabilities & Current State |
|---|---|---|
| [`Code.js`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/Code.js) | Backend Engine & API Layer | • `doGet(e)`: Routes traffic to `form.html`, `admin.html`, or `wall.html`.<br>• `submitTestimonial(data)`: Orchestrates headshot upload, Gemini extraction, Sheet row persistence, and notification dispatch.<br>• `callGeminiAPI(text)`: Prompts `gemini-2.5-flash` for JSON-structured quotes and tags.<br>• `uploadHeadshotToDrive(base64, name)`: Saves resized headshots to designated Drive folder.<br>• `sendAdminEmailNotification(data)`: Delivers formatted email summaries to the admin.<br>• `getTestimonials()`, `updateStatus()`, `updateGeminiData()`: Admin management APIs.<br>• `getApprovedTestimonials()`: Public read API with email scrubbing.<br>• `authorizeEmail()`: Utility to trigger Apps Script OAuth consent dialog. |
| [`form.html`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/form.html) | Public Submission Form | • Modern responsive UI (Tailwind CSS, Plus Jakarta Sans).<br>• Interactive 5-star rating with real-time sentiment status text.<br>• HTML5 `<canvas>` client-side image compression (max 400x400px, JPEG 0.8 quality).<br>• Character counter and privacy/consent checkboxes.<br>• Success modal displaying the instant AI-extracted quote preview. |
| [`admin.html`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/admin.html) | Moderation Dashboard | • Real-time KPI bento metrics (Total, Pending, Approved, Avg Rating).<br>• Search and filter bar (filter by rating, status, or search terms).<br>• One-click status toggling (`Approve`, `Reject`, `Pending`).<br>• Inline modal for manual editing of Gemini quote and tags.<br>• Submitter inspection modal with full unedited text. |
| [`wall.html`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/wall.html) | Embeddable Wall of Love | • Responsive 3-column testimonial card grid.<br>• Dynamic tag filter pills generated on-the-fly with counts.<br>• Embed code generator producing an iframe snippet for external sites.<br>• Zero private information exposed (emails omitted from API output). |
| [`appsscript.json`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/appsscript.json) | Script Manifest | Explicit OAuth scopes configured:<br>• `script.send_mail`<br>• `spreadsheets`<br>• `drive`<br>• `script.external_request`<br>• `userinfo.email` |
| [`spec.md`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/spec.md) | Technical Specification | Comprehensive project requirements, API contracts, and schema definitions. |
| [`README.md`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/README.md) | Setup & Deployment Guide | Documentation for deployment, script properties, and operational architecture. |
| [`.agents/skills/save-progress/SKILL.md`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/.agents/skills/save-progress/SKILL.md) | Workspace Skill (`/saveProgress`) | Standardizes reviewing the active session, checking git diffs, and updating `CONTEXT.md`. |
| [`.agents/skills/pushAll/SKILL.md`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/.agents/skills/pushAll/SKILL.md) | Workspace Skill (`/pushAll`) | Deploys code to Google Apps Script cloud via `clasp push` with immediate failure halting, explains commands, and commits/pushes to git/GitHub. |

---

## 3. Git History & Uncommitted Changes

### Recent Commit Log
- `59d9b1b`: Add base target top and redeploy live web app (Version 9).
- `48535a9`: Update cross-page navigation links on wall and submission form.
- `1da8c57`: Update navigation and action links in admin dashboard.
- `a686c0c`: Add workspace skills pushAll and save-progress, update `CONTEXT.md`.
- `e7e32da`: Add `authorizeEmail` utility and `CONTEXT.md` documentation.
- `2a1162c`: Add `oauthScopes` to `appsscript.json` for `MailApp` permissions.
- `ba2c04f`: Add `testSendEmail` function and clarify local execution in `form.html`.
- `c4d8105`: Add `setAdminEmail` utility and sync `Code.js`.
- `04fbe87`: Add email summary notification to admin on testimonial submission.
- `2248008`: Add Testimonial Hub full implementation (form, admin, wall, Gemini AI integration).

### Current Working Directory State
- Working tree clean: All changes committed and pushed to remote `origin/main`.
- Google Apps Script cloud deployment synchronized via `clasp push`.

---

## 4. Key Architectural & Design Decisions

1. **Serverless Google Workspace Backend**:
   - Eliminates dedicated cloud hosting costs and database maintenance by leveraging Google Sheets as the relational store and Google Drive for asset hosting.
2. **Client-Side Image Optimization**:
   - Images are downscaled to 400x400px JPEG via browser `<canvas>` before submission, minimizing payload size, Drive quota consumption, and network latency.
3. **Structured Gemini Extraction**:
   - Model `gemini-2.5-flash` is invoked with structured response prompts expecting JSON (`{"quote": "...", "tags": [...]}`).
   - Fallback logic safely sets sensible defaults (first sentence or truncated snippet) if API key is unconfigured or rate-limited.
4. **Data Isolation & Privacy**:
   - `getApprovedTestimonials()` explicitly strips submitter emails and non-approved rows on the backend before returning data to the client.
5. **Unified Web App Routing**:
   - A single Google Apps Script deployment services all three interfaces via `?page=form` (default), `?page=admin`, and `?page=wall`, simplifying deployment updates.
6. **Workspace-Scoped Agent Skills**:
   - Standard Antigravity agent discovery path `.agents/skills/` is used to create local, project-bound skills (`/saveProgress` and `/pushAll`) without polluting global machine configurations.

---

## 5. Configuration & Script Properties

The application relies on the following Google Apps Script Script Properties (`Project Settings > Script Properties`):

| Property Key | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API Key for `gemini-2.5-flash` |
| `DRIVE_FOLDER_ID` | Yes | Google Drive Folder ID where headshot images are uploaded |
| `ADMIN_EMAIL` | Optional | Destination email address for submission alert notifications (defaults to effective user) |
| `CHAT_WEBHOOK_URL` | Optional | Google Chat Space incoming webhook URL for Cards V2 alerts |
| `SPREADSHEET_ID` | Optional | Target Google Sheet ID (defaults to active spreadsheet if bound) |

---

## 6. Next Steps & Recommended Improvements

1. **Abuse Prevention**: Introduce honeypot fields or simple anti-spam checks in `form.html` to avoid automated spam submissions.
2. **Admin Authentication**: Restrict access to `?page=admin` by verifying whether `Session.getActiveUser().getEmail()` matches an authorized administrator.
3. **Digest Mode for High Volume**: Provide an option for daily/weekly email digests rather than per-submission emails if submission frequency grows.

