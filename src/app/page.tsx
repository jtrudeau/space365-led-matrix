"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Pixel = {
  color: string;
};

type Matrix = Pixel[][];
type ToolMode = "paint" | "erase" | "pick";

type ExampleDesign = {
  name: string;
  pixels: string[][];
};

const SIZE = 8;
const OFF = "#000000";
const STORAGE_KEY = "space365-led-matrix-v2";
const FRAME_DELAY_MS = 2000;

const palette = [
  { name: "Off", color: OFF },
  { name: "Red", color: "#c00000" },
  { name: "Gold", color: "#f6bb00" },
  { name: "Blue", color: "#4287f5" },
  { name: "Deep Blue", color: "#31579b" },
  { name: "Green", color: "#22a06b" },
  { name: "Cyan", color: "#00b8d4" },
  { name: "White", color: "#ffffff" },
  { name: "Orange", color: "#f97316" },
  { name: "Pink", color: "#ff4fa3" },
];

const makeEmptyMatrix = (): Matrix =>
  Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ color: OFF }))
  );

const fromRows = (rows: string[][]): Matrix =>
  rows.map((row) => row.map((color) => ({ color })));

const examples: ExampleDesign[] = [
  {
    name: "Class Starter",
    pixels: [
      [OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF],
      [OFF, "#c00000", "#c00000", OFF, OFF, "#c00000", "#c00000", OFF],
      ["#c00000", "#f6bb00", "#f6bb00", "#c00000", "#c00000", "#f6bb00", "#f6bb00", "#c00000"],
      ["#c00000", "#f6bb00", "#4287f5", "#4287f5", "#4287f5", "#4287f5", "#f6bb00", "#c00000"],
      [OFF, "#c00000", "#4287f5", "#4287f5", "#4287f5", "#4287f5", "#c00000", OFF],
      [OFF, OFF, "#c00000", "#31579b", "#31579b", "#c00000", OFF, OFF],
      [OFF, OFF, OFF, "#c00000", "#c00000", OFF, OFF, OFF],
      [OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF],
    ],
  },
  {
    name: "Signal",
    pixels: [
      [OFF, OFF, "#00b8d4", "#00b8d4", "#00b8d4", "#00b8d4", OFF, OFF],
      [OFF, "#00b8d4", OFF, OFF, OFF, OFF, "#00b8d4", OFF],
      ["#00b8d4", OFF, "#ffffff", OFF, OFF, "#ffffff", OFF, "#00b8d4"],
      ["#00b8d4", OFF, OFF, "#f6bb00", "#f6bb00", OFF, OFF, "#00b8d4"],
      ["#00b8d4", OFF, OFF, "#f6bb00", "#f6bb00", OFF, OFF, "#00b8d4"],
      ["#00b8d4", OFF, "#ffffff", OFF, OFF, "#ffffff", OFF, "#00b8d4"],
      [OFF, "#00b8d4", OFF, OFF, OFF, OFF, "#00b8d4", OFF],
      [OFF, OFF, "#00b8d4", "#00b8d4", "#00b8d4", "#00b8d4", OFF, OFF],
    ],
  },
  {
    name: "Seed",
    pixels: [
      [OFF, OFF, OFF, "#22a06b", "#22a06b", OFF, OFF, OFF],
      [OFF, OFF, "#22a06b", "#22a06b", "#22a06b", "#22a06b", OFF, OFF],
      [OFF, "#22a06b", "#8cc63f", "#8cc63f", "#8cc63f", "#8cc63f", "#22a06b", OFF],
      ["#22a06b", "#8cc63f", "#8cc63f", "#f6bb00", "#f6bb00", "#8cc63f", "#8cc63f", "#22a06b"],
      ["#22a06b", "#8cc63f", "#8cc63f", "#f6bb00", "#f6bb00", "#8cc63f", "#8cc63f", "#22a06b"],
      [OFF, "#22a06b", "#8cc63f", "#8cc63f", "#8cc63f", "#8cc63f", "#22a06b", OFF],
      [OFF, OFF, "#22a06b", "#22a06b", "#22a06b", "#22a06b", OFF, OFF],
      [OFF, OFF, OFF, "#22a06b", "#22a06b", OFF, OFF, OFF],
    ],
  },
  {
    name: "Arrow",
    pixels: [
      [OFF, OFF, OFF, "#f97316", "#f97316", OFF, OFF, OFF],
      [OFF, OFF, "#f97316", "#f6bb00", "#f6bb00", "#f97316", OFF, OFF],
      [OFF, "#f97316", "#f6bb00", "#ffffff", "#ffffff", "#f6bb00", "#f97316", OFF],
      ["#f97316", "#f6bb00", "#ffffff", "#4287f5", "#4287f5", "#ffffff", "#f6bb00", "#f97316"],
      [OFF, OFF, OFF, "#4287f5", "#4287f5", OFF, OFF, OFF],
      [OFF, OFF, OFF, "#4287f5", "#4287f5", OFF, OFF, OFF],
      [OFF, OFF, OFF, "#4287f5", "#4287f5", OFF, OFF, OFF],
      [OFF, OFF, OFF, "#4287f5", "#4287f5", OFF, OFF, OFF],
    ],
  },
];

