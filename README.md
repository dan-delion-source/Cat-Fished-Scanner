# NYAE Biometric Scanner

NYAE is an interactive camera experience that masquerades as a serious biometric scanning booth, then turns a short sequence of pose captures into an intentionally over-the-top kawaii cat video.

The scanner guides four poses, captures only the required still frames, and composes a 12-second vertical animation locally in the browser. The edit is timed to the supplied `Nyae inchi.mp3` soundtrack, beginning around the 9.18-second point of the source audio.

## Features

- Landscape camera viewport with a head-to-mid-chest framing guide.
- Local face, pose, and hand landmark guidance using MediaPipe Tasks Vision.
- Automatic capture with alignment feedback and countdowns.
- Four pose stages: neutral face scan, cat-paw fists, raised open palms, and raised peace signs.
- Background replacement, tracked cat ears, stickers, sparkles, transitions, and beat-synced cuts.
- Local preview and downloadable video export.
- Privacy dialog that explains camera use before capture. There is no application backend and no continuous recording.

## Requirements

- Node.js 20 or newer (Node 22 LTS is also supported).
- npm 10 or newer.
- A modern browser with camera support. Firefox is supported and is useful for testing the production build.
- A camera for the live scanner. Camera access requires `localhost` during development or HTTPS in production.
- Internet access the first time the scanner starts so the MediaPipe WASM runtime and model files can load from the configured Google CDN.

## Setup

```bash
git clone <your-repository-url>
cd Nyae
npm install
```

The install command uses the committed `package-lock.json` so dependency versions remain reproducible.

## Run Locally

Start the Vite development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Approve camera access, read the privacy notice, and choose **Try demo** or start a live scan.

The development server is bound to `0.0.0.0`, which allows testing from another device on the same network. For a physical phone or another computer, use an HTTPS tunnel or an HTTPS reverse proxy because browsers block camera access on insecure non-local origins.

## Production Build

Create the deployable static bundle:

```bash
npm run build
```

The output is written to `dist/`. Test that exact production bundle locally with:

```bash
npm run preview -- --port 4173
```

Then open `http://localhost:4173` in Firefox or another supported browser. Deploy the contents of `dist/` to GitHub Pages, Netlify, Cloudflare Pages, or another static HTTPS host. If the site is served from a repository subpath instead of the domain root, configure Vite's `base` option in `vite.config.*` before building.

## Tests

Run the unit tests:

```bash
npm test
```

To run the Firefox browser smoke test, start the production preview on port 5174:

```bash
npm run preview -- --port 5174
```

Launch Firefox with WebDriver BiDi enabled on port 9222, then run:

```bash
PREVIEW_URL=http://localhost:5174 node tests/firefox-check.mjs
```

The smoke test checks responsive overflow, privacy-dialog behavior, reset/replay, the generated result, export availability, audio offset, and browser console errors.

## Project Layout

```text
src/main.js       Application state, camera flow, dialogs, and controls
src/tracker.js    MediaPipe model loading and local landmark tracking
src/pose-guide.js Pose silhouettes, hand layouts, and alignment overlays
src/composer.js   Canvas compositor, stickers, effects, audio, and export
src/timeline.js   Beat timing and pose cue definitions
src/assets.js     Original SVG artwork and supplied raster asset loading
assets/           User-supplied soundtrack and image assets
tests/            Node unit tests and Firefox production smoke test
dist/             Generated production output (ignored by Git)
```

## Privacy And Security

- Camera frames are processed locally in the browser; there is no upload API or application server.
- Only the frames used for the pose sequence are retained for composition. Temporary alignment frames are discarded.
- Camera access is requested only after the user starts the experience. The browser's permission controls remain authoritative.
- Serve production over HTTPS and configure a restrictive Content Security Policy and camera Permissions Policy at the host or reverse proxy.
- Do not commit credentials, private keys, `.env` files, or model/API tokens. Local environment files are ignored by `.gitignore`.
- The soundtrack in `assets/Nyae inchi.mp3` was supplied for this project. Confirm that you have permission to redistribute it before publishing a public deployment.

## Assets And Licensing

The decorative SVG artwork is original project artwork. The app also uses the supplied files in `assets/`; see [`ASSETS.md`](ASSETS.md) for the asset inventory, references, and licensing notes. Do not add third-party characters, unlicensed music, or copied sticker artwork without the appropriate rights.

## Export Notes

The app selects a browser-supported recording format at runtime. Browsers that expose native MP4 recording will export MP4; Firefox commonly exports WebM. The download button uses the format reported by the browser, so deployment should not assume that every browser produces the same container.
