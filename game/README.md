# Game Client

This directory contains a simple React client for interacting with the game API.

## Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Start the client in development mode:

```bash
pnpm --filter game-client dev
```

Build for production:

```bash
pnpm --filter game-client build
```

### Environment

Configure the API base URL by creating an `.env` file inside `game/client`:

```
VITE_API_URL=http://localhost:3000
```

This variable controls where requests such as `/login` or `/battle` are sent.
