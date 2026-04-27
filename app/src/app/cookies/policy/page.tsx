export const dynamic = 'force-static'

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-curia-rounded text-2xl text-[#0B0B0F]">Política de Cookies</h1>
      <p className="mt-3 text-sm text-[#0B0B0F]/70">
        Explicamos aqui o que são cookies, quais usamos e como você pode gerenciá-los.
      </p>

      <section className="mt-6 space-y-4 text-sm text-[#0B0B0F]/80 leading-relaxed">
        <div>
          <h2 className="font-semibold text-[#0B0B0F]">1. O que são cookies</h2>
          <p>Pequenos arquivos armazenados no seu dispositivo para lembrar preferências e melhorar a experiência.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#0B0B0F]">2. Tipos que utilizamos</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium">Essenciais:</span> necessários para login, segurança e funcionamento.</li>
            <li><span className="font-medium">Funcionais:</span> melhoram recursos e lembram preferências.</li>
            <li><span className="font-medium">Analytics:</span> estatísticas de uso e performance.</li>
            <li><span className="font-medium">Marketing:</span> personalização e mensagens orientadas.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-[#0B0B0F]">3. Gerenciamento</h2>
          <p>Você pode ajustar ou revogar consentimentos em <a className="underline" href="/cookies">/cookies</a> e também no seu navegador.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#0B0B0F]">4. Alterações</h2>
          <p>Podemos atualizar esta Política periodicamente. A versão vigente fica disponível nesta página.</p>
        </div>
        <p className="text-[12px] text-[#0B0B0F]/50 mt-4">Última atualização: {new Date().toISOString().slice(0,10)}</p>
      </section>
    </div>
  )
}

