"use client"

import React, { useEffect, useState } from "react"
import { useCoreCarousel, getTweenStyle } from "./carousel-core"
import { useCarouselButtons, PrevButton, NextButton } from "./carousel-button"
import { useCarouselIndicator, CarouselIndicator } from "./carousel-indicator"

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuotesCarouselProps {
  slides: React.ReactNode[]
  className?: string
  maxRotateX?: number
  maxRotateY?: number
  maxScale?: number
  tweenFactorBase?: number
  autoplay?: boolean
  autoplayDelay?: number
  showIndicators?: boolean
  showArrows?: boolean
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

export function QuotesCarousel({
  slides,
  className = "",
  maxRotateX = 45,
  maxRotateY = 15,
  maxScale = 0.9,
  tweenFactorBase = 0.7,
  autoplay = true,
  autoplayDelay = 2000,
  showIndicators = true,
  showArrows = true,
}: QuotesCarouselProps) {
  const total = slides.length

  // Core engine (Embla-compatible API)
  const emblaApi = useCoreCarousel({ count: total, loop: true, autoplay, autoplayDelay })

  // Buttons
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    useCarouselButtons(emblaApi)

  // Indicators
  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useCarouselIndicator(emblaApi)

  // Re-render on select
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    if (!emblaApi) return
    const handler = () => forceUpdate((n) => n + 1)
    emblaApi.on("select", handler)
    emblaApi.on("init",   handler)
    return () => {
      emblaApi.off("select", handler)
      emblaApi.off("init",   handler)
    }
  }, [emblaApi])

  return (
    <div className={`relative select-none ${className}`}>
      {/* Stage */}
      <div
        className="relative mx-auto flex items-center justify-center overflow-visible"
        style={{ perspective: "1200px", height: "640px" }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute w-full max-w-[490px]"
            style={getTweenStyle(i, selectedIndex, total, {
              maxRotateX,
              maxRotateY,
              maxScale,
              tweenFactorBase,
            })}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-4">
        {showArrows && (
          <PrevButton
            onClick={onPrevButtonClick}
            disabled={prevBtnDisabled}
            className="
              flex h-10 w-10 items-center justify-center rounded-full
              border border-white/20 bg-white/10 backdrop-blur-sm
              text-white/60 shadow-sm
              transition-all hover:text-white hover:bg-white/20
              disabled:cursor-not-allowed disabled:opacity-30
            "
          />
        )}

        {showIndicators && (
          <div className="flex items-center gap-2">
            {scrollSnaps.map((_, i) => (
              <CarouselIndicator
                key={i}
                onClick={() => onDotButtonClick(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === selectedIndex
                    ? "h-2 w-6 bg-[#0B0B0F]"
                    : "h-2 w-2 bg-[#0B0B0F]/30 hover:bg-[#0B0B0F]/50"
                }`}
              />
            ))}
          </div>
        )}

        {showArrows && (
          <NextButton
            onClick={onNextButtonClick}
            disabled={nextBtnDisabled}
            className="
              flex h-10 w-10 items-center justify-center rounded-full
              border border-white/20 bg-white/10 backdrop-blur-sm
              text-white/60 shadow-sm
              transition-all hover:text-white hover:bg-white/20
              disabled:cursor-not-allowed disabled:opacity-30
            "
          />
        )}
      </div>
    </div>
  )
}
