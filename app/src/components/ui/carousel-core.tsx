"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ─── Embla-compatible API type ────────────────────────────────────────────────
// Mirrors the EmblaCarouselType interface so carousel-button and
// carousel-indicator work without the real embla package.

type EventName = "select" | "reInit" | "init"
type Listener = (api: EmblaApiType) => void

export interface EmblaApiType {
  selectedScrollSnap: () => number
  scrollSnapList: () => number[]
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  on: (event: EventName, cb: Listener) => EmblaApiType
  off: (event: EventName, cb: Listener) => EmblaApiType
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseCoreCarouselOptions {
  count: number
  loop?: boolean
  autoplay?: boolean
  autoplayDelay?: number
}

export function useCoreCarousel({
  count,
  loop = true,
  autoplay = true,
  autoplayDelay = 2000,
}: UseCoreCarouselOptions): EmblaApiType | undefined {
  const [index, setIndex] = useState(0)
  const listenersRef = useRef<Map<EventName, Set<Listener>>>(new Map())
  const indexRef = useRef(index)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const apiRef = useRef<EmblaApiType | null>(null)

  indexRef.current = index

  const emit = useCallback((event: EventName) => {
    const set = listenersRef.current.get(event)
    if (!set || !apiRef.current) return
    set.forEach((cb) => cb(apiRef.current!))
  }, [])

  const scrollTo = useCallback(
    (i: number) => {
      const next = loop
        ? ((i % count) + count) % count
        : Math.max(0, Math.min(i, count - 1))
      setIndex(next)
      indexRef.current = next
      emit("select")
    },
    [count, loop, emit]
  )

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoplay) return
    timerRef.current = setInterval(() => {
      const next = ((indexRef.current + 1) % count)
      setIndex(next)
      indexRef.current = next
      emit("select")
    }, autoplayDelay)
  }, [autoplay, autoplayDelay, count, emit])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  // Build stable API object once
  useEffect(() => {
    const api: EmblaApiType = {
      selectedScrollSnap: () => indexRef.current,
      scrollSnapList: () => Array.from({ length: count }, (_, i) => i),
      canScrollPrev: () => loop || indexRef.current > 0,
      canScrollNext: () => loop || indexRef.current < count - 1,
      scrollPrev: () => { scrollTo(indexRef.current - 1); resetTimer() },
      scrollNext: () => { scrollTo(indexRef.current + 1); resetTimer() },
      scrollTo: (i) => { scrollTo(i); resetTimer() },
      on(event, cb) {
        if (!listenersRef.current.has(event)) {
          listenersRef.current.set(event, new Set())
        }
        listenersRef.current.get(event)!.add(cb)
        return api
      },
      off(event, cb) {
        listenersRef.current.get(event)?.delete(cb)
        return api
      },
    }
    apiRef.current = api
    emit("init")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return apiRef.current ?? undefined
}

// ─── Tween helper ─────────────────────────────────────────────────────────────

export function getTweenStyle(
  slideIndex: number,
  activeIndex: number,
  total: number,
  opts: {
    maxRotateX?: number
    maxRotateY?: number
    maxScale?: number
    tweenFactorBase?: number
  }
): React.CSSProperties {
  const { maxRotateX = 45, maxRotateY = 15, maxScale = 0.9, tweenFactorBase = 0.7 } = opts

  let dist = slideIndex - activeIndex
  if (dist > total / 2)  dist -= total
  if (dist < -total / 2) dist += total

  const absD    = Math.abs(dist)
  const scale   = absD === 0 ? 1 : Math.max(maxScale, 1 - absD * (1 - maxScale) * tweenFactorBase)
  const rotateY = Math.max(-maxRotateY, Math.min(maxRotateY, dist * maxRotateY * 0.5))
  const rotateX = absD === 0 ? 0 : Math.min(maxRotateX * 0.1, absD * 2)
  const opacity = absD > 2 ? 0 : Math.max(0.2, 1 - absD * 0.35)
  const tx      = dist * 62
  const zIndex  = absD === 0 ? 10 : Math.max(1, 6 - absD)
  const blur    = absD === 0 ? 0 : absD * 1.5

  return {
    transform: `translateX(${tx}%) scale(${scale}) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
    opacity,
    zIndex,
    filter: blur > 0 ? `blur(${blur}px)` : "none",
    transition: "transform 0.55s cubic-bezier(0.25,1,0.5,1), opacity 0.5s ease, filter 0.5s ease",
    pointerEvents: absD === 0 ? "auto" : "none",
  }
}
