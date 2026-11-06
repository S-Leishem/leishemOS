# LeishemOS

LeishemOS is a browser-based Linux-inspired developer desktop and portfolio for Leishem. It is intentionally built with plain HTML, CSS and JavaScript so it can be deployed to GitHub Pages, Cloudflare Pages, or any static web server.

## Features

- Boot and guest-session welcome flow with reduced-motion support.
- Desktop icons, launcher, dock, notifications, calendar and quick settings.
- Reusable window manager with focus, drag, minimize, maximize, close, keyboard shortcuts and multiple terminal windows.
- About Me, projects, developer center, terminal, Code Studio, Hardware Lab, GitHub, virtual files, notes, calculator and settings apps.
- LocalStorage persistence for theme, accent, clock, motion preferences and notes.
- Sandboxed HTML/CSS/JavaScript preview in Code Studio.
- Public GitHub repository loading with graceful error handling.
- Responsive mobile layout and install-ready web app manifest.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in a modern Chromium or Firefox browser. A static server is recommended because ES modules are used.

## Deploy

Upload the repository to GitHub Pages or Cloudflare Pages with no build step. The GitHub app uses the public GitHub API and does not require a token.

## Customization

Personal content is kept near the top of [`app.js`](./app.js) in the `profile` and `projects` data objects. The visual system is defined in [`styles.css`](./styles.css).

## Scope note

The terminal is a safe simulated shell and the file manager is a virtual portfolio filesystem. Neither accesses the visitor's operating-system files or executes server commands.
