import { auth } from '@clerk/nextjs/server'
import { LandingPage } from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { userId } = await auth()
  return <LandingPage initialSignedIn={Boolean(userId)} />
}
