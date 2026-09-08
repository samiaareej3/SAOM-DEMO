  import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ===========================================================
   CONVERGENCE — background signal field for the final CTA

   Hairline signal lines enter from the edges of the frame and
   resolve into a single still point beside the CTA. No circles,
   no radar sweep, no nodes — just correlated signal lines
   settling into one point of action. Deliberately asymmetric so
   nothing sits behind the headline glyphs themselves.
=========================================================== */

const LINES = [
  {
    id: "l1",
    d: "M -40 210 C 260 190, 520 300, 760 430 S 940 560, 980 560",
    variant: "black",
    opacity: 0.13,
    mobile: true,
  },
  {
    id: "l2",
    d: "M -40 110 C 300 90, 560 220, 800 380 S 950 540, 980 560",
    variant: "black",
    opacity: 0.08,
    mobile: false,
  },
  {
    id: "l3",
    d: "M 1640 160 C 1320 190, 1140 320, 1040 440 S 990 540, 980 560",
    variant: "black",
    opacity: 0.11,
    mobile: true,
  },
  {
    id: "l4",
    d: "M 1640 740 C 1380 690, 1160 640, 1000 590 S 985 565, 980 560",
    variant: "black",
    opacity: 0.09,
    mobile: false,
  },
  {
    id: "l5",
    d: "M 860 900 C 910 780, 950 660, 980 560",
    variant: "red",
    opacity: 0.34,
    mobile: true,
  },
];

function SignalField({ className = "" }) {
  const rootRef = useRef(null);
  const glowRef = useRef(null);
  const sweepRef = useRef(null);
  const contourRefs = useRef([]);

  useEffect(() => {
    if (!rootRef.current) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const contours = contourRefs.current.filter(Boolean);

      // Soft entrance: the visual settles into the page instead of "appearing".
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: 18, scale: 1.015 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 88%",
          },
        }
      );

      if (reduceMotion) return;

      // Almost imperceptible atmospheric movement.
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          x: 28,
          y: -10,
          scale: 1.04,
          duration: 12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (sweepRef.current) {
        gsap.to(sweepRef.current, {
          attr: { opacity: 0.42 },
          duration: 4.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      contours.forEach((path, index) => {
        gsap.to(path, {
          x: index % 2 === 0 ? 8 : -8,
          duration: 14 + index * 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.25,
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // A restrained topographic/light-field composition.
  // The strongest detail deliberately lives around the edges,
  // leaving a clean visual pocket for the CTA typography.
  const contours = Array.from({ length: 9 }, (_, i) => {
    const y = 185 + i * 30;
    return `M -80 ${y + 65}
      C 120 ${y - 35}, 255 ${y + 15}, 390 ${y + 50}
      C 520 ${y + 82}, 650 ${y + 78}, 785 ${y + 20}
      C 930 ${y - 42}, 1090 ${y - 28}, 1260 ${y + 35}
      C 1400 ${y + 88}, 1530 ${y + 45}, 1680 ${y - 20}`;
  });

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="ctaLightBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ED1C2E" stopOpacity="0.12" />
          <stop offset="38%" stopColor="#ED1C2E" stopOpacity="0.045" />
          <stop offset="72%" stopColor="#ED1C2E" stopOpacity="0.012" />
          <stop offset="100%" stopColor="#ED1C2E" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ctaRedTrace" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ED1C2E" stopOpacity="0" />
          <stop offset="28%" stopColor="#ED1C2E" stopOpacity="0.10" />
          <stop offset="52%" stopColor="#ED1C2E" stopOpacity="0.65" />
          <stop offset="76%" stopColor="#ED1C2E" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ED1C2E" stopOpacity="0" />
        </linearGradient>

        <filter id="ctaBlur">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>

      {/* Large, soft light source — more atmosphere than "graphic". */}
      <ellipse
        ref={glowRef}
        cx="1190"
        cy="405"
        rx="420"
        ry="280"
        fill="url(#ctaLightBloom)"
        filter="url(#ctaBlur)"
        opacity="0.9"
      />

      {/* Fine topographic contours. The center stays intentionally quiet. */}
      {contours.map((d, index) => (
        <path
          key={d}
          ref={(el) => (contourRefs.current[index] = el)}
          d={d}
          fill="none"
          stroke="#000"
          strokeWidth={index === 4 ? "1" : "0.7"}
          opacity={index === 4 ? "0.09" : "0.045"}
          strokeLinecap="round"
        />
      ))}

      {/* One elegant red trace, like a signal crossing the environment. */}
      <path
        ref={sweepRef}
        d="M -80 690 C 260 570, 520 610, 800 540 S 1290 370, 1680 470"
        fill="none"
        stroke="url(#ctaRedTrace)"
        strokeWidth="1.2"
        opacity="0.26"
      />

      {/* Small endpoint — deliberately offset from the typography. */}
      <circle cx="1260" cy="412" r="3" fill="#ED1C2E" opacity="0.42" />
      <circle cx="1260" cy="412" r="14" fill="none" stroke="#ED1C2E" strokeWidth="0.7" opacity="0.10" />

      {/* Tiny technical markers at the perimeter. */}
      <path d="M 118 160 H 154" stroke="#000" strokeWidth="0.7" opacity="0.12" />
      <path d="M 1446 690 H 1482" stroke="#000" strokeWidth="0.7" opacity="0.12" />
      <circle cx="118" cy="160" r="2" fill="#ED1C2E" opacity="0.35" />
      <circle cx="1482" cy="690" r="2" fill="#ED1C2E" opacity="0.35" />
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
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
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
      <SignalField className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-[1600px] flex-col items-center justify-center px-6 py-28 text-center md:px-12 lg:px-16">
        <div className="final-cta-content flex max-w-[720px] flex-col items-center">
          <div className="mb-8 flex items-center gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-[#ed1c2e]">
              09
            </span>
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