/**
 * Web copies for the giant files only (site, datacenter, telecom).
 * Geometry stays Draco. Textures are not resized — WebP only above 4096px
 * so grass and sidewalks are not crushed. Smaller GLBs are loaded as originals.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, draco, prune, textureCompress } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const models = path.join(root, 'public', 'models')
const outDir = path.join(models, 'web')
fs.mkdirSync(outDir, { recursive: true })

const files = [
  'carport.glb',
  'datacenter-exterior.glb',
  'reseau.glb',
  'noc.glb',
  'solar.glb',
  'telecom.glb',
  'site.glb',
  'datacenter.glb',
]

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })

for (const file of files) {
  const input = path.join(models, file)
  const output = path.join(outDir, file)
  if (!fs.existsSync(input)) {
    console.log('skip missing', file)
    continue
  }
  if (fs.existsSync(output) && fs.statSync(output).size > 1024) {
    console.log('fresh', file)
    continue
  }
  console.log('read', file)
  const document = await io.read(input)
  await document.transform(
    dedup(),
    prune(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      quality: 96,
      resize: [4096, 4096],
    }),
    draco({
      method: 'edgebreaker',
      encodeSpeed: 5,
      decodeSpeed: 5,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    }),
  )
  await io.write(output, document)
  const before = fs.statSync(input).size
  const after = fs.statSync(output).size
  console.log(`${file}: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`)
}
