"use client"

import React from "react"

function replaceLastSpace(input: string) {
  const s = input.replace(/\s+/g, " ")
  const idx = s.trim().lastIndexOf(" ")
  if (idx === -1) return s
  return s.slice(0, idx) + "\u00A0" + s.slice(idx + 1)
}

export function NoWidows({ children }: { children: string }) {
  return <>{replaceLastSpace(children)}</>
}

export function noWidows(input: string) {
  return replaceLastSpace(input)
}

