import { getCurrentSession } from '@/lib/auth/server'
import { SignupForm } from '@/components/auth/AuthForm'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  const session = await getCurrentSession()
  if (session) {
    redirect(session.user.onboardingCompleted ? '/board' : '/onboarding')
  }

  return <SignupForm />
}
