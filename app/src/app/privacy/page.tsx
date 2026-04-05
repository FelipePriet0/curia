export const dynamic = 'force-static'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-curia-rounded text-2xl text-[#2B1A07]">Política de Privacidade</h1>
      <p className="mt-3 font-curia-serif text-sm text-[#2B1A07]/70">
        Esta Política descreve como a Curia coleta, utiliza e protege suas informações pessoais.
      </p>

      <section className="mt-6 space-y-4 font-curia-serif text-sm text-[#2B1A07]/80 leading-relaxed">
        <div>
          <h2 className="font-semibold text-[#2B1A07]">1. Informações que coletamos</h2>
          <p>Dados de cadastro (ex.: e-mail), metadados de uso, conteúdos inseridos por você e dados técnicos (IP, agente do usuário).</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">2. Finalidades</h2>
          <p>Operar e melhorar o serviço, autenticação, segurança, métricas e comunicação relacionada ao produto.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">3. Bases legais</h2>
          <p>Execução de contrato, legítimo interesse e consentimento (quando aplicável, ex.: cookies não essenciais).</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">4. Compartilhamento</h2>
          <p>Prestadores de serviço (infraestrutura, autenticação, análises) sob contratos e medidas de segurança.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">5. Retenção</h2>
          <p>Mantemos dados pelo tempo necessário às finalidades e exigências legais; você pode solicitar exclusão conforme aplicável.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">6. Seus direitos</h2>
          <p>Acesso, correção, exclusão, portabilidade, revogação de consentimento e outras solicitações previstas na LGPD.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">7. Segurança</h2>
          <p>Empregamos controles técnicos e organizacionais compatíveis com o porte do serviço para proteger suas informações.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">8. Cookies</h2>
          <p>Utilizamos cookies essenciais e, mediante consentimento, cookies adicionais. Gerencie preferências em <a className="underline" href="/cookies">/cookies</a>.</p>
        </div>
        <div>
          <h2 className="font-semibold text-[#2B1A07]">9. Alterações</h2>
          <p>Podemos atualizar esta Política. Publicaremos a versão vigente nesta página, com a data de atualização.</p>
        </div>
        <p className="text-[12px] text-[#2B1A07]/50 mt-4">Última atualização: {new Date().toISOString().slice(0,10)}</p>
      </section>
    </div>
  )
}

