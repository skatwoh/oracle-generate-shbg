"use client"

import { useEffect, useState } from "react"

interface LionDancer {
  id: number
  x: number
  y: number
  direction: number
  speed: number
}

export default function LionDance() {
  const [lions, setLions] = useState<LionDancer[]>([])

  useEffect(() => {
    const newLions: LionDancer[] = []

    for (let i = 0; i < 3; i++) {
      newLions.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 2 + 1,
      })
    }

    setLions(newLions)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-5">
      {lions.map((lion) => (
        <div
          key={lion.id}
          className="absolute text-6xl opacity-30 lion-dance"
          style={{
            left: `${lion.x}%`,
            top: `${lion.y}%`,
            animationDelay: `${lion.id * 1.5}s`,
            animationDuration: `${4 + lion.speed}s`,
            transform: `scaleX(${lion.direction})`,
          }}
        >
          🦁
        </div>
      ))}
    </div>
  )
}
