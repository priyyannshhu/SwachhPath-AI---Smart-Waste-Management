 # SwachhPath AI — Smart Waste Management

SwachhPath AI is a responsive web dashboard and management tool designed to help municipal teams and citizens monitor and manage waste collection across postcodes. Built with modern web tooling, it focuses on clarity, performance, and usability.

## Highlights
- Clean, component-driven UI built with React + TypeScript
- Fast HMR development with Vite
- Recharts-powered visualizations for bin fill-levels and trends
- GSAP animations and accessible UI primitives
- Optional Cloudflare Workers integration for edge APIs

## Quick start
1. Install dependencies

```bash
npm install
```

2. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173 to view the app.

## Available scripts
- `npm run dev` — start dev server (Vite)
- `npm run build` — run TypeScript build and Vite production build
- `npm run lint` — run ESLint
- `npm run cf-typegen` — generate Cloudflare types (requires `wrangler`)
- `npm run check` — type-check, build, and wrangler dry-run

## Project layout
- `src/react-app/` — application source code
- `src/react-app/pages/` — page routes (Dashboard, Dustbins, Complaints, Localities, Login)
- `src/react-app/components/` — UI components and layout primitives
- `index.html` — HTML entry
- `package.json` — scripts and dependency manifest

## Building & deploying
1. Build

```bash
npm run build
```

2. (Optional) Cloudflare Worker

```bash
npm run cf-typegen
npm run check
npx wrangler dev
```

## Contributing
- Create issues for bugs or feature requests
- Fork and open a PR with focused, tested changes

## Maintainers & Contact
- Maintainer: Priyanshu Vishwakarma
- Project: SwachhPath AI — Smart Waste Management

## License
- MIT

Thank you for contributing to cleaner, smarter cities! 🚮✨
