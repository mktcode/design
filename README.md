# Design (Vite + Tailwind v4 + GSAP + Lenis)

A minimal Vite setup with Tailwind CSS v4 (via the official Vite plugin), GSAP with ScrollTrigger, and Lenis for smooth scrolling.

## What’s inside

- Vite for fast dev/build
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- GSAP + ScrollTrigger wired to Lenis
- Simple demo content and animations

## Prerequisites

- Node.js (LTS recommended). If `npm` isn’t available, install Node using a version manager like `nvm`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview the production build:

```bash
npm run preview
```

## Notes

- Tailwind v4 setup follows the official guide: Using Vite plugin and a single `@import "tailwindcss";` in `src/style.css`.
- `vite.config.js` registers the Tailwind plugin.
- `src/main.js` initializes Lenis and GSAP ScrollTrigger, with a simple `.fade-in` animation on scroll.
- Adjust Lenis options and GSAP animations as needed.
