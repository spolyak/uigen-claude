# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset SQLite database
```

To run a single test file: `npx vitest run src/lib/__tests__/some-file.test.ts`

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in chat; Claude generates/edits them via tools in a virtual file system; the result renders in a sandboxed iframe.

### Request lifecycle

1. User types in `ChatInterface` → sends messages + serialized file state to `POST /api/chat`
2. `/api/chat/route.ts` calls Claude via Vercel AI SDK `streamText` with two tools:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create/edit file content
   - `file_manager` (`src/lib/tools/file-manager.ts`) — rename/delete files
3. Tool calls stream back to the client; `chat-context.tsx` intercepts them via `onToolCall` and forwards to `FileSystemContext.handleToolCall`
4. `VirtualFileSystem` (`src/lib/file-system.ts`) applies changes in memory — no disk I/O
5. `PreviewFrame` detects `refreshTrigger` changes, Babel-transpiles JSX on the client, injects an import map pointing to `esm.sh` CDN, and re-renders in a sandboxed iframe
6. On stream completion, project messages + serialized file state are saved to Prisma (authenticated users only)

### Key modules

| Path | Role |
|------|------|
| `src/lib/file-system.ts` | `VirtualFileSystem` class — in-memory file tree, serialize/deserialize |
| `src/lib/contexts/file-system-context.tsx` | React context wrapping VirtualFileSystem; `handleToolCall` dispatch |
| `src/lib/contexts/chat-context.tsx` | `useChat` (ai-sdk/react) + tool call routing |
| `src/lib/provider.ts` | Factory returning Claude or Mock language model provider |
| `src/lib/prompts/generation.tsx` | System prompt for component generation |
| `src/lib/transform/jsx-transformer.ts` | Babel JSX transform + import map for CDN modules |
| `src/app/api/chat/route.ts` | Streaming chat endpoint; registers tools; persists on completion |
| `src/app/main-content.tsx` | Root UI layout — resizable left (chat) / right (preview + code editor) panels |
| `src/components/preview/PreviewFrame.tsx` | Sandboxed iframe preview with hot reload |
| `src/actions/` | Server actions for auth (signup/signin/signout) and project CRUD |
| `src/lib/auth.ts` | JWT session management (jose, 7-day expiry) |

### Authentication

- Optional — anonymous users can generate components without signing in
- JWT stored in cookie; middleware at `src/middleware.ts` protects `/api/projects` and `/api/filesystem`
- Passwords hashed with bcrypt; sessions use `jose`
- Database: SQLite via Prisma (`prisma/schema.prisma`), two models: `User` and `Project`

### Mock provider

If `ANTHROPIC_API_KEY` is not set, `src/lib/provider.ts` returns a mock provider so the app runs without an API key. Set the key in `.env` for real generation.

### Adding a new Claude tool

1. Create the tool in `src/lib/tools/`
2. Register it in `src/app/api/chat/route.ts` (pass to `streamText`)
3. Add a handler case in `FileSystemContext.handleToolCall` if it modifies the virtual FS

### Path conventions

- Virtual file paths always start with `/`
- TypeScript imports use the `@/` alias → `src/`
