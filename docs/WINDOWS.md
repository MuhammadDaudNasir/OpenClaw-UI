# Windows Guide (Experimental)

This project now supports **Windows packaging** while keeping the macOS flow unchanged.

## What Works

- `npm run build` (renderer/main/preload build)
- `npm run dist:win` (Windows portable package via electron-builder)

Output is generated in:

- `release/win-*-unpacked/`

## Prerequisites (Windows)

1. Install Node.js 20+ (LTS recommended).
2. Install OpenClaw CLI and verify it runs in PowerShell or CMD.
3. Install project dependencies:

```bash
npm install
```

## Build Commands

Development build:

```bash
npm run build
```

Windows package (portable):

```bash
npm run dist:win
```

## Run Notes

- Overlay/tray behavior is tuned primarily for macOS.
- Windows support is currently **experimental** and may need UX refinements.
- If packaging succeeds but runtime behavior differs on Windows, open an issue with logs and screenshots.

## Troubleshooting

If `dist:win` fails:

1. Delete dependencies and reinstall:

```bash
rm -rf node_modules
npm install
```

2. Retry:

```bash
npm run dist:win
```

3. Ensure OpenClaw is available in `PATH` on Windows.
