"use client"

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { HelpCircle, X } from "lucide-react"
import * as THREE from "three"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type KeyState = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
}

function addBuilding(scene: THREE.Scene, x: number, z: number, width: number, depth: number, height: number, color: number) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.78 })
  const building = new THREE.Mesh(geometry, material)
  building.position.set(x, height / 2, z)
  building.castShadow = true
  building.receiveShadow = true
  scene.add(building)

  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.35, metalness: 0.1 })
  for (let floor = 1; floor < height / 2; floor += 2) {
    for (let offset = -width / 2 + 1.2; offset < width / 2; offset += 2.2) {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.08), windowMaterial)
      pane.position.set(x + offset, floor + 0.8, z + depth / 2 + 0.05)
      scene.add(pane)
    }
  }
}

function addTree(scene: THREE.Scene, x: number, z: number) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x7c4a2d }),
  )
  trunk.position.set(x, 0.55, z)
  trunk.castShadow = true
  scene.add(trunk)

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x28734a, roughness: 0.9 }),
  )
  crown.position.set(x, 1.65, z)
  crown.castShadow = true
  scene.add(crown)
}

function addLabel(scene: THREE.Scene, text: string, x: number, y: number, z: number) {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (!context) return
  context.fillStyle = "rgba(255,255,255,0.92)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "#0f172a"
  context.font = "600 42px sans-serif"
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(x, y, z)
  sprite.scale.set(4, 1, 1)
  scene.add(sprite)
}

