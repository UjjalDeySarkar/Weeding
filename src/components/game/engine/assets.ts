import {
  AnimationClip,
  Box3,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  SkinnedMesh,
  Vector3,
  type Material,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'

interface Spec {
  /** Turn about Y so the model faces +Z */
  yaw?: number
  /** Scale so the model measures this many metres along an axis (after turning) */
  fit: ['x' | 'y' | 'z', number]
  /** Or stretch it to exactly this width, height and length in metres */
  size?: [number, number, number]
  /** Meshes to leave out, by name */
  drop?: RegExp
}

// Sizes are in metres. Orientations were checked against each model (see models.json for sources).
const SPECS = {
  plane: { fit: ['z', 34] },
  // The wagon keeps the front's scale: 11.2 vs 12.2 model units long
  'train-front': { yaw: Math.PI / 2, fit: ['z', 22] },
  'train-wagon': { yaw: Math.PI / 2, fit: ['z', 20.2] },
  // Modelled at an angle, facing backwards, and as wide as it is tall: stretched to a real bus
  bus: { yaw: 0.449 + Math.PI, fit: ['z', 11], size: [2.7, 3.3, 10.5] },
  motorbike: { yaw: Math.PI, fit: ['z', 2.1] },
  man: { fit: ['y', 1.75] },
  woman: { fit: ['y', 1.66] },
  truck: { fit: ['z', 7.5] },
  car: { fit: ['z', 4.3] },
  taxi: { fit: ['z', 4.4] },
  toto: { yaw: Math.PI / 2, fit: ['z', 2.9] },
  crow: { fit: ['x', 3.2] },
  // The kite's string runs off for kilometres
  kite: { drop: /^Line/, fit: ['y', 3.4] },
  cloud: { fit: ['x', 70] },
  palm: { fit: ['y', 8] },
  bush: { fit: ['y', 1.4] },
  'building-small': { fit: ['y', 7] },
  'building-large': { fit: ['y', 17] },
  'building-shop': { fit: ['y', 11] },
  streetlight: { fit: ['y', 7] },
  mountains: { fit: ['x', 2600] },
} satisfies Record<string, Spec>

export type ModelId = keyof typeof SPECS

export interface Model {
  /** Facing +Z, standing on the origin, in metres. Never added to a scene: clone it with `spawn`. */
  root: Group
  clips: AnimationClip[]
}

export type Models = Map<ModelId, Model>

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const cache = new Map<ModelId, Promise<Model>>()

/** Lambert shading is plenty for flat low-poly models and cheaper on phones */
function toLambert(material: Material): Material {
  if (!(material instanceof MeshStandardMaterial)) return material
  const lambert = new MeshLambertMaterial({
    name: material.name,
    color: material.color,
    map: material.map,
    vertexColors: material.vertexColors,
    transparent: material.transparent,
    opacity: material.opacity,
    alphaTest: material.alphaTest,
    side: material.side,
    emissive: material.emissive,
    emissiveMap: material.emissiveMap,
  })
  material.dispose()
  return lambert
}

function prepare(id: ModelId, scene: Group, clips: AnimationClip[]): Model {
  const spec: Spec = SPECS[id]
  if (spec.drop) {
    const dropped: Object3D[] = []
    scene.traverse((node) => spec.drop!.test(node.name) && dropped.push(node))
    for (const node of dropped) node.removeFromParent()
  }
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return
    node.material = Array.isArray(node.material) ? node.material.map(toLambert) : toLambert(node.material)
    // Copies share these; `disposeTree` leaves them alone and `releaseModels` frees them
    node.geometry.userData.shared = true
    for (const material of [node.material].flat()) material.userData.shared = true
  })

  // root → fit (scale + offset) → turn (yaw) → the glTF scene
  const turn = new Group()
  turn.rotation.y = spec.yaw ?? 0
  turn.add(scene)
  const fit = new Group()
  fit.add(turn)
  const root = new Group()
  root.name = id
  root.add(fit)
  root.updateMatrixWorld(true)

  const box = new Box3().setFromObject(root, true)
  const size = box.getSize(new Vector3())
  const [axis, metres] = spec.fit
  if (spec.size) fit.scale.set(spec.size[0] / size.x, spec.size[1] / size.y, spec.size[2] / size.z)
  else fit.scale.setScalar(metres / size[axis])
  const k = fit.scale
  fit.position.set((-(box.min.x + box.max.x) / 2) * k.x, -box.min.y * k.y, (-(box.min.z + box.max.z) / 2) * k.z)
  root.updateMatrixWorld(true)
  return { root, clips }
}

