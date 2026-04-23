// Shared building blocks for Curia UI kit
// Loaded as a Babel script — exposes components on window.

const { useState, useEffect, useRef } = React;

/* ─── Buttons ───────────────────────────────────────────────── */
function CuriaBtn({ children, variant = 'primary', size = 'md', ...rest }) {
  const cls = `curia-btn curia-btn-${variant}`;
  const style = size === 'sm' ? { height: '2rem', fontSize: 12, padding: '0 1rem' }
              : size === 'lg' ? { height: '3rem', fontSize: 15, padding: '0 1.5rem' }
              : {};
  return <button className={cls} style={style} {...rest}>{children}</button>;
}

/* ─── Logo ──────────────────────────────────────────────────── */
function CuriaLogo({ size = 28, color = 'var(--ink)' }) {
  return (
    <span style={{
      fontFamily: 'var(--font-logo)', fontWeight: 800,
      fontSize: size, letterSpacing: '-0.005em', color, lineHeight: 1
    }}>Curia</span>
  );
}

/* ─── Top nav ───────────────────────────────────────────────── */
function TopNav({ onEnter }) {
  return (
    <header style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'18px 32px', maxWidth:1280, margin:'0 auto'
    }}>
      <CuriaLogo size={26} />
      <nav style={{ display:'flex', gap:28, fontFamily:'var(--font-ui)', fontSize:13, color:'var(--ink-60)' }}>
        <a style={{color:'inherit',textDecoration:'none'}}>Como funciona</a>
        <a style={{color:'inherit',textDecoration:'none'}}>Conselheiros</a>
        <a style={{color:'inherit',textDecoration:'none'}}>Planos</a>
      </nav>
      <div style={{ display:'flex', gap:8 }}>
        <CuriaBtn variant="ghost" size="sm">Entrar</CuriaBtn>
        <CuriaBtn variant="primary" size="sm" onClick={onEnter}>Comece agora →</CuriaBtn>
      </div>
    </header>
  );
}

/* ─── Hero ──────────────────────────────────────────────────── */
function Hero({ onEnter }) {
  return (
    <section style={{ position:'relative', padding:'80px 32px 100px', maxWidth:1024, margin:'0 auto', textAlign:'center' }}>
      <div style={{
        position:'absolute', inset:'0 0 30% 0', background:'radial-gradient(ellipse at center, rgba(255,111,30,0.08), transparent 60%)',
        filter:'blur(40px)', pointerEvents:'none'
      }}/>
      <div style={{ position:'relative' }}>
        <span style={{
          display:'inline-block', fontFamily:'var(--font-script)', color:'var(--action)',
          fontSize:22, marginBottom:14
        }}>Acesso antecipado — vagas limitadas</span>
        <h1 className="fg-h1" style={{ marginBottom:18 }}>
          Os conselheiros estratégicos<br/>
          das grandes empresas <span style={{ fontFamily:'var(--font-script)', color:'var(--action)', fontWeight:400, letterSpacing:0 }}>trabalhando para você</span>
        </h1>
        <p className="fg-muted" style={{ maxWidth:640, margin:'0 auto 28px', fontSize:18 }}>
          Curia é o seu board de executivos IA. Diagnóstico, parecer e plano de ação —
          do mesmo nível das gigantes, na escala da sua empresa.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <CuriaBtn variant="primary" size="lg" onClick={onEnter}>Comece agora →</CuriaBtn>
          <CuriaBtn variant="outline" size="lg">Ver como funciona</CuriaBtn>
        </div>
        <p style={{ marginTop:14, fontFamily:'var(--font-ui)', fontSize:13, color:'var(--ink-45)' }}>
          Teste grátis por 14 dias.
        </p>
      </div>
    </section>
  );
}

/* ─── Big-tech marquee ──────────────────────────────────────── */
function BigTechStrip() {
  const logos = ['apple','google','netflix','meta','stripe','openai','tesla','spotify','airbnb','uber','github','shopify','notion','figma','zoom','youtube'];
  return (
    <section style={{ padding:'48px 32px', borderTop:'1px solid var(--border-warm)', borderBottom:'1px solid var(--border-warm)', background:'var(--surface-soft)' }}>
      <p className="fg-label" style={{ textAlign:'center', marginBottom:28 }}>
        A mesma classe de pensamento que move
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', alignItems:'center', gap:'28px 36px', maxWidth:1100, margin:'0 auto' }}>
        {logos.map(l => (
          <img key={l} src={`../../assets/logos/${l}.svg`}
               style={{ height:22, opacity:0.5, filter:'grayscale(1)' }}/>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { CuriaBtn, CuriaLogo, TopNav, Hero, BigTechStrip });
