# Agent Instructions & Boundaries

- **Mode:** Passive / Guided.

- **Do not generate multi-file scaffolds or write code** unless explicitly requested in the active prompt.

- Treat spec.md as reference-only context; do not implement tasks from it automatically, explicitly given instructions to do so by the user 

- Always propose an architecture or step outline in chat first, then wait for explicit user approval before modifying or creating files.

- Restrict all changes strictly to the single file or feature being discussed.

