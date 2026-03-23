import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const DURATION = 1200;
    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(id); setFading(true); setTimeout(onDone, 300); }
    }, 16);
    // Hard fallback - always exits within 2.5s
    const kill = setTimeout(onDone, 2500);
    return () => { clearInterval(id); clearTimeout(kill); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: 'none',
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:'absolute', width:120+i*60, height:120+i*60, borderRadius:'50%',
          border:'1px solid rgba(26,86,219,0.12)',
          animation:`sp 2s ease-out ${i*0.3}s infinite`,
        }}/>
      ))}
      <div style={{
        width:80, height:80, borderRadius:20, background:'rgba(26,86,219,0.08)',
        border:'1px solid rgba(26,86,219,0.25)', display:'flex', alignItems:'center',
        justifyContent:'center', marginBottom:24, boxShadow:'0 0 50px rgba(26,86,219,0.2)',
        fontSize:38, fontWeight:900, color:'#3b82f6', fontFamily:'system-ui, sans-serif',
      }}>Σ</div>
      <h1 style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-0.02em',marginBottom:4,fontFamily:'system-ui,sans-serif'}}>
        SIG<span style={{color:'#3b82f6'}}>MA</span>
      </h1>
      <p style={{fontSize:12,color:'#444',marginBottom:40,fontFamily:'system-ui,sans-serif'}}>Live · Connect · Create</p>
      <div style={{width:160,height:2,background:'#1a1a1a',borderRadius:2,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:2,width:`${progress}%`,background:'linear-gradient(90deg,#1a56db,#2563eb)',transition:'width 0.05s linear'}}/>
      </div>
      <style>{`@keyframes sp{0%{opacity:.5;transform:scale(.7)}100%{opacity:0;transform:scale(1.3)}}`}</style>
    </div>
  );
}
