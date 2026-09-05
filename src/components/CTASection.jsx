// import { motion } from 'framer-motion'
// import MagneticButton from './MagneticButton.jsx'

// export default function CTASection() {
//   return (
//     <section className="relative overflow-hidden bg-ink py-40 text-paper md:py-52">
//       <div className="pointer-events-none absolute inset-0">
//         <span className="absolute left-[8%] top-[20%] h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
//         <span className="absolute right-[14%] top-[65%] h-1 w-1 animate-pulse rounded-full bg-signal" style={{ animationDelay: '0.6s' }} />
//         <span className="absolute left-[42%] bottom-[12%] h-1 w-1 animate-pulse rounded-full bg-signal" style={{ animationDelay: '1.2s' }} />
//       </div>

//       <div className="relative z-10 mx-auto max-w-[1400px] px-6 text-center md:px-10">
//         <motion.h2
//           initial={{ opacity: 0, y: 24 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true, amount: 0.6 }}
//           transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
//           className="mx-auto max-w-3xl text-display-sm font-semibold leading-[1.02]"
//         >
//           Your systems never stop.
//           <br />
//           Neither should your security.
//         </motion.h2>

//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true, amount: 0.6 }}
//           transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
//           className="mt-12 flex flex-col items-center gap-6"
//         >
//           <MagneticButton variant="light" className="!border-paper !text-paper hover:!bg-signal hover:!border-signal hover:!text-paper !bg-transparent">
//             Request Early Access
//           </MagneticButton>
//           <p className="font-mono-tech text-xs text-paper/50">Meet SAOM AI.</p>
//         </motion.div>
//       </div>
//     </section>
//   )
// }
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ===========================================================
   SIGNAL MARK — abstract background illustration
   Reuses the black/red/white language from the threat globe:
   concentric rings + a sparse node network + one red pulse.
=========================================================== */

function SignalMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 680 400"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="340" cy="200" r="60" fill="none" stroke="#000" strokeWidth="0.6" />
      <circle cx="340" cy="200" r="110" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.35" />
      <circle cx="340" cy="200" r="160" fill="none" stroke="#000" strokeWidth="0.6" opacity="0.35" />

      <line x1="340" y1="30" x2="340" y2="370" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="170" y1="200" x2="510" y2="200" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="220" y1="80" x2="460" y2="320" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="460" y1="80" x2="220" y2="320" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="240" y1="140" x2="340" y2="200" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="420" y1="260" x2="340" y2="200" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="280" y1="290" x2="340" y2="200" stroke="#000" strokeWidth="0.5" opacity="0.2" />
      <line x1="440" y1="150" x2="340" y2="200" stroke="#000" strokeWidth="0.5" opacity="0.2" />

      {[
        [240, 140], [420, 260], [280, 290], [440, 150],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#000" opacity="0.35" />
      ))}

      {[
        [220, 80], [460, 320], [460, 80], [220, 320],
        [170, 200], [510, 200], [340, 30], [340, 370],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.4" fill="#000" opacity="0.35" />
      ))}

      <circle cx="340" cy="200" r="24" fill="none" stroke="#ED1C2E" strokeWidth="1" opacity="0.5" />
      <circle cx="340" cy="200" r="14" fill="none" stroke="#ED1C2E" strokeWidth="1" />
      <circle cx="340" cy="200" r="5" fill="#ED1C2E" />
    </svg>
  );
}

/* ===========================================================
   FINAL CTA SECTION
=========================================================== */

export default function FinalCTASection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".final-cta-content",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );

      gsap.fromTo(
        ".final-cta-mark",
        { opacity: 0, scale: 0.94 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="get-started"
      className="relative overflow-hidden bg-white text-black"
    >
      {/* background signal mark — quiet, decorative, never competes with text */}
      <SignalMark className="final-cta-mark pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[1090px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05]" />

      <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-[1600px] flex-col items-center justify-center px-6 py-28 text-center md:px-12 lg:px-16">
        <div className="final-cta-content flex max-w-[720px] flex-col items-center">
          <div className="mb-8 flex items-center gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-[#ed1c2e]">09</span>
            <span className="h-px w-8 bg-[#ed1c2e]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/55">
              Get started
            </span>
          </div>

          <h2 className="text-[clamp(2.2rem,4.4vw,4.2rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
            Your systems never stop.
            <br />
            Neither should{" "}
            <span className="text-[#ed1c2e]">your security</span>.
          </h2>

          <div className="mt-11 flex flex-col items-center gap-5">
            <button
              type="button"
              className="group relative overflow-hidden rounded-full bg-black px-9 py-4 font-mono text-[13px] uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:text-black"
            >
              <span className="absolute inset-0 origin-left scale-x-0 bg-[#ed1c2e] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              <span className="relative">Request early access</span>
            </button>

            <a
              href="#platform"
              className="group inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-black/55 transition-colors duration-300 hover:text-[#ed1c2e]"
            >
              Meet SAOM AI
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}