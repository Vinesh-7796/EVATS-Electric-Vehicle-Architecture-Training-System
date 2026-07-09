// Generates a Windows multi-resolution .ico from the source app icon.
// Dev-only (sharp + png-to-ico are devDependencies, never shipped).
// Usage: node scripts/build-icon.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Source artwork (light variant, per user choice).
const SOURCE_PNG = resolve(ROOT, '..', 'app icon.png')
// Where the .ico must live for electron-builder.
const OUT_ICO = resolve(ROOT, 'build', 'icon.ico')
// A 512x512 PNG fallback (useful for Linux/macOS later if needed).
const OUT_PNG = resolve(ROOT, 'build', 'icon.png')

const SIZES = [16, 24, 32, 48, 64, 128, 256]

async function main() {
  const srcBuf = readFileSync(SOURCE_PNG)
  const meta = await sharp(srcBuf).metadata()
  console.log(`Source: ${SOURCE_PNG} (${meta.width}x${meta.height} ${meta.format})`)

  // Upscale the small source to every required size with a mild sharpen so
  // edges stay crisp after the 2.5x enlargement (100 -> 256).
  const pngs = []
  for (const size of SIZES) {
    pngs.push(
      sharp(srcBuf)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .sharpen(size >= 128 ? { sigma: 0.6 } : false)
        .png()
        .toBuffer()
    )
  }
  const buffers = await Promise.all(pngs)

  mkdirSync(resolve(ROOT, 'build'), { recursive: true })

  const ico = await pngToIco(buffers)
  writeFileSync(OUT_ICO, ico)
  console.log(`Wrote ${OUT_ICO} (${SIZES.length} sizes: ${SIZES.join(', ')})`)

  // 512x512 PNG (high-res reference; also used by electron-builder as a fallback).
  const bigPng = await sharp(srcBuf)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .sharpen({ sigma: 0.8 })
    .png()
    .toBuffer()
  writeFileSync(OUT_PNG, bigPng)
  console.log(`Wrote ${OUT_PNG} (512x512)`)
}

main().catch(err => {
  console.error('Icon build failed:', err)
  process.exit(1)
})
