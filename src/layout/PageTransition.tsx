import { useState, useRef, useLayoutEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';

interface Panel {
  key: string;
  node: ReactNode;
  isOutgoing: boolean;
}

interface PageTransitionProps {
  children: ReactNode;
  activeTab: string;
  tabOrder: readonly string[];
}

export function PageTransition({ children, activeTab, tabOrder }: PageTransitionProps) {
  const [panels, setPanels] = useState<Panel[]>([
    { key: activeTab, node: children, isOutgoing: false },
  ]);

  const prevTabRef      = useRef(activeTab);
  const prevChildrenRef = useRef<ReactNode>(children);
  const isFirstRef      = useRef(true);
  const isAnimating     = useRef(false);
  const dirRef          = useRef(0);
  const outRef          = useRef<HTMLDivElement>(null);
  const inRef           = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }

    if (activeTab === prevTabRef.current) {
      prevChildrenRef.current = children;
      setPanels([{ key: activeTab, node: children, isOutgoing: false }]);
      return;
    }

    if (isAnimating.current) gsap.killTweensOf([outRef.current, inRef.current]);

    const prevIdx = tabOrder.indexOf(prevTabRef.current);
    const currIdx = tabOrder.indexOf(activeTab);
    dirRef.current = currIdx > prevIdx ? 1 : -1;

    const prevKey    = prevTabRef.current;
    const outContent = prevChildrenRef.current;

    prevTabRef.current      = activeTab;
    prevChildrenRef.current = children;
    isAnimating.current     = true;

    setPanels([
      { key: `${prevKey}__out`, node: outContent, isOutgoing: true  },
      { key: activeTab,         node: children,   isOutgoing: false },
    ]);
  }, [activeTab, children, tabOrder]);

  useLayoutEffect(() => {
    if (!panels.some(p => p.isOutgoing)) return;
    if (!outRef.current || !inRef.current) return;

    const dir = dirRef.current;
    const W   = inRef.current.offsetWidth || 390;

    gsap.set(inRef.current,  { x: dir * W });
    gsap.set(outRef.current, { x: 0 });

    gsap.timeline({
      onComplete: () => {
        isAnimating.current = false;
        setPanels(prev => prev.filter(p => !p.isOutgoing));
        if (inRef.current) gsap.set(inRef.current, { clearProps: 'transform' });
      },
    })
      .to(outRef.current, { x: -dir * W, duration: 0.38, ease: 'power3.inOut' }, 0)
      .to(inRef.current,  { x: 0,        duration: 0.38, ease: 'power3.inOut' }, 0);
  }, [panels]);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100%' }}>
      {panels.map(panel => {
        const isOut = panel.isOutgoing;
        return (
          <div
            key={panel.key}
            ref={isOut ? outRef : inRef}
            style={{
              position:   isOut ? 'absolute' : 'relative',
              top:        isOut ? 0 : undefined,
              left:       isOut ? 0 : undefined,
              right:      isOut ? 0 : undefined,
              width:      isOut ? '100%' : undefined,
              zIndex:     isOut ? 1 : 2,
              willChange: 'transform',
            }}
          >
            {panel.node}
          </div>
        );
      })}
    </div>
  );
}
