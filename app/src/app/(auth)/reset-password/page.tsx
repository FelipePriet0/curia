export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9] px-4 py-10">
      <p className="font-curia-serif text-sm text-[#0B0B0F]/60">
        O reset de senha agora é feito pelo fluxo do Clerk. Use a tela de{' '}
        <a href="/forgot-password" className="text-[#4A6FA5] hover:underline">recuperação de acesso</a>.
      </p>
    </div>
  )
}
