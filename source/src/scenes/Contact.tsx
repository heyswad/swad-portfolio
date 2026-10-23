import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { person, year } from '../data';
import { back, useSection, useWorld } from '../engine/hooks';
import { SCENES, clamp, easeOutCubic, scrollTop } from '../engine/director';

const CI = SCENES.findIndex(s => s.id === 'contact');

export default function Contact() {
  const sec = useSection('contact');
  const red = useRef<HTMLDivElement>(null), talk = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null);

  useWorld(w => {
    const st = w.scenes.contact, F = w.f;
    let t = 0;
    if (F.active === CI) t = F.t; else if (F.active > CI) t = 1;
    if (red.current) {
      if (t <= 0) red.current.style.visibility = 'hidden';
      else {
        const { vw, vh } = w, skew = 0.2 * vh, e = -skew + (vw + 2 * skew) * t;
        red.current.style.visibility = 'visible';
        red.current.style.clipPath = t >= 1 ? 'none' : `polygon(0 0, ${e + skew}px 0, ${e - skew}px ${vh}px, 0 ${vh}px)`;
      }
    }
    const e = easeOutCubic(clamp((st.enter - 0.55) * 2.4));
    if (talk.current) { talk.current.style.opacity = e.toFixed(3); talk.current.style.transform = `translateX(-50%) translateY(${((1 - e) * 8).toFixed(2)}vh)`; talk.current.style.visibility = e < 0.002 ? 'hidden' : 'visible'; }
    if (body.current) { body.current.style.opacity = e.toFixed(3); body.current.style.transform = `translateY(${((1 - e) * 40).toFixed(1)}px)`; body.current.style.visibility = e < 0.002 ? 'hidden' : 'visible'; }
  }, { scene: 'contact' });

  return (
    <section className="scene" id="contact" ref={sec} style={{ height: '240vh' }}>
      {createPortal(<>
        <div className="contact-red" ref={red} aria-hidden="true" />
        <div className="talk anton" ref={talk} aria-hidden="true"><span>LET'S</span><span>TALK</span></div>
      </>, back())}
      <div className="sticky"><div className="inner">
        <div className="contact-body" ref={body}>
          <div className="c-left">
            <div className="label mono on-red"><b>(06)</b> — Open to a full-time startup role</div>
            <a className="email anton" href={`mailto:${person.email}`} data-cursor="Write">
              <span>{person.emailName}</span><span className="dom">{person.emailDomain}</span>
            </a>
          </div>
          <ul className="c-links">
            {person.links.map(l => (
              <li key={l.label}><a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener" data-cursor={l.label === 'Résumé' ? 'PDF' : 'Open'}>
                <span>{l.label}</span><span className="arr">↗</span></a></li>
            ))}
          </ul>
          <footer className="c-foot mono">
            <span>© {year} {person.full} · {person.location}</span>
            <button onClick={scrollTop} data-cursor="Top">Back to top ↑</button>
          </footer>
        </div>
      </div></div>
    </section>
  );
}
