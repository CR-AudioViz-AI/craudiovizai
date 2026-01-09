'use client'

import { useState, useEffect } from 'react'

export default function CRRotatingBar() {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // Rotate every 3 seconds
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 25)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Every 25th rotation, show "Cindy & Roy"
  const showFullNames = rotation === 0

  return (
    <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-500 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-10 flex items-center justify-center">
          <div className="flex items-center space-x-2 animate-pulse">
            {showFullNames ? (
              // Every 25th rotation: Show full names
              <div className="flex items-center space-x-3 font-bold text-lg">
                <span className="text-cyan-500">Cindy</span>
                <span className="text-2xl">💕</span>
                <span className="text-blue-200">Roy</span>
              </div>
            ) : (
              // Regular rotations: Show C = R pattern
              <div className="flex items-center space-x-4 text-base font-medium tracking-wider">
                <span className="text-cyan-500">C</span>
                <span className="text-white/60">=</span>
                <span className="text-blue-200">R</span>
                <span className="text-white/60">=</span>
                <span className="text-cyan-500">C</span>
                <span className="text-white/60">=</span>
                <span className="text-blue-200">R</span>
                <span className="text-white/60">=</span>
                <span className="text-cyan-500">C</span>
                <span className="text-white/60">=</span>
                <span className="text-blue-200">R</span>
                <span className="text-white/60">=</span>
                <span className="text-cyan-500">C</span>
                <span className="text-white/60">=</span>
                <span className="text-blue-200">R</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
