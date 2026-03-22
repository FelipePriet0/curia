"use client"

import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useState,
} from "react"
import type { EmblaApiType } from "./carousel-core"

type UseCarouselIndicatorType = {
  selectedIndex: number
  scrollSnaps: number[]
  onDotButtonClick: (index: number) => void
}

export const useCarouselIndicator = (
  emblaApi: EmblaApiType | undefined
): UseCarouselIndicatorType => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const onInit = useCallback((api: EmblaApiType) => {
    setScrollSnaps(api.scrollSnapList())
  }, [])

  const onSelect = useCallback((api: EmblaApiType) => {
    setSelectedIndex(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onInit(emblaApi)
    onSelect(emblaApi)

    emblaApi
      .on("reInit", onInit)
      .on("reInit", onSelect)
      .on("select", onSelect)

    return () => {
      emblaApi
        .off("reInit", onInit)
        .off("reInit", onSelect)
        .off("select", onSelect)
    }
  }, [emblaApi, onInit, onSelect])

  return { selectedIndex, scrollSnaps, onDotButtonClick }
}

type CarouselIndicatorProps = ComponentPropsWithRef<"button">

export const CarouselIndicator: React.FC<CarouselIndicatorProps> = (props) => {
  const { children, ...restProps } = props
  return (
    <button type="button" {...restProps}>
      {children}
    </button>
  )
}
