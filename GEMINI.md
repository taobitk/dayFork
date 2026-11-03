# Project Rules & Guidelines: DayFork

## 1. Security & Environment Privacy (STRICT)
- **STRICTLY FORBIDDEN TO READ SECRETS**: The Agent is NEVER allowed to inspect, read, grep, or display contents of `.dev.vars`, `.env`, `.env.local`, `.env.*.local`, or any private credential/token files.
- **REFERENCE TEMPLATES ONLY**: All required environment variables and configuration keys MUST be referenced exclusively from `.dev.vars.example` or `.env.example`.
- **NO SECRET LEAKS**: Never output secrets, API tokens, private keys, or passwords in chat responses, generated files, commit messages, or terminal commands.

## 2. Confirmation Before Making Changes
- **No Unsolicited Modifications**: Never create, edit, overwrite, or delete critical files without clear confirmation. Propose plans and wait for the go-ahead.

## 3. Tech Stack & Architecture
- **Project**: DayFork
- **Primary Language**: TypeScript / JavaScript / Python
- [Add your project-specific conventions, database info, and folder structure here]

## 4. Key Commands
- Development: `npm run dev`
- Build / Check: `npm run build`
- Testing: `npm test`
