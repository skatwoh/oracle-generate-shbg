"use client"

import { useEffect, useState } from "react"

interface Lantern {
  id: number
  x: number
  y: number
  size: number
  speed: number
  color: string
}

export default function FloatingLanterns() {
  const [lanterns, setLanterns] = useState<Lantern[]>([])

  useEffect(() => {
    const colors = ["#dc2626", "#f59e0b", "#fbbf24", "#ef4444"]
    const newLanterns: Lantern[] = []

    for (let i = 0; i < 8; i++) {
      newLanterns.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 20,
        speed: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    setLanterns(newLanterns)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {lanterns.map((lantern) => (
        <div
          key={lantern.id}
          className="absolute lantern-float opacity-20"
          style={{
            left: `${lantern.x}%`,
            top: `${lantern.y}%`,
            animationDelay: `${lantern.id * 0.5}s`,
            animationDuration: `${3 + lantern.speed}s`,
          }}
        >
          <div
            className="rounded-full moon-glow"
            style={{
              width: `${lantern.size}px`,
              height: `${lantern.size}px`,
              backgroundColor: lantern.color,
              boxShadow: `0 0 ${lantern.size}px ${lantern.color}40`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