const cloneMatrix = (matrix: Matrix): Matrix =>
  matrix.map((row) => row.map((pixel) => ({ ...pixel })));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const formatCrgb = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `CRGB(${r},${g},${b})`;
};

const generateFrameCode = (frame: Matrix, index: number) => {
  const lines = frame.map(
    (row) => `  ${row.map((pixel) => formatCrgb(pixel.color)).join(",")},`
  );

  return `CRGB frame${index + 1}[NUM_LEDS] =\n{\n${lines.join("\n")}\n};`;
};

const generateFullSketch = (frames: Matrix[], brightness: number, dataPin: number) => {
  const frameCode = frames.map(generateFrameCode).join("\n\n");
  const frameList = frames.map((_, index) => `frame${index + 1}`).join(", ");

  return `#include <FastLED.h>

const uint8_t NUM_X = 8;
const uint8_t NUM_Y = 8;
const uint8_t DATA_PIN = ${dataPin};

const uint16_t NUM_LEDS = NUM_X * NUM_Y;
const uint16_t FRAME_DELAY_MS = ${FRAME_DELAY_MS};

CRGB leds[NUM_LEDS];

${frameCode}

CRGB* animationFrames[] = { ${frameList} };
const uint8_t FRAME_COUNT = sizeof(animationFrames) / sizeof(animationFrames[0]);

void setup()
{
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(${brightness});
}

void loop()
{
  for (uint8_t frameIndex = 0; frameIndex < FRAME_COUNT; frameIndex++) {
    displayBitmapColors(leds, animationFrames[frameIndex], 8, 8);
    delay(FRAME_DELAY_MS);
  }
}

void displayBitmapColors(CRGB array[], CRGB bitmap[], int rows, int cols) {
  for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
      array[i * cols + j] = bitmap[i * cols + j];
    }
  }
  FastLED.show();
}`;
};

