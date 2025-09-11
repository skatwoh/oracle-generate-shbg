"use client"

export default function MoonBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Main moon */}
      <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 moon-glow opacity-30 moon-rise" />

      {/* Smaller decorative moons */}
      <div
        className="absolute top-32 left-20 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-orange-200 moon-glow opacity-20"
        style={{ animationDelay: "0.5s" }}
      />

      <div
        className="absolute bottom-20 right-32 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 moon-glow opacity-25"
        style={{ animationDelay: "1s" }}
      />

      {/* Sparkles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full sparkle opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}
