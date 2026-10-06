# CITY LIFE

## Build a life. Build an empire.

City Life is a universal browser-based life simulation.

Players can:

- Create characters
- Choose homes
- Choose careers
- Earn virtual money
- Buy possessions
- Build skills
- Upgrade their lifestyle
- Purchase property
- Start businesses
- Interact with city services
- Participate in elections
- Influence the development of the city
- Eventually interact with other players

## Technology

- Cloudflare Workers
- Cloudflare D1
- GitHub
- JavaScript

## Database

The production D1 database is:

`citylife-db`

Worker binding:

`Db`

## Development

Development is designed around the GitHub → Cloudflare deployment workflow.

Local Wrangler execution is not required.

## Project Structure

```text
City-life/
├── src/
│   └── index.js
├── wrangler.jsonc
└── README.md