export function CampusGame() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const keysRef = useRef<KeyState>({ forward: false, backward: false, left: false, right: false })
  const startedRef = useRef(false)
  const mobileRef = useRef(false)
  const gameOverRef = useRef(false)
  const yawRef = useRef(0)
  const [zone, setZone] = useState("正門プロムナード")
  const [started, setStarted] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [hunger, setHunger] = useState(100)
  const [eventMinute, setEventMinute] = useState(0)
  const [nearbyFood, setNearbyFood] = useState<string | null>(null)
  const [gameOver, setGameOver] = useState(false)

  const formatEventTime = (minute: number) => {
    const total = 10 * 60 + Math.min(minute, 8 * 60)
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
  }

  useEffect(() => {
    startedRef.current = started
  }, [started])

  useEffect(() => {
    gameOverRef.current = gameOver
  }, [gameOver])

  useEffect(() => {
    if (!started || gameOver) return
    const timer = window.setInterval(() => {
      setEventMinute((prev) => Math.min(prev + 1, 8 * 60))
      setHunger((prev) => {
        const next = Math.max(0, prev - 2)
        if (next === 0) setGameOver(true)
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [gameOver, started])

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)")
    const updateMobile = () => {
      mobileRef.current = coarsePointer.matches
      setMobile(coarsePointer.matches)
    }
    updateMobile()
    coarsePointer.addEventListener("change", updateMobile)
    return () => coarsePointer.removeEventListener("change", updateMobile)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeff6ff)
    scene.fog = new THREE.Fog(0xeff6ff, 30, 85)

    const camera = new THREE.PerspectiveCamera(67, container.clientWidth / container.clientHeight, 0.1, 140)
    camera.position.set(0, 1.8, 18)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.7))
    const sun = new THREE.DirectionalLight(0xffffff, 2.4)
    sun.position.set(-12, 26, 18)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    scene.add(sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0xdfe7d3, roughness: 0.95 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xc8c4ba, roughness: 0.85 })
    const mainPath = new THREE.Mesh(new THREE.BoxGeometry(7, 0.04, 76), pathMaterial)
    mainPath.position.set(0, 0.03, 0)
    mainPath.receiveShadow = true
    scene.add(mainPath)
    const crossPath = new THREE.Mesh(new THREE.BoxGeometry(58, 0.05, 5), pathMaterial)
    crossPath.position.set(0, 0.04, -4)
    crossPath.receiveShadow = true
    scene.add(crossPath)

    addBuilding(scene, -14, -6, 12, 11, 10, 0xb75f45)
    addBuilding(scene, 14, -7, 13, 10, 12, 0xc06a4f)
    addBuilding(scene, -18, 14, 13, 9, 8, 0xd7c8aa)
    addBuilding(scene, 16, 15, 15, 9, 7, 0xb8bdc6)
    addBuilding(scene, 0, -29, 16, 5, 5, 0x3f3f46)
    addLabel(scene, "IZUMI GATE", 0, 4.2, -31.8)
    addLabel(scene, "図書館棟", -18, 9, 19.2)
    addLabel(scene, "学生広場", 0, 3.2, -4)

    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.08, 48),
      new THREE.MeshStandardMaterial({ color: 0xd6d3cc, roughness: 0.86 }),
    )
    plaza.position.set(0, 0.07, -4)
    plaza.receiveShadow = true
    scene.add(plaza)

    const field = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x549563, roughness: 0.9 }),
    )
    field.position.set(23, 0.06, 29)
    field.receiveShadow = true
    scene.add(field)
    addLabel(scene, "多目的フィールド", 23, 2.6, 23)

    const foodStalls = [
      { name: "北町フードクラブ", x: -7, z: -12 },
      { name: "焼きそば模擬店", x: 9, z: -12 },
      { name: "クレープ屋台", x: 12, z: 2 },
    ]
    const stallMaterial = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.72 })
    const awningMaterial = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 })
    for (const stall of foodStalls) {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 2.2), stallMaterial)
      counter.position.set(stall.x, 0.7, stall.z)
      counter.castShadow = true
      scene.add(counter)
      const awning = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 2.6), awningMaterial)
      awning.position.set(stall.x, 1.65, stall.z)
      awning.castShadow = true
      scene.add(awning)
      addLabel(scene, stall.name, stall.x, 2.8, stall.z)
    }

    for (let index = 0; index < 15; index += 1) {
      addTree(scene, -5.5, -28 + index * 4)
      addTree(scene, 5.5, -27 + index * 4)
    }
    for (let index = 0; index < 18; index += 1) {
      addTree(scene, -31 + index * 3.5, 28)
    }

    const onKey = (event: KeyboardEvent, pressed: boolean) => {
      if (event.key.toLowerCase() === "w") keysRef.current.forward = pressed
      if (event.key.toLowerCase() === "s") keysRef.current.backward = pressed
      if (event.key.toLowerCase() === "a") keysRef.current.left = pressed
      if (event.key.toLowerCase() === "d") keysRef.current.right = pressed
    }
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    const startGame = () => {
      setStarted(true)
    }
    renderer.domElement.addEventListener("click", startGame)
    const onKeyDown = (event: KeyboardEvent) => onKey(event, true)
    const onKeyUp = (event: KeyboardEvent) => onKey(event, false)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("resize", onResize)

    const clock = new THREE.Clock()
    let frame = 0
    let animationId = 0
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05)
      const direction = new THREE.Vector3(Math.sin(yawRef.current), 0, Math.cos(yawRef.current))
      const speed = 9 * delta
      const turnSpeed = 2.4 * delta
      const keys = keysRef.current
      if (startedRef.current && !gameOverRef.current) {
        if (keys.left) yawRef.current += turnSpeed
        if (keys.right) yawRef.current -= turnSpeed
        if (keys.forward) camera.position.addScaledVector(direction, -speed)
        if (keys.backward) camera.position.addScaledVector(direction, speed)
      }
      camera.position.x = Math.max(-40, Math.min(40, camera.position.x))
      camera.position.z = Math.max(-38, Math.min(38, camera.position.z))
      camera.position.y = 1.8
      camera.rotation.order = "YXZ"
      camera.rotation.y = yawRef.current
      camera.rotation.x = -0.08

      frame += 1
      if (frame % 24 === 0) {
        const { x, z } = camera.position
        if (z < -20) setZone("正門プロムナード")
        else if (Math.abs(x) < 9 && z < 4) setZone("学生広場")
        else if (x < -10 && z > 7) setZone("図書館前")
        else if (x > 13 && z > 18) setZone("多目的フィールド")
        else setZone("講義棟エリア")
        const food = foodStalls.find((stall) => Math.hypot(stall.x - x, stall.z - z) < 5)
        setNearbyFood(food?.name ?? null)
      }

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("resize", onResize)
      renderer.domElement.removeEventListener("click", startGame)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    keysRef.current = {
      forward: y < -16,
      backward: y > 16,
      left: x < -16,
      right: x > 16,
    }
  }

  const resetJoystick = () => {
    keysRef.current = { forward: false, backward: false, left: false, right: false }
  }

  const startFromHud = () => {
    setHelpOpen(false)
    setStarted(true)
  }

  const eatFood = () => {
    setHunger((prev) => Math.min(100, prev + 38))
  }

  const restart = () => {
    setHunger(100)
    setEventMinute(0)
    setGameOver(false)
    setNearbyFood(null)
    setStarted(true)
    setHelpOpen(false)
  }

  return (
    <div className="relative h-[calc(100svh-4rem)] overflow-hidden bg-slate-100">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
        <Badge variant="secondary" className="bg-background/90 shadow-sm">
          {zone}
        </Badge>
        <Badge variant="secondary" className="bg-background/90 shadow-sm">
          {formatEventTime(eventMinute)}
        </Badge>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 w-44 rounded-lg border bg-background/90 p-3 text-xs shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted-foreground">空腹</span>
          <span className="font-medium">{hunger}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${hunger}%` }} />
        </div>
      </div>
      {nearbyFood && started && !gameOver ? (
        <div className="absolute bottom-20 left-1/2 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg border bg-background/95 p-3 text-sm shadow-lg">
          <div className="font-medium">{nearbyFood}</div>
          <div className="mt-1 text-xs text-muted-foreground">ご飯を買って食べると空腹ゲージが回復します。</div>
          <Button type="button" className="mt-3 w-full" onClick={eatFood}>
            食べる
          </Button>
        </div>
      ) : null}
      {mobile && started ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="移動ジョイスティック"
          className="absolute bottom-5 left-5 grid size-28 touch-none place-items-center rounded-full border bg-background/70 shadow-sm backdrop-blur"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            updateJoystick(event)
          }}
          onPointerMove={updateJoystick}
          onPointerUp={resetJoystick}
          onPointerCancel={resetJoystick}
        >
          <div className="size-10 rounded-full bg-foreground/25" />
        </div>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 bg-background/90 shadow-sm"
        onClick={() => setHelpOpen(true)}
        aria-label="操作ヘルプ"
      >
        <HelpCircle className="size-4" />
      </Button>
      {(!started || helpOpen) ? (
        <div className="absolute inset-0 grid place-items-center bg-black/35 p-4 backdrop-blur-sm" onClick={startFromHud}>
          <div className="w-full max-w-sm rounded-lg border bg-background p-4 text-sm shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">操作方法</h2>
              {started ? (
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setHelpOpen(false)} aria-label="ヘルプを閉じる">
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
            {mobile ? (
              <div className="mt-3 grid gap-2 text-muted-foreground">
                <p>左下のジョイスティックで移動します。</p>
                <p>画面をタッチするとゲームを開始します。</p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 text-muted-foreground">
                <p>クリックでゲームを開始し、WASDで移動と方向転換を行います。</p>
                <div className="grid w-28 grid-cols-3 gap-1 text-foreground">
                  <span />
                  <kbd className="rounded border bg-muted px-2 py-1 text-center font-mono">W</kbd>
                  <span />
                  <kbd className="rounded border bg-muted px-2 py-1 text-center font-mono">A</kbd>
                  <kbd className="rounded border bg-muted px-2 py-1 text-center font-mono">S</kbd>
                  <kbd className="rounded border bg-muted px-2 py-1 text-center font-mono">D</kbd>
                </div>
              </div>
            )}
            {!started ? (
              <Button type="button" className="mt-4 w-full" onClick={startFromHud}>
                開始
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {gameOver ? (
        <div className="absolute inset-0 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border bg-background p-4 text-center shadow-lg">
            <h2 className="text-xl font-semibold">ゲームオーバー</h2>
            <p className="mt-2 text-sm text-muted-foreground">お腹が減りすぎました。模擬店で食べ物を補給しながら18:00まで歩き回ってください。</p>
            <Button type="button" className="mt-4 w-full" onClick={restart}>
              もう一度
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
