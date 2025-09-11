"use client"

import { useEffect, useState } from "react"

interface Firework {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
}

export default function Fireworks() {
  const [fireworks, setFireworks] = useState<Firework[]>([])

  useEffect(() => {
    const colors = ["🎆", "🎇", "✨", "💥"]
    const newFireworks: Firework[] = []

    for (let i = 0; i < 12; i++) {
      newFireworks.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 80,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
      })
    }

    setFireworks(newFireworks)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-5">
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute text-4xl firework-burst opacity-40"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            animationDelay: `${firework.delay}s`,
            fontSize: `${firework.size * 2}rem`,
          }}
        >
          {firework.color}
        </div>
      ))}
    </div>
  )
}
