import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/server'

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login')
  }

  if (!session.user.onboardingCompleted) {
    redirect('/onboarding')
  }

  return <>{children}</>
}
