import { CuriaChambra } from '@/components/board/chamber/CuriaChambra'

export default function BrandLabPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--chamber-cream-bg)] px-6 py-16">
      <div className="w-full max-w-5xl">
        <CuriaChambra state="idle" />
      </div>
    </main>
  )
}
