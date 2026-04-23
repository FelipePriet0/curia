// Curia Board — the deliberation chamber experience.

const { useState: useStateB, useEffect: useEffectB, useRef: useRefB } = React;

/* ─── Sidebar ───────────────────────────────────────────────── */
function BoardSidebar({ active, onSelect }) {
  const items = [
    { id:'home',    label:'Câmara' },
    { id:'history', label:'Histórico' },
    { id:'company', label:'Sua empresa' },
    { id:'docs',    label:'Documentos' },
  ];
  return (
    <aside style={{
      width:220, background:'var(--sidebar-dark)', color:'#F5F0E8',
      padding:'24px 16px', display:'flex', flexDirection:'column', gap:18,
      fontFamily:'var(--font-ui)'
    }}>
      <div style={{ padding:'4px 8px 12px' }}>
        <CuriaLogo size={22} color="#F5F0E8"/>
      </div>
      <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {items.map(it => (
          <button key={it.id} onClick={()=>onSelect && onSelect(it.id)} style={{
            background: active === it.id ? 'rgba(245,240,232,0.08)' : 'transparent',
            color: active === it.id ? '#F5F0E8' : 'rgba(245,240,232,0.65)',
            border:'none', textAlign:'left', padding:'8px 10px',
            borderRadius:8, fontSize:13, cursor:'pointer'
          }}>{it.label}</button>
        ))}
      </nav>
      <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:10, padding:'10px 8px', borderTop:'1px solid rgba(245,240,232,0.08)' }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'#C9A84C', color:'#1A1A1F', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, fontFamily:'var(--font-ui)' }}>F</div>
        <div>
          <div style={{ fontSize:12, color:'#F5F0E8' }}>Felipe Prieto</div>
          <div style={{ fontSize:10, color:'rgba(245,240,232,0.5)' }}>Curia Starter</div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Counselor seats inside the chamber ────────────────────── */
const COUNSELORS = [
  { id:'strategy',  name:'Estratégia',  color:'#C9A84C', short:'E' },
  { id:'finance',   name:'Finanças',    color:'#A8B5C0', short:'F' },
  { id:'growth',    name:'Growth',      color:'#4A9B6F', short:'G' },
  { id:'product',   name:'Produto',     color:'#4A6FA5', short:'P' },
  { id:'operations',name:'Operações',   color:'#8B9BB4', short:'O' },
  { id:'brand',     name:'Marca',       color:'#9B6BB4', short:'M' },
];

function Chamber({ phase = 'idle' }) {
  // The actual chamber lives in app/src/components/board/chamber/CuriaChambra.tsx
  // This UI kit DOES NOT recreate it — only shows phase state around a placeholder.
  const label = phase === 'idle' ? 'Câmara em recesso'
              : phase === 'receiving' ? 'Recebendo o assunto'
              : phase === 'deliberating' ? 'Conselheiros deliberando'
              : 'Parecer pronto';
  return (
    <div style={{
      width:'100%', maxWidth:520, aspectRatio:'1.6 / 1', margin:'0 auto',
      border:'1px dashed rgba(245,240,232,0.18)', borderRadius:8,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10,
      color:'rgba(245,240,232,0.55)', fontFamily:'var(--font-ui)',
      background:'radial-gradient(ellipse at center, rgba(201,168,76,0.05), transparent 70%)'
    }}>
      <span style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase' }}>Câmara · componente do produto</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, opacity:0.7 }}>CuriaChambra.tsx</span>
      <span style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'#C9A84C' }}>{label}</span>
    </div>
  );
}

