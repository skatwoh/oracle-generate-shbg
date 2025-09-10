"use client"

import { useEffect, useState } from "react"

export default function PetRunner() {
  const [position, setPosition] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = phải, -1 = trái
  const speed = 2

  useEffect(() => {
    const move = () => {
      setPosition((prev) => {
        let next = prev + speed * direction
        if (next > window.innerWidth - 80) {
          setDirection(-1)
          next = window.innerWidth - 80
        } else if (next < 0) {
          setDirection(1)
          next = 0
        }
        return next
      })
    }
    const interval = setInterval(move, 20)
    return () => clearInterval(interval)
  }, [direction])

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: position,
        fontSize: "50px",
        transform: direction === -1 ? "scaleX(-1)" : "scaleX(1)",
        transition: "transform 0.3s",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      🐕 🐕 🐕
    </div>
  )
}
