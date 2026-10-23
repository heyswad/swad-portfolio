import { useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { person } from '../data';
import { back, exitFade, useIntro, useSection, useWorld } from '../engine/hooks';
import { scrollToScene } from '../engine/director';
import { Btn } from '../components/Chrome';

export default function Hero() {
  const sec = useSection('hero');
  const name = useRef<HTMLDivElement>(null), copy = useRef<HTMLDivElement>(null), hl = useRef<HTMLSpanElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const introDone = useRef(false);

  useIntro(() => {
    gsap.fromTo(letters.current, { yPercent: 115, rotateX: -80 }, { yPercent: 0, rotateX: 0, duration: 1.6, ease: 'expo.out', stagger: 0.07 });
    gsap.fromTo(copy.current!.querySelectorAll('.mask > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
    gsap.fromTo(copy.current!.querySelectorAll('.fade-in'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.45, onComplete: () => { introDone.current = true; } });
  });

  useWorld(w => {
    const st = w.scenes.hero;
    const o = exitFade(st.exit);
    if (name.current) {
      name.current.style.opacity = o.toFixed(3);
      name.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
      letters.current.forEach((l, i) => { if (l) l.parentElement!.style.transform = `translateY(${((i % 2 ? -1 : 1) * st.p * 26).toFixed(1)}px)`; });
    }
    if (copy.current) {
      copy.current.style.opacity = o.toFixed(3);
      copy.current.style.transform = `translateY(${(-st.exit * 40).toFixed(1)}px)`;
      copy.current.style.visibility = o < 0.002 ? 'hidden' : 'visible';
    }
    if (hl.current) hl.current.style.setProperty('--hl', `${Math.min(100, 12 + st.p * 140).toFixed(1)}%`);
  });

  return (
    <section className="scene" id="hero" ref={sec} style={{ height: '230vh' }}>
      {createPortal(
        <div className="hero-name anton" ref={name} aria-hidden="true">
          {person.first.toUpperCase().split('').map((c, i) => (
            <span className="hn-l" key={i}><span ref={el => { letters.current[i] = el; }}>{c}</span></span>
          ))}
        </div>, back())}
      <div className="sticky"><div className="inner">
        <div className="hero-copy panel" ref={copy}>
          <p className="hi fade-in">Hi, I'm <b>{person.full}</b> —</p>
          <h1 className="anton hero-title">
            <span className="mask"><span>{person.roleTop}</span></span>
            <span className="mask red"><span>{person.roleBottom}</span></span>
          </h1>
          <p className="hero-desc fade-in"><span className="hl" ref={hl}>{person.tagline}</span></p>
          <div className="btns fade-in">
            <Btn variant="red" cursor="Go" onClick={() => scrollToScene('work')}>See my work ↘</Btn>
            <Btn variant="outline" cursor="PDF" href="./resume.pdf" download>Download résumé</Btn>
          </div>
        </div>
      </div></div>
    </section>
  );
}
