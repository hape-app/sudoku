## JavaScript / TypeScript package manager

- Always use Bun for JavaScript and TypeScript projects.
- Use `bun install`, `bun add`, `bun remove`, and `bun run`.
- Do not use npm, pnpm, or yarn unless the user explicitly asks for them.
- Prefer Bun-compatible commands in README files and project documentation.

## JavaScript / TypeScript code style

- Prefer single quotes (`''`) for strings in JavaScript and TypeScript code.

## Git

- After completing code changes and passing relevant verification, automatically create a Git commit without asking for confirmation.
- Commit only files related to the current task; do not include unrelated user changes.
- Do not amend commits or force-push unless the user explicitly requests it.
