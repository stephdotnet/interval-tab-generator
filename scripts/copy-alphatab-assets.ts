/**
 * Copies the alphaTab font and soundfont into public/ before a build.
 *
 * The alphaTab Vite plugin does the same at build start, but in parallel with Vite copying
 * public/ to dist/: on a fresh checkout (CI) the soundfont can miss the build.
 */
import { cpSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules/@coderline/alphatab/dist')

for (const dir of ['font', 'soundfont']) {
  cpSync(join(source, dir), join(root, 'public', dir), { recursive: true })
}