const url = (id: ModelId) => `${import.meta.env.BASE_URL}game/models/${id}.glb`

export function loadModel(id: ModelId): Promise<Model> {
  let model = cache.get(id)
  if (!model) {
    model = loader.loadAsync(url(id)).then((gltf) => prepare(id, gltf.scene, gltf.animations))
    // A failed download can be retried on the next attempt
    model.catch(() => cache.delete(id))
    cache.set(id, model)
  }
  return model
}

export async function loadModels(ids: ModelId[], onProgress?: (done: number, total: number) => void): Promise<Models> {
  const unique = [...new Set(ids)]
  let done = 0
  const loaded = await Promise.all(
    unique.map((id) =>
      loadModel(id).then((model) => {
        onProgress?.(++done, unique.length)
        return [id, model] as const
      }),
    ),
  )
  return new Map(loaded)
}

/** Frees every loaded model; the next game downloads them again (from the browser cache) */
export function releaseModels() {
  for (const model of cache.values()) {
    model
      .then(({ root }) =>
        root.traverse((node) => {
          if (!(node instanceof Mesh)) return
          node.geometry.dispose()
          for (const material of [node.material].flat()) {
            ;(material as MeshLambertMaterial).map?.dispose()
            material.dispose()
          }
        }),
      )
      .catch(() => {})
  }
  cache.clear()
}

/** A copy for the scene, sharing geometry and materials (characters get their own skeleton) */
export function spawn(model: Model): Group {
  let skinned = false
  model.root.traverse((node) => (skinned ||= node instanceof SkinnedMesh))
  return (skinned ? cloneSkinned(model.root) : model.root.clone()) as Group
}

const own = (material: Material) => {
  const copy = material.clone()
  copy.userData.shared = false
  return copy
}

/** Gives a copy its own materials so they can be recoloured without touching other copies */
export function ownMaterials(object: Object3D) {
  object.traverse((node) => {
    if (node instanceof Mesh) node.material = Array.isArray(node.material) ? node.material.map(own) : own(node.material)
  })
}

/** Frees what a leg built itself; geometry and materials shared with the loaded models stay */
export function disposeTree(root: Object3D) {
  root.traverse((node) => {
    if (node instanceof InstancedMesh) node.dispose()
    if (!(node instanceof Mesh)) return
    if (!node.geometry.userData.shared) node.geometry.dispose()
    for (const material of [node.material].flat()) {
      if (material.userData.shared) continue
      ;(material as MeshLambertMaterial).map?.dispose()
      material.dispose()
    }
  })
  root.removeFromParent()
}

const tmp = new Matrix4()

/** Many copies of a static model in one draw call per mesh. Instances culled as one, so keep each group local. */
export function instances(model: Model, transforms: Matrix4[]): Group {
  const group = new Group()
  if (!transforms.length) return group
  model.root.traverse((node) => {
    if (!(node instanceof Mesh) || node instanceof SkinnedMesh) return
    const mesh = new InstancedMesh(node.geometry, node.material, transforms.length)
    transforms.forEach((transform, i) => mesh.setMatrixAt(i, tmp.multiplyMatrices(transform, node.matrixWorld)))
    mesh.computeBoundingSphere()
    group.add(mesh)
  })
  return group
}
