# StarAPI

A minimal Next.js + React frontend for building and testing API requests locally.

Features
- Build and send HTTP requests (GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS)
- Save and manage endpoints
- Request history, copy as cURL, export/import saved endpoints
- Pretty JSON response viewer

Quick start

1. Install dependencies

```bash
pnpm install
```

2. Run development server

```bash
pnpm dev
```

3. Build for production

```bash
pnpm build
```

Project notes
- Main UI: `app/home/page.tsx`
- UI primitives are in `components/ui/` and some custom components in `components/`.
- This project uses Next.js app router and Tailwind CSS.
- A previous explicit reference to `webpack` in `next.config.ts` was removed to use Next's default bundler.

Deploy
- Deploy to Vercel or any provider that supports Next.js. On Vercel, a new push to `main` will trigger a build.

Contributing
- Open an issue or PR on the repository.

License
- MIT (add your preferred license text)
