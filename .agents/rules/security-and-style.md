# Workspace Security & Coding Guidelines

## Security Rules
1. **Never read secret files**: Under no circumstances should `.dev.vars` or `.env` files be accessed. Always refer to `.dev.vars.example` or `.env.example`.
2. **Sanitize inputs**: Ensure all user inputs and external API inputs are validated before processing.
3. **Safe Git practices**: Never stage or commit credential files. Verify `.gitignore` includes `.dev.vars` and `.env*`.

## Coding Style
1. **Clean Code & Modularity**: Keep functions focused, readable, and well-typed.
2. **Handling Errors**: Catch expected errors gracefully and provide meaningful error messages.
