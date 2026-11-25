// Downloads the game's 3D models listed in src/components/game/models.json (free CC0 / CC BY models
// from Poly Pizza) and optimizes them for the web into public/game/models/<id>.glb:
// duplicate data removed, vertices welded and quantized, meshes compressed with meshopt
// (three.js decodes it with the MeshoptDecoder that ships in three/addons).
// Usage: npm run models
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const GLTF_TRANSFORM = '@gltf-transform/cli@4.5.1'
const root = path.resolve(import.meta.dirname, '..')
const { models } = JSON.parse(readFileSync(path.join(root, 'src/components/game/models.json'), 'utf8'))
const outDir = path.join(root, 'public/game/models')
const only = new Set(process.argv.slice(2))
const work = mkdtempSync(path.join(tmpdir(), 'game-models-'))
mkdirSync(outDir, { recursive: true })

const kb = (file) => `${Math.round(statSync(file).size / 1024)} KB`

try {
  for (const model of models) {
    if (only.size && !only.has(model.id)) continue
    const response = await fetch(model.url)
    if (!response.ok) throw new Error(`${model.id}: ${model.url} answered ${response.status}`)
    const raw = path.join(work, `${model.id}.glb`)
    const out = path.join(outDir, `${model.id}.glb`)
    writeFileSync(raw, Buffer.from(await response.arrayBuffer()))
    // No mesh simplification: the models are already low-poly, and characters must keep their skinning
    execFileSync(
      'npx',
      ['--yes', GLTF_TRANSFORM, 'optimize', raw, out, '--compress', 'meshopt', '--simplify', 'false', '--texture-compress', 'webp', '--texture-size', '512'],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    )
    console.log(`${model.id.padEnd(15)} ${kb(raw).padStart(7)} → ${kb(out).padStart(7)}   ${model.name} · ${model.author} · ${model.license}`)
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
