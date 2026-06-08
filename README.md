# SPACE365 LED Matrix Animator

Student-facing 8x8 WS2812B LED matrix animator for the SPACE365 Make Things That Matter course.

Students use this app to draw one or more 8x8 LED frames, then copy or download a working Arduino `.ino` sketch for a physical WS2812B LED matrix. Multi-frame animations play each frame with a 2 second delay.

Live site:

```text
https://jtrudeau.github.io/space365-led-matrix/
```

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

## Deploy

```bash
npm run deploy
```

This builds the static site with the `/space365-led-matrix` base path and publishes the `out/` folder to the `gh-pages` branch.
