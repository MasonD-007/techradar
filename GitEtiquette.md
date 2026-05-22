# Git Etiquette

## Conventional Commits

All commits should follow the Conventional Commits specification:

```
<type>[optional scope]: <description>
```

### Commit Types

| Type       | Description                                              |
|------------|----------------------------------------------------------|
| `fix`      | Patches a bug in the codebase                            |
| `feat`     | Introduces a new feature into the codebase               |
| `refactor` | Code changes without altering external behavior          |
| `style`    | Formatting changes, no logic or behavior modifications   |
| `docs`     | Documentation-only changes, no code impact               |
| `chore`    | Maintenance tasks not affecting source code behavior     |
| `test`     | Adds or updates tests, no production code changes        |

### Examples

```
fix: resolve null pointer exception in user authentication
feat: add password reset functionality
refactor: simplify payment processing logic
style: format code according to ESLint rules
docs: update API documentation for v2 endpoints
chore: update dependencies to latest versions
test: add unit tests for user registration flow
feat(api): implement rate limiting for public endpoints
fix(ui): correct button alignment on mobile devices
```

### Best Practices

- Use imperative mood in the description (e.g., "add" not "added" or "adds")
- Don't capitalize the first letter of the description
- No period (.) at the end of the description
- Keep the description concise and clear
- Use the optional scope to specify the part of the codebase affected