export default function Home() {
  const [frames, setFrames] = useState<Matrix[]>(() => [fromRows(examples[0].pixels)]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [currentColor, setCurrentColor] = useState("#4287f5");
  const [customColor, setCustomColor] = useState("#4287f5");
  const [tool, setTool] = useState<ToolMode>("paint");
  const [isPainting, setIsPainting] = useState(false);
  const [brightness, setBrightness] = useState(80);
  const [dataPin, setDataPin] = useState(3);
  const [notice, setNotice] = useState("");

  const currentFrame = frames[currentFrameIndex] ?? frames[0];
  const fullSketch = useMemo(
    () => generateFullSketch(frames, brightness, dataPin),
    [brightness, dataPin, frames]
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        frames?: Matrix[];
        currentFrameIndex?: number;
        currentColor?: string;
        brightness?: number;
        dataPin?: number;
      };

      if (parsed.frames?.length) {
        setFrames(parsed.frames);
        setCurrentFrameIndex(
          Math.max(0, Math.min(parsed.currentFrameIndex ?? 0, parsed.frames.length - 1))
        );
      }
      if (parsed.currentColor) {
        setCurrentColor(parsed.currentColor);
        setCustomColor(parsed.currentColor);
      }
      if (typeof parsed.brightness === "number") setBrightness(parsed.brightness);
      if (typeof parsed.dataPin === "number") setDataPin(parsed.dataPin);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ frames, currentFrameIndex, currentColor, brightness, dataPin })
    );
  }, [brightness, currentColor, currentFrameIndex, dataPin, frames]);

  useEffect(() => {
    const stopPainting = () => setIsPainting(false);
    window.addEventListener("pointerup", stopPainting);
    window.addEventListener("pointercancel", stopPainting);
    return () => {
      window.removeEventListener("pointerup", stopPainting);
      window.removeEventListener("pointercancel", stopPainting);
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }, []);

  const updateCurrentFrame = useCallback(
    (nextFrame: Matrix) => {
      setFrames((previousFrames) =>
        previousFrames.map((frame, index) =>
          index === currentFrameIndex ? nextFrame : frame
        )
      );
    },
    [currentFrameIndex]
  );

  const paintPixel = useCallback(
    (row: number, col: number) => {
      const target = currentFrame[row][col];

      if (tool === "pick") {
        setCurrentColor(target.color);
        setCustomColor(target.color);
        setTool("paint");
        showNotice("Color picked");
        return;
      }

      const next = cloneMatrix(currentFrame);
      next[row][col].color = tool === "erase" ? OFF : currentColor;
      updateCurrentFrame(next);
    },
    [currentColor, currentFrame, showNotice, tool, updateCurrentFrame]
  );

  const applyCustomColor = (color: string) => {
    setCustomColor(color);
    setCurrentColor(color);
    setTool("paint");
  };

  const loadExample = (example: ExampleDesign) => {
    updateCurrentFrame(fromRows(example.pixels));
    showNotice(`${example.name} loaded into frame ${currentFrameIndex + 1}`);
  };

  const addFrame = () => {
    setFrames((previousFrames) => [...previousFrames, makeEmptyMatrix()]);
    setCurrentFrameIndex(frames.length);
    showNotice(`Frame ${frames.length + 1} added`);
  };

  const duplicateFrame = () => {
    setFrames((previousFrames) => [...previousFrames, cloneMatrix(currentFrame)]);
    setCurrentFrameIndex(frames.length);
    showNotice(`Frame ${frames.length + 1} copied from frame ${currentFrameIndex + 1}`);
  };

  const deleteFrame = () => {
    if (frames.length === 1) {
      showNotice("Keep at least one frame");
      return;
    }

    setFrames((previousFrames) =>
      previousFrames.filter((_, index) => index !== currentFrameIndex)
    );
    setCurrentFrameIndex((previousIndex) =>
      Math.max(0, Math.min(previousIndex, frames.length - 2))
    );
    showNotice("Frame deleted");
  };

  const clearCurrentFrame = () => {
    updateCurrentFrame(makeEmptyMatrix());
    showNotice(`Frame ${currentFrameIndex + 1} cleared`);
  };

  const fillCurrentFrame = () => {
    updateCurrentFrame(
      Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => ({ color: currentColor }))
      )
    );
    showNotice(`Frame ${currentFrameIndex + 1} filled`);
  };

  const copyCode = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(fullSketch);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = fullSketch;
      textArea.setAttribute("readonly", "true");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    showNotice("Arduino sketch copied");
  };

  const downloadCode = () => {
    const blob = new Blob([fullSketch], { type: "text/x-arduino;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "space365-led-matrix.ino";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice("Arduino sketch downloaded");
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="grid gap-4 border-b-4 border-[var(--line)] pb-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-2 inline-flex border-2 border-[var(--line)] bg-[var(--lime)] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              Make Things That Matter
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-none tracking-normal text-[var(--ink)] sm:text-5xl">
              8x8 LED Matrix Animator
            </h1>
          </div>
          <div className="panel max-w-xl p-4 text-sm font-bold leading-snug">
            Build one image or several frames. The generated Arduino sketch plays
            each frame on the WS2812B matrix with a 2 second delay.
          </div>
        </header>

        <section className="panel min-w-0 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Frames ({frames.length})</h2>
              <p className="mt-1 text-sm font-bold text-[var(--steel)]">
                Each frame plays for 2 seconds in the Arduino sketch.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={addFrame}>
                Add
              </button>
              <button type="button" className="btn" onClick={duplicateFrame}>
                Duplicate
              </button>
              <button
                type="button"
                className="btn"
                onClick={deleteFrame}
                disabled={frames.length === 1}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {frames.map((frame, frameIndex) => (
              <button
                type="button"
                key={frameIndex}
                className={`w-28 shrink-0 border-2 border-[var(--line)] bg-white p-2 text-left transition ${
                  frameIndex === currentFrameIndex ? "ring-4 ring-[var(--sun)]" : ""
                }`}
                onClick={() => setCurrentFrameIndex(frameIndex)}
              >
                <div className="mb-2 grid aspect-square grid-cols-8 gap-[2px] bg-[#101719] p-1">
                  {frame.flatMap((row, rowIndex) =>
                    row.map((pixel, colIndex) => (
                      <span
                        key={`${rowIndex}-${colIndex}`}
                        className="aspect-square"
                        style={{
                          backgroundColor:
                            pixel.color.toLowerCase() === OFF ? "#202a2e" : pixel.color,
                        }}
                      />
                    ))
                  )}
                </div>
                <span className="text-xs font-black">Frame {frameIndex + 1}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(560px,1.45fr)_minmax(360px,0.85fr)]">
          <div className="panel min-w-0 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">Canvas: Frame {currentFrameIndex + 1}</h2>
            </div>

            <div className="mx-auto grid aspect-square w-full max-w-[680px] grid-cols-8 gap-2 rounded-sm border-4 border-[#101719] bg-[#101719] p-3 sm:gap-3 sm:p-4">
              {currentFrame.map((row, rowIndex) =>
                row.map((pixel, colIndex) => {
                  const isOff = pixel.color.toLowerCase() === OFF;
                  return (
                    <button
                      type="button"
                      key={`${currentFrameIndex}-${rowIndex}-${colIndex}`}
                      aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                      className="aspect-square rounded-full border-2 border-white/20 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--sun)]"
                      style={{
                        backgroundColor: isOff ? "#202a2e" : pixel.color,
                        boxShadow: isOff
                          ? "inset 0 2px 8px rgba(255,255,255,0.08)"
                          : `0 0 18px ${pixel.color}, inset 0 2px 8px rgba(255,255,255,0.35)`,
                      }}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setIsPainting(true);
                        paintPixel(rowIndex, colIndex);
                      }}
                      onPointerEnter={() => {
                        if (isPainting && tool !== "pick") {
                          paintPixel(rowIndex, colIndex);
                        }
                      }}
                    />
                  );
                })
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" className="btn btn-primary" onClick={clearCurrentFrame}>
                Clear Frame
              </button>
              <button type="button" className="btn" onClick={fillCurrentFrame}>
                Fill Frame
              </button>
            </div>
          </div>

          <aside className="grid min-w-0 content-start gap-5">
            <div className="panel min-w-0 p-4">
              <h2 className="mb-3 text-xl font-black">Drawing Tools</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn ${tool === "paint" ? "btn-active" : ""}`}
                  onClick={() => setTool("paint")}
                >
                  Paint
                </button>
                <button
                  type="button"
                  className={`btn ${tool === "erase" ? "btn-active" : ""}`}
                  onClick={() => setTool("erase")}
                >
                  Erase
                </button>
                <button
                  type="button"
                  className={`btn ${tool === "pick" ? "btn-active" : ""}`}
                  onClick={() => setTool("pick")}
                >
                  Pick
                </button>
              </div>
            </div>

            <div className="panel min-w-0 p-4">
              <h2 className="mb-3 text-xl font-black">Colors</h2>
              <div className="mb-4 flex items-center gap-3">
                <label className="sr-label" htmlFor="custom-color">
                  Custom color
                </label>
                <input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(event) => applyCustomColor(event.target.value)}
                  className="h-12 w-16 border-2 border-[var(--line)] bg-white"
                />
                <div
                  className="h-12 flex-1 border-2 border-[var(--line)]"
                  style={{ backgroundColor: currentColor }}
                  aria-label="Current color"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
                {palette.map((swatch) => (
                  <button
                    type="button"
                    key={swatch.name}
                    className={`flex min-h-12 items-center gap-2 border-2 border-[var(--line)] bg-white p-2 text-left text-xs font-black ${
                      currentColor.toLowerCase() === swatch.color.toLowerCase()
                        ? "ring-4 ring-[var(--sun)]"
                        : ""
                    }`}
                    onClick={() => applyCustomColor(swatch.color)}
                  >
                    <span
                      className="h-7 w-7 shrink-0 border-2 border-[var(--line)]"
                      style={{ backgroundColor: swatch.color === OFF ? "#202a2e" : swatch.color }}
                    />
                    {swatch.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel min-w-0 p-4">
              <h2 className="mb-3 text-xl font-black">Arduino Settings</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-1 text-sm font-black">
                  Brightness
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={255}
                    value={brightness}
                    onChange={(event) =>
                      setBrightness(Math.max(1, Math.min(255, Number(event.target.value) || 1)))
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm font-black">
                  Data pin
                  <input
                    className="field"
                    type="number"
                    min={0}
                    max={13}
                    value={dataPin}
                    onChange={(event) =>
                      setDataPin(Math.max(0, Math.min(13, Number(event.target.value) || 0)))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="panel min-w-0 p-4">
              <h2 className="mb-3 text-xl font-black">Examples</h2>
              <div className="grid grid-cols-2 gap-3">
                {examples.map((example) => (
                  <button
                    type="button"
                    key={example.name}
                    className="border-2 border-[var(--line)] bg-white p-2 text-left transition hover:bg-[#f2faf7]"
                    onClick={() => loadExample(example)}
                  >
                    <div className="mb-2 grid grid-cols-8 gap-[2px] bg-[#101719] p-1">
                      {example.pixels.flatMap((row, rowIndex) =>
                        row.map((color, colIndex) => (
                          <span
                            key={`${rowIndex}-${colIndex}`}
                            className="aspect-square"
                            style={{ backgroundColor: color === OFF ? "#202a2e" : color }}
                          />
                        ))
                      )}
                    </div>
                    <span className="text-xs font-black">{example.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="panel min-w-0 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Arduino Code</h2>
              <p className="mt-1 text-sm font-bold text-[var(--steel)]">
                Full sketch for {frames.length} frame{frames.length === 1 ? "" : "s"} with a 2
                second delay between frames.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-dark" onClick={copyCode}>
                Copy Code
              </button>
              <button type="button" className="btn btn-primary" onClick={downloadCode}>
                Download .ino
              </button>
            </div>
          </div>

          <pre className="code-block h-[34rem] max-w-full overflow-auto border-2 border-[var(--line)] bg-[#101719] p-4 text-xs leading-relaxed text-[#a8ffbc] sm:text-sm">
            {fullSketch}
          </pre>
        </section>

        {notice && (
          <div className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 border-2 border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-sm font-black text-white shadow-lg">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
