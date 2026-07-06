# How to Run and Test Memory Atlas on a Mac

This guide describes the everyday workflow for trying local changes in the
browser. Run all terminal commands from the root folder of the Memory Atlas
project.

## Start the app

1. Open the project in VS Code.
2. Open VS Code's integrated terminal with **Terminal → New Terminal**.
3. Confirm that the terminal is in the project root—the folder containing
   `package.json`.
4. If this is the first run, or the dependencies have changed, install them:

   ```bash
   npm install
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local address printed in the terminal, usually
   `http://localhost:5173`.

Keep this terminal and the development server running while working on the app.

## See changes in the browser

Vite watches the project files while `npm run dev` is running. After a file is
saved, the browser will normally update automatically. There is no need to stop
and restart the server for most code, style, or documentation changes.

If a change does not appear:

1. Refresh the page normally with **Command-R**.
2. If the browser may be showing cached files, do a hard refresh with
   **Shift-Command-R**.
3. Restart the development server only if the first two steps do not help.

## Stop or restart the app

In the terminal that is running the server, press **Control-C** to stop it.
Start it again with:

```bash
npm run dev
```

A restart is most likely to be useful after:

- installing or updating an npm package;
- changing Vite configuration or environment settings; or
- encountering a development-server error that does not recover.

## Run the automated checks

Before considering a change finished, stop the development server or open a
second terminal in the project root, then run:

```bash
npm run check
npm test
npm run build
```

These commands check Svelte and TypeScript, run the automated tests, and verify
that the production build can be created.

## Quick reference

| Task | Command or shortcut |
| --- | --- |
| Install dependencies | `npm install` |
| Start the app | `npm run dev` |
| Stop the app | **Control-C** in the server terminal |
| Normal browser refresh | **Command-R** |
| Hard browser refresh | **Shift-Command-R** |
| Run type and Svelte checks | `npm run check` |
| Run automated tests | `npm test` |
| Verify the production build | `npm run build` |
