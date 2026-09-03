import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A sparse 3D graph of nodes and connecting edges standing in for the
 * "threat network" — a handful of nodes glow red to suggest live signals.
 * Rotates slowly and drifts with the pointer. Conceptually: this is the
 * raw environment SAOM AI watches, before it draws attention to anything.
 */
function Graph({ pointer }) {
  const group = useRef(null)
  const count = 90

  const { positions, edges, threatIdx } = useMemo(() => {
    const pts = []
    for (let i = 0; i < count; i++) {
      const r = 5.5 + Math.random() * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      pts.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi)
        )
      )
    }
    const edgeList = []
    for (let i = 0; i < pts.length; i++) {
      let nearest = null
      let nearestD = Infinity
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue
        const d = pts[i].distanceTo(pts[j])
        if (d < nearestD) {
          nearestD = d
          nearest = j
        }
      }
      if (nearest !== null && Math.random() > 0.5) edgeList.push([i, nearest])
    }
    const threat = new Set()
    while (threat.size < 5) threat.add(Math.floor(Math.random() * count))
    return { positions: pts, edges: edgeList, threatIdx: threat }
  }, [])

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const arr = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      arr[i * 6] = positions[a].x
      arr[i * 6 + 1] = positions[a].y
      arr[i * 6 + 2] = positions[a].z
      arr[i * 6 + 3] = positions[b].x
      arr[i * 6 + 4] = positions[b].y
      arr[i * 6 + 5] = positions[b].z
    })
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [edges, positions])

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.045
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.current.y * 0.15, 0.04)
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -pointer.current.x * 0.08, 0.04)
  })

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#0a0a0a" transparent opacity={0.14} />
      </lineSegments>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[threatIdx.has(i) ? 0.075 : 0.045, 12, 12]} />
          <meshBasicMaterial color={threatIdx.has(i) ? '#e4002b' : '#0a0a0a'} transparent opacity={threatIdx.has(i) ? 0.95 : 0.55} />
        </mesh>
      ))}
    </group>
  )
}

export default function NetworkField({ className = '' }) {
  const pointer = useRef({ x: 0, y: 0 })

  function handlePointerMove(e) {
    const { innerWidth, innerHeight } = window
    pointer.current = {
      x: (e.clientX / innerWidth) * 2 - 1,
      y: (e.clientY / innerHeight) * 2 - 1,
    }
  }

  return (
    <div className={className} onPointerMove={handlePointerMove} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 11], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Graph pointer={pointer} />
      </Canvas>
    </div>
  )
}
