---
name: save-progress
description: Reviews the current session and updates CONTEXT.md with updated app state, modified files, key decisions, and next steps. Use when prompted with /saveProgress or when requested to save session progress.
---

# Save Progress Skill

## Overview
This skill provides a standardized workflow to document the active session's progress directly into `CONTEXT.md`.

## When to Use
- When the user runs `/saveProgress` or asks to save/checkpoint the current progress.
- At the end of major implementation steps before wrapping up a session.

## Workflow Instructions

1. **Review Session Context**:
   - Inspect git status (`git status`, recent commits, and unstaged modifications).
   - Review all files created, edited, or inspected during the session.
   - Review conversation history for architectural decisions, resolved issues, and user preferences.

2. **Read Current `CONTEXT.md`**:
   - Read [`CONTEXT.md`](file:///Users/sharonstephan/Library/CloudStorage/GoogleDrive-shobdentest@gmail.com/My%20Drive/Gemini%20for%20Builders%20Course/Testamonial%20Project/agyTestimonials/CONTEXT.md) to preserve existing project background and formatting structure.

3. **Update Core Sections in `CONTEXT.md`**:
   - **Current App State**: Reflect new capabilities or current operational status across layers.
   - **File Manifest / Modified Files**: Update descriptions and statuses of any added or changed files.
   - **Key Decisions**: Document rationale for design choices, library usage, or architectural pivots made in the session.
   - **Next Steps**: Outline clear, actionable items for subsequent work.

4. **Verify & Confirm**:
   - Review the diff in `CONTEXT.md` to ensure existing historical context remains intact.
   - Inform the user that `CONTEXT.md` has been updated with a brief summary of what was recorded.

