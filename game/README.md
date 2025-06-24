# Game Prototype

This directory contains a minimal server setup for a browser-based game prototype.

## Server

- **Express** server with endpoints:
  - `GET /ping` — health check
  - `POST /register` — create a user (in memory)
  - `POST /login` — authenticate a user
- Run with `pnpm --filter game-server install` followed by `pnpm --filter game-server start`.

Additional client code can be added later.
