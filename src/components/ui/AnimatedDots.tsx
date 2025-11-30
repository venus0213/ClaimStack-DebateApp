'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'

interface Dot {
  id: number
  size: number
  left: number
  top: number
  duration: number
  delay: number
  direction: 'up' | 'down' | 'left' | 'right' | 'diagonal'
  color: string
  shadowColor: string
}

export function AnimatedDots() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate random colors
  const generateRandomColor = () => {
    const colors = [
      // Blues
      { primary: 'rgb(59, 130, 246)', secondary: 'rgb(37, 99, 235)', shadow: 'rgba(59, 130, 246, 0.5)' },
      { primary: 'rgb(96, 165, 250)', secondary: 'rgb(59, 130, 246)', shadow: 'rgba(96, 165, 250, 0.5)' },
      { primary: 'rgb(37, 99, 235)', secondary: 'rgb(29, 78, 216)', shadow: 'rgba(37, 99, 235, 0.5)' },
      // Purples
      { primary: 'rgb(147, 51, 234)', secondary: 'rgb(126, 34, 206)', shadow: 'rgba(147, 51, 234, 0.5)' },
      { primary: 'rgb(168, 85, 247)', secondary: 'rgb(147, 51, 234)', shadow: 'rgba(168, 85, 247, 0.5)' },
      // Cyans
      { primary: 'rgb(34, 211, 238)', secondary: 'rgb(6, 182, 212)', shadow: 'rgba(34, 211, 238, 0.5)' },
      { primary: 'rgb(56, 189, 248)', secondary: 'rgb(34, 211, 238)', shadow: 'rgba(56, 189, 248, 0.5)' },
      // Indigos
      { primary: 'rgb(99, 102, 241)', secondary: 'rgb(79, 70, 229)', shadow: 'rgba(99, 102, 241, 0.5)' },
      { primary: 'rgb(129, 140, 248)', secondary: 'rgb(99, 102, 241)', shadow: 'rgba(129, 140, 248, 0.5)' },
      // Teals
      { primary: 'rgb(20, 184, 166)', secondary: 'rgb(15, 118, 110)', shadow: 'rgba(20, 184, 166, 0.5)' },
      { primary: 'rgb(45, 212, 191)', secondary: 'rgb(20, 184, 166)', shadow: 'rgba(45, 212, 191, 0.5)' },
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Generate dots with random positions and properties
  const dots = useMemo<Dot[]>(() => {
    const dotCount = 70 // Number of dots
    return Array.from({ length: dotCount }, (_, i) => {
      const directions: Dot['direction'][] = ['up', 'down', 'left', 'right', 'diagonal']
      const colorSet = generateRandomColor()
      return {
        id: i,
        size: Math.random() * 3 + 3, // Size between 3-6px
        left: Math.random() * 100, // Random horizontal position
        top: Math.random() * 100, // Random vertical position
        duration: Math.random() * 12 + 8, // Animation duration 8-20s (faster)
        delay: Math.random() * 5, // Random delay 0-5s
        direction: directions[Math.floor(Math.random() * directions.length)],
        color: `radial-gradient(circle, ${colorSet.primary} 0%, ${colorSet.secondary} 100%)`,
        shadowColor: colorSet.shadow,
      }
    })
  }, [])

  // Track mouse movement globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    // Use document-level listener to track mouse anywhere on page
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const getAnimationClass = (direction: Dot['direction']) => {
    switch (direction) {
      case 'up':
        return 'animate-float-up'
      case 'down':
        return 'animate-float-down'
      case 'left':
        return 'animate-float-left'
      case 'right':
        return 'animate-float-right'
      case 'diagonal':
        return 'animate-float-diagonal'
      default:
        return 'animate-float-up'
    }
  }

  // Calculate mouse interaction for each dot
  const getMouseEffect = (dot: Dot, containerWidth: number, containerHeight: number) => {
    if (!containerRef.current) return { x: 0, y: 0, scale: 1, opacity: 1 }

    const dotX = (dot.left / 100) * containerWidth
    const dotY = (dot.top / 100) * containerHeight
    const dx = mousePosition.x - dotX
    const dy = mousePosition.y - dotY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 150 // Maximum interaction distance
    const minDistance = 30 // Minimum distance for full effect

    if (distance < maxDistance && distance > 0) {
      const force = Math.max(0, (maxDistance - distance) / maxDistance)
      const pushForce = distance < minDistance ? 1 : force * 0.5
      
      // Push dots away from cursor
      const angle = Math.atan2(dy, dx)
      const pushDistance = pushForce * 30
      
      return {
        x: Math.cos(angle) * pushDistance,
        y: Math.sin(angle) * pushDistance,
        scale: 1 + force * 0.5, // Scale up when near cursor
        opacity: Math.min(1, 0.4 + force * 0.6), // Increase opacity when near cursor
      }
    }

    return { x: 0, y: 0, scale: 1, opacity: 0.4 } // Default opacity for light mode
  }

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    >
      {dots.map((dot) => {
        const containerWidth = containerRef.current?.clientWidth || 1920
        const containerHeight = containerRef.current?.clientHeight || 1080
        const mouseEffect = getMouseEffect(dot, containerWidth, containerHeight)
        
        return (
          <div
            key={dot.id}
            className={`absolute rounded-full ${getAnimationClass(dot.direction)} transition-all duration-300 ease-out`}
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              background: dot.color,
              boxShadow: `0 0 ${dot.size * 1.5}px ${dot.shadowColor}`,
              '--duration': `${dot.duration}s`,
              animationDelay: `${dot.delay}s`,
              transform: `translate(${mouseEffect.x}px, ${mouseEffect.y}px) scale(${mouseEffect.scale})`,
              opacity: mouseEffect.opacity,
            } as React.CSSProperties & { '--duration': string }}
          />
        )
      })}
    </div>
  )
}

