export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9] px-4 py-10">
      <p className="font-curia-serif text-sm text-[#2B1A07]/60">
        O reset de senha agora é feito pelo fluxo do Clerk. Use a tela de{' '}
        <a href="/forgot-password" className="text-[#FF6F1E] hover:underline">recuperação de acesso</a>.
      </p>
    </div>
  )
}
