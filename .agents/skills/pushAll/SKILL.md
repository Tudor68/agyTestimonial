---
name: pushAll
description: Pushes code to Google Apps Script cloud via clasp, then stages, commits, and pushes to git/GitHub. Use when prompted with /pushAll or when asked to sync and commit all code.
---

# Push All Skill

## Overview
Deploys local code changes directly to the Google Apps Script project via `clasp push`, verifies the deployment succeeded, and then commits and pushes changes to the Git repository.

## Operational Rules
1. **Explain First**: Before executing each command, briefly explain in plain English what the command does and why it is being run at that point in the sequence.
2. **Halt on Failure**: If `clasp push` outputs any error or warning of failure, **stop immediately** and report the error to the user. Do not proceed to the git step under any circumstances.

## Workflow Instructions

1. **Step 1: Apps Script Push (`clasp push`)**
   - Provide plain-English explanation before running the command (e.g., explaining that `clasp push` uploads local script files and HTML files to the Google Apps Script project cloud runtime).
   - Execute:
     ```bash
     clasp push
     ```
   - **Verification Gate**:
     - Check the command output. If any error occurs (authentication failure, syntax error, manifest error, network failure), **halt the sequence immediately** and present the error details to the user.

2. **Step 2: Git Status & Staging**
   - Provide plain-English explanation of checking repository status and staging changes.
   - Review status and stage files:
     ```bash
     git status
     git add <modified-files>  # or git add -A
     ```

3. **Step 3: Commit Changes**
   - Provide plain-English explanation of creating a structured git commit.
   - Commit with a clear, concise message describing the changes made in the session:
     ```bash
     git commit -m "<descriptive message>"
     ```

4. **Step 4: Push to Remote**
   - Provide plain-English explanation of pushing committed changes to the GitHub remote repository.
   - Execute:
     ```bash
     git push
     ```

5. **Step 5: Completion Summary**
   - Confirm to the user that both the Apps Script cloud project and GitHub repository have been successfully updated.

