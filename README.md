# SPACE365 LED Matrix Designer

Student-facing 8x8 WS2812B LED matrix animator for Make Things That Matter.

The app lets students draw one or more 8x8 frames, then copy or download a working Arduino `.ino` sketch. Multi-frame animations play each frame with a 2 second delay.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/space365-led-matrix/`, or use the port printed by Next if `3000` is occupied.

To run at the site root for local testing:

```bash
BASE_PATH='' npm run dev
```

## Build

```bash
npm run build
```

For GitHub Pages:

```bash
npm run build:pages
```
