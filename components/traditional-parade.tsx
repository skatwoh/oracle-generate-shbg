"use client"

import { useEffect, useState } from "react"

interface ParadeElement {
  id: number
  emoji: string
  x: number
  y: number
  speed: number
}

export default function TraditionalParade() {
  const [parade, setParade] = useState<ParadeElement[]>([])

  useEffect(() => {
    const elements = ["🎭", "👶", "👧", "🥮", "🏮", "🎊", "🎉"]
    const newParade: ParadeElement[] = []

    for (let i = 0; i < 15; i++) {
      newParade.push({
        id: i,
        emoji: elements[Math.floor(Math.random() * elements.length)],
        x: -10 - i * 15,
        y: 80 + Math.random() * 10,
        speed: Math.random() * 2 + 1,
      })
    }

    setParade(newParade)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-5">
      {parade.map((element) => (
        <div
          key={element.id}
          className="absolute text-5xl parade-march opacity-50"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            animationDelay: `${element.id * 0.3}s`,
            animationDuration: `${8 + element.speed}s`,
          }}
        >
          {element.emoji}
        </div>
      ))}
    </div>
  )
}
