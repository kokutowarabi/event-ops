"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, RefreshCcw, RotateCcw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [mobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(pointer: coarse) and (max-width: 820px)").matches : false,
  )
  const [photo, setPhoto] = useState<string | null>(null)
  const [filter, setFilter] = useState("none")
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startCamera = async (mode = facingMode) => {
    if (!navigator.mediaDevices?.getUserMedia) return
    stopCamera()
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false })
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
  }

  const switchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(nextMode)
    startCamera(nextMode).catch(() => undefined)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext("2d")
    if (!context) return
    context.filter = filter
    context.drawImage(video, 0, 0)
    setPhoto(canvas.toDataURL("image/png"))
  }

  if (!mobile) {
    return (
      <div className="flex h-[calc(100svh-5.5rem)] items-center justify-center p-4">
        <div className="max-w-sm rounded-lg border bg-card p-5 text-center">
          <Smartphone className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-semibold">スマホで利用してください</h1>
          <p className="mt-2 text-sm text-muted-foreground">この撮影機能はスマホのブラウザからのみ利用できます。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100svh-4rem)] overflow-hidden bg-black text-white">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" style={{ filter }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo} alt="撮影した写真" className="absolute right-3 top-3 h-28 w-20 rounded border object-cover" /> : null}
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/45 p-4 backdrop-blur">
        <div className="mb-3 flex justify-center gap-2">
          {[
            ["none", "標準"],
            ["contrast(1.25) saturate(1.25)", "鮮やか"],
            ["grayscale(1)", "白黒"],
            ["sepia(.75)", "レトロ"],
          ].map(([value, label]) => (
            <Button key={value} type="button" size="sm" variant={filter === value ? "secondary" : "ghost"} onClick={() => setFilter(value)}>
              {label}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-5">
          <Button type="button" variant="secondary" size="icon" onClick={() => startCamera()}>
            <RotateCcw className="size-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={switchCamera} aria-label="内外カメラを切り替え">
            <RefreshCcw className="size-4" />
          </Button>
          <button type="button" onClick={capture} className="grid size-16 place-items-center rounded-full border-4 border-white bg-white/20">
            <Camera className="size-7" />
          </button>
        </div>
      </div>
    </div>
  )
}