/* ─── Composer ──────────────────────────────────────────────── */
function Composer({ value, onChange, onSend, disabled }) {
  return (
    <div style={{
      maxWidth:680, margin:'0 auto', background:'#fff',
      border:'1px solid var(--border-warm)', borderRadius:12, padding:'12px 14px',
      display:'flex', flexDirection:'column', gap:8,
      boxShadow:'0 2px 8px rgba(43,26,7,0.04)'
    }}>
      <textarea
        value={value} onChange={e=>onChange(e.target.value)}
        placeholder="Conte-nos o seu maior desafio, vamos resolvê-lo juntos."
        style={{
          border:'none', outline:'none', resize:'none',
          fontFamily:'var(--font-body)', fontSize:15, color:'var(--ink)',
          minHeight:54, fontStyle: value ? 'normal' : 'italic'
        }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:11, color:'var(--ink-45)', background:'rgba(43,26,7,0.05)', border:'1px solid rgba(43,26,7,0.1)', borderRadius:20, padding:'2px 10px' }}>
          Curia Strategist
        </span>
        <button onClick={onSend} disabled={disabled || !value.trim()} style={{
          width:32, height:32, borderRadius:'50%', border:'none',
          background: (disabled || !value.trim()) ? 'rgba(43,26,7,0.15)' : '#FF6F1E',
          color:'#fff', cursor: disabled ? 'not-allowed' : 'pointer', fontSize:16
        }}>→</button>
      </div>
    </div>
  );
}

/* ─── Quickstart cards ─────────────────────────────────────── */
function QuickStart({ onPick }) {
  const items = [
    'Diagnosticar um gargalo de crescimento',
    'Revisar estratégia de pricing',
    'Avaliar uma contratação-chave',
    'Estruturar próximos 14 dias',
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxWidth:560, margin:'18px auto 0' }}>
      {items.map((t,i) => (
        <button key={i} onClick={()=>onPick(t)} style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 14px', borderRadius:12,
          border:'1px solid rgba(43,26,7,0.09)', background:'rgba(43,26,7,0.025)',
          fontFamily:'var(--font-body)', fontSize:13, color:'rgba(43,26,7,0.7)',
          textAlign:'left', cursor:'pointer', transition:'all .15s'
        }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,111,30,0.06)';e.currentTarget.style.borderColor='rgba(255,111,30,0.25)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(43,26,7,0.025)';e.currentTarget.style.borderColor='rgba(43,26,7,0.09)';}}>
          <span style={{ color:'#FF6F1E', fontSize:18 }}>◑</span>
          <span>{t}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Verdict panel ─────────────────────────────────────────── */
function VerdictPanel({ visible, prompt }) {
  if (!visible) return null;
  return (
    <div style={{
      maxWidth:680, margin:'18px auto 0',
      background:'#fff', border:'1px solid var(--border-warm)',
      borderLeft:'2px solid rgba(201,168,76,0.5)',
      borderRadius:12, padding:'16px 20px', display:'flex', flexDirection:'column', gap:10,
      animation:'verdict-appear 0.5s cubic-bezier(0.4,0,0.2,1)'
    }}>
      <div className="fg-verdict-label" style={{ color:'#C9A84C', display:'flex', gap:10, alignItems:'center' }}>
        Plano de ação
        <span style={{ background:'rgba(201,168,76,0.1)', borderRadius:4, padding:'1px 6px', textTransform:'none', letterSpacing:'0.06em', fontSize:10 }}>
          recomendações + próximos passos
        </span>
      </div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(43,26,7,0.85)', lineHeight:1.65 }}>
        <p style={{ margin:'4px 0' }}><strong>Diagnóstico.</strong> Com base em "{prompt.slice(0,80)}{prompt.length>80?'…':''}", o conselho identifica que o gargalo está mais no <em>funil de ativação</em> do que na aquisição.</p>
        <p style={{ margin:'4px 0' }}><strong>1.</strong> Audite os cancelamentos dos últimos 60 dias por cohort — foque em quem churnou nos primeiros 14 dias.</p>
        <p style={{ margin:'4px 0' }}><strong>2.</strong> Instrumente o evento de <em>primeira ativação</em> e crie alerta para contas sem ativação em D+3.</p>
        <p style={{ margin:'4px 0' }}><strong>3.</strong> Reescreva o onboarding para entregar o <em>primeiro valor</em> em menos de 5 minutos.</p>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:6 }}>
        <CuriaBtn variant="primary" size="sm">Aprofundar</CuriaBtn>
        <CuriaBtn variant="outline" size="sm">Pedir parecer dissidente</CuriaBtn>
      </div>
      <style>{`@keyframes verdict-appear { from {opacity:0; transform:translateY(16px);} to {opacity:1; transform:translateY(0);} }`}</style>
    </div>
  );
}

Object.assign(window, { BoardSidebar, Chamber, Composer, QuickStart, VerdictPanel, COUNSELORS });
