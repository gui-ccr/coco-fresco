import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MENSAGENS } from '../constants/messages';

export function AnimatedTitle() {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const indexRef     = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.textContent = MENSAGENS[0];

    const tl = gsap.timeline({ repeat: -1, delay: 3 });
    MENSAGENS.forEach((_, i) => {
      const next = MENSAGENS[(i + 1) % MENSAGENS.length];
      tl.to(el, { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' })
        .call(() => {
          el.textContent = next;
          indexRef.current = (i + 1) % MENSAGENS.length;
        })
        .fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to({}, { duration: 3 });
    });

    return () => { tl.kill(); };
  }, []);

  return (
    <h1
      ref={containerRef}
      className="text-white text-2xl font-black leading-tight mb-1"
      style={{ minHeight: '2rem' }}
    />
  );
}
