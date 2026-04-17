import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'

export default function SsoCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback />
      <div id="clerk-captcha" data-cl-theme="light" data-cl-size="flexible" />
    </>
  )
}
