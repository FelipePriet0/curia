import { getCurrentSession } from '@/lib/auth/server'
import { LoginForm } from '@/components/auth/AuthForm'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await getCurrentSession()
  if (session) {
    redirect(session.user.onboardingCompleted ? '/board' : '/onboarding')
  }

  return <LoginForm />
}
