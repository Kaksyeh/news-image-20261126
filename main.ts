// A news-image entry (Node 22, standard library only): its image is the
// entry.png beside this file, and the program copies it to /output/entry.png.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const src = join(dirname(fileURLToPath(import.meta.url)), "entry.png");
const dest = join(outDir, "entry.png");

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

// The output directory may not exist yet — create it, then copy.
mkdirSync(outDir, { recursive: true });
copyFileSync(src, dest);

// Verify the output before exiting: it must exist, fit the 1 MiB cap,
// be byte-identical to the source image, and be a whole file (PNG
// signature + IEND, or JPEG SOI + EOI).
if (!existsSync(dest)) fail("entry.png was not written");
if (statSync(dest).size > 1048576) fail("entry.png is over 1,048,576 bytes");
const written = readFileSync(dest);
const source = readFileSync(src);
if (!written.equals(source)) fail("entry.png differs from the source image");
const isPng =
  written.length >= 20 &&
  written.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
  written.subarray(written.length - 12).equals(
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]),
  );
const isJpeg =
  written.length >= 4 &&
  written[0] === 0xff && written[1] === 0xd8 &&
  written[written.length - 2] === 0xff && written[written.length - 1] === 0xd9;
if (!isPng && !isJpeg) fail("entry.png is neither a whole PNG nor a whole JPEG");
console.log(`wrote ${dest} (${written.length} bytes, ${isPng ? "PNG" : "JPEG"})`);
