   import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  {
    value: 2400000,
    label: "Signals correlated / day",
    format: "millions",
  },
  {
    value: 38,
    label: "Median time to context",
    format: "seconds",
  },
  {
    value: 46,
    label: "Regions monitored",
    format: "number",
  },
];

/*
  These are real geographic coordinates. The attack itself is a fictional
  visualization of a threat moving through real locations.
*/
const LOCATIONS = [
  { id: "new-york", city: "NEW YORK", country: "USA", lat: 40.7128, lon: -74.006 },
  { id: "london", city: "LONDON", country: "UK", lat: 51.5072, lon: -0.1276 },
  { id: "berlin", city: "BERLIN", country: "GERMANY", lat: 52.52, lon: 13.405 },
  { id: "saopaulo", city: "SÃO PAULO", country: "BRAZIL", lat: -23.5505, lon: -46.6333 },
  { id: "capetown", city: "CAPE TOWN", country: "SOUTH AFRICA", lat: -33.9249, lon: 18.4241 },
  { id: "dubai", city: "DUBAI", country: "UAE", lat: 25.2048, lon: 55.2708 },
  { id: "mumbai", city: "MUMBAI", country: "INDIA", lat: 19.076, lon: 72.8777 },
  { id: "singapore", city: "SINGAPORE", country: "SINGAPORE", lat: 1.3521, lon: 103.8198 },
  { id: "tokyo", city: "TOKYO", country: "JAPAN", lat: 35.6762, lon: 139.6503 },
  { id: "sydney", city: "SYDNEY", country: "AUSTRALIA", lat: -33.8688, lon: 151.2093 },
];

const ATTACK_PATH = [
  "new-york",
  "london",
  "berlin",
  "dubai",
  "mumbai",
  "singapore",
  "tokyo",
];

const locationMap = Object.fromEntries(LOCATIONS.map((location) => [location.id, location]));

/* Country ISO numeric codes used by Natural Earth / world-atlas. */
const TARGET_COUNTRY_IDS = new Set([
  "840", // USA
  "826", // UK
  "276", // Germany
  "076", // Brazil
  "710", // South Africa
  "784", // UAE
  "356", // India
  "702", // Singapore
  "392", // Japan
  "036", // Australia
]);

function formatStat(format, value) {
  if (format === "millions") return `${(value / 1000000).toFixed(1)}M`;
  if (format === "seconds") return `${Math.round(value)}s`;
  return Math.round(value).toString();
}

function RealWorldGlobe({ active }) {
  const globeRef = useRef(null);
  const [rotation, setRotation] = useState([8, -8, 0]);
  const [attackIndex, setAttackIndex] = useState(0);
  const [attackProgress, setAttackProgress] = useState(0);
  const [hovered, setHovered] = useState(null);

  const countries = useMemo(
    () => feature(world, world.objects.countries).features,
    []
  );

  const graticule = useMemo(() => geoGraticule10(), []);

  /*
    The projection is rebuilt from the current rotation. This gives us a
    genuine geographic globe rather than hand-built continent polygons.
  */
  const projection = useMemo(() => {
    return geoOrthographic()
      .rotate([-rotation[0], -rotation[1], -rotation[2]])
      .translate([50, 50])
      .scale(46)
      .clipAngle(90);
  }, [rotation]);


  // Dense, restrained intelligence points laid across the real globe.
  // These create the illuminated-grid feeling from the reference without
  // replacing the actual geography.
  const path = useMemo(() => geoPath(projection), [projection]);

  const projectedLocation = (location) => {
    const point = projection([location.lon, location.lat]);
    if (!point) return null;

    const inverted = projection.invert(point);
    if (!inverted) return null;

    return {
      x: point[0],
      y: point[1],
      visible: Math.abs(inverted[1] - location.lat) < 0.01,
    };
  };

  /*
    Keep the globe centered inside a viewBox. The 100x100 coordinate system
    scales cleanly on desktop and mobile.
  */
  useEffect(() => {
    if (!active) return undefined;

    let frame;
    let last = performance.now();
    let attackStart = performance.now();

    const tick = (now) => {
      const dt = now - last;
      last = now;

      if (dt > 0) {
        setRotation((previous) => [
          previous[0] + dt * 0.0032,
          previous[1],
          previous[2],
        ]);
      }

      const elapsed = now - attackStart;
      const duration = 2800;
      const progress = Math.min(1, elapsed / duration);

      setAttackProgress(progress);

      if (progress >= 1) {
        attackStart = now;
        setAttackIndex((previous) => (previous + 1) % (ATTACK_PATH.length - 1));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [active]);

  const activeSource = locationMap[ATTACK_PATH[attackIndex]];
  const activeTarget = locationMap[ATTACK_PATH[attackIndex + 1]];

  const sourcePoint = activeSource ? projectedLocation(activeSource) : null;
  const targetPoint = activeTarget ? projectedLocation(activeTarget) : null;

  /*
    Great-circle attack route. geoInterpolate follows the Earth's surface,
    so the red route follows the real globe rather than a flat SVG line.
  */
  const attackPoints = useMemo(() => {
    if (!activeSource || !activeTarget) return [];

    const interpolate = geoInterpolate(
      [activeSource.lon, activeSource.lat],
      [activeTarget.lon, activeTarget.lat]
    );

    return Array.from({ length: 25 }, (_, index) => {
      const point = projection(interpolate(index / 24));
      return point;
    });
  }, [activeSource, activeTarget, projection]);

  const visibleAttackPoints = attackPoints.filter(Boolean);

  const attackPoint =
    visibleAttackPoints.length > 0
      ? visibleAttackPoints[
          Math.min(
            visibleAttackPoints.length - 1,
            Math.floor(attackProgress * (visibleAttackPoints.length - 1))
          )
        ]
      : null;

  const targetIsVisible = targetPoint?.visible;
  const sourceIsVisible = sourcePoint?.visible;

  return (
    <div
      ref={globeRef}
      className="relative h-full w-full"
      onMouseLeave={() => setHovered(null)}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Real-world global threat intelligence globe"
      >
        <defs>
          <radialGradient id="globeLight" cx="45%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="65%" stopColor="#fff7f8" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#ffecef" stopOpacity="0.45" />
          </radialGradient>

          <radialGradient id="countryGlow">
            <stop offset="0%" stopColor="#e4002b" stopOpacity="0.42" />
            <stop offset="70%" stopColor="#e4002b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e4002b" stopOpacity="0" />
          </radialGradient>

          <filter id="softRedGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="attackGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="gridGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="0.55" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="sideLight">
            <stop offset="0%" stopColor="#e4002b" stopOpacity="0.26" />
            <stop offset="35%" stopColor="#e4002b" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#e4002b" stopOpacity="0" />
          </radialGradient>

          <filter id="countryGlowFilter" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.75" result="blur" />
            <feFlood floodColor="#e4002b" floodOpacity="0.48" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="globeClip">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>

        {/* Soft page-blending atmosphere */}
        <circle
          cx="50"
          cy="50"
          r="49"
          fill="url(#globeLight)"
          opacity="0.76"
        />

        {/* Fine outer intelligence rings */}
        <circle
          cx="50"
          cy="50"
          r="47.8"
          fill="none"
          stroke="#e4002b"
          strokeOpacity="0.10"
          strokeWidth="0.25"
        />
        <circle
          cx="50"
          cy="50"
          r="48.8"
          fill="none"
          stroke="#e4002b"
          strokeOpacity="0.07"
          strokeWidth="0.18"
          strokeDasharray="1 2"
        />

        {/* Soft illuminated halos on the sides, inspired by the reference. */}
        <circle
          cx="4"
          cy="38"
          r="15"
          fill="url(#sideLight)"
          opacity="0.52"
          filter="url(#softRedGlow)"
        />
        <circle
          cx="96"
          cy="58"
          r="17"
          fill="url(#sideLight)"
          opacity="0.48"
          filter="url(#softRedGlow)"
        />

        <g clipPath="url(#globeClip)">
          {/* Actual geographic globe */}
          <circle cx="50" cy="50" r="46" fill="url(#globeLight)" />

          {/* Soft red depth wash: keeps the globe bright while giving the
              actual countries enough contrast to read immediately. */}
          <circle
            cx="50"
            cy="50"
            r="45.6"
            fill="none"
            stroke="#8d1730"
            strokeOpacity="0.07"
            strokeWidth="2.2"
          />

          {/* Real latitude / longitude grid */}
          <path
            d={path(graticule)}
            fill="none"
            stroke="#e4002b"
            strokeOpacity="0.18"
            strokeWidth="0.20"
            filter="url(#gridGlow)"
          />

          {/* Actual country boundaries from world-atlas */}
          {countries.map((country) => {
            const id = String(country.id).padStart(3, "0");
            const isTargetCountry = TARGET_COUNTRY_IDS.has(id);

            return (
              <path
                key={country.id}
                d={path(country)}
                fill={
                  isTargetCountry
                    ? "rgba(228,0,43,0.20)"
                    : "rgba(85,20,30,0.10)"
                }
                stroke="#e4002b"
                strokeOpacity={isTargetCountry ? 0.52 : 0.22}
                strokeWidth={isTargetCountry ? 0.30 : 0.16}
                style={{
                  filter: isTargetCountry
                    ? "drop-shadow(0 0 1.8px rgba(228,0,43,0.72))"
                    : "none",
                  opacity: isTargetCountry ? 0.94 : 0.72,
                }}
                className={isTargetCountry ? "country-glow" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Soft glow under monitored countries */}
          {LOCATIONS.map((location) => {
            const point = projectedLocation(location);
            if (!point?.visible) return null;

            return (
              <circle
                key={`glow-${location.id}`}
                cx={point.x}
                cy={point.y}
                r="3.8"
                fill="url(#countryGlow)"
                opacity="0.28"
              />
            );
          })}

          {/* Active great-circle attack route */}
          {visibleAttackPoints.length > 1 && (
            <>
              <polyline
                points={visibleAttackPoints.map(([x, y]) => `${x},${y}`).join(" ")}
                fill="none"
                stroke="#e4002b"
                strokeOpacity="0.24"
                strokeWidth="0.75"
                filter="url(#softRedGlow)"
              />

              <polyline
                points={visibleAttackPoints.map(([x, y]) => `${x},${y}`).join(" ")}
                fill="none"
                stroke="#e4002b"
                strokeOpacity="0.92"
                strokeWidth="0.38"
                filter="url(#softRedGlow)"
              />
            </>
          )}

          {/* Real locations */}
          {LOCATIONS.map((location) => {
            const point = projectedLocation(location);
            if (!point?.visible) return null;

            const isSource = location.id === activeSource?.id;
            const isTarget = location.id === activeTarget?.id;
            const isHovered = hovered === location.id;

            return (
              <g
                key={location.id}
                className="cursor-crosshair"
                onMouseEnter={() => setHovered(location.id)}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isTarget ? 2.1 : isSource ? 1.5 : 0.85}
                  fill={isTarget || isSource ? "#e4002b" : "#b9153c"}
                  opacity={isTarget || isSource ? 1 : 0.75}
                  filter={isTarget ? "url(#attackGlow)" : undefined}
                />

                {(isTarget || isSource || isHovered) && (
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isTarget ? 4.2 : 2.8}
                      fill="none"
                      stroke="#e4002b"
                      strokeOpacity={isTarget ? 0.38 : 0.20}
                      strokeWidth="0.3"
                    />

                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.x + 3}
                      y2={point.y - 2}
                      stroke="#e4002b"
                      strokeOpacity="0.48"
                      strokeWidth="0.22"
                    />

                    <text
                      x={point.x + 3.5}
                      y={point.y - 2.3}
                      fill="#4c1d29"
                      fontSize="2.05"
                      fontWeight="700"
                      letterSpacing="0.04em"
                    >
                      {location.city}
                    </text>

                    <text
                      x={point.x + 3.5}
                      y={point.y + 0.1}
                      fill="#e4002b"
                      fillOpacity="0.72"
                      fontSize="1.45"
                      letterSpacing="0.05em"
                    >
                      {location.country}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Traveling attack packet */}
          {attackPoint && sourceIsVisible && targetIsVisible && (
            <>
              <circle
                cx={attackPoint[0]}
                cy={attackPoint[1]}
                r="2.6"
                fill="url(#countryGlow)"
                filter="url(#attackGlow)"
              />

              <circle
                cx={attackPoint[0]}
                cy={attackPoint[1]}
                r="0.85"
                fill="#e4002b"
                filter="url(#attackGlow)"
              />

              <circle
                cx={attackPoint[0]}
                cy={attackPoint[1]}
                r="1.9"
                fill="none"
                stroke="#e4002b"
                strokeOpacity="0.38"
                strokeWidth="0.28"
              />
            </>
          )}
        </g>

        {/* Side intelligence arcs: the "lights on the sides" feeling from
            the reference, kept subtle so the globe remains editorial. */}
        <path
          d="M 8 31 A 43 43 0 0 0 6 49"
          fill="none"
          stroke="#e4002b"
          strokeOpacity="0.30"
          strokeWidth="0.40"
          strokeLinecap="round"
          filter="url(#softRedGlow)"
          className="globe-side-glow"
        />
        <path
          d="M 92 66 A 43 43 0 0 0 94 48"
          fill="none"
          stroke="#e4002b"
          strokeOpacity="0.34"
          strokeWidth="0.48"
          strokeLinecap="round"
          filter="url(#softRedGlow)"
          className="globe-side-glow globe-side-glow-delay"
        />

        {/* Globe rim */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#e4002b"
          strokeOpacity="0.30"
          strokeWidth="0.34"
        />

        {/* Small active scan arc */}
        <path
          d="M 82 23 A 37 37 0 0 1 92 42"
          fill="none"
          stroke="#e4002b"
          strokeOpacity="0.62"
          strokeWidth="0.55"
          strokeLinecap="round"
          filter="url(#softRedGlow)"
        />
      </svg>

      {/* Minimal live status — no heavy card */}
      <div className="pointer-events-none absolute left-[9%] top-[7%] flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute h-full w-full animate-ping rounded-full bg-[#e4002b] opacity-35" />
          <span className="relative h-2 w-2 rounded-full bg-[#e4002b]" />
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-black/50">
          Live threat intelligence
        </span>
      </div>

      {/* Live threat feed — deliberately light so it feels editorial, not like a dashboard. */}
      <div className="pointer-events-none absolute right-[4%] top-[7%] hidden w-[180px] rounded-2xl border border-[#e4002b]/10 bg-white/55 p-4 backdrop-blur-sm lg:block">
        <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-black/42">
          Live threats
        </p>

        <div className="mt-3 space-y-2.5">
          {[
            ["Brute Force Attempt", "00:12"],
            ["Malware Communication", "00:28"],
            ["Suspicious Login", "00:41"],
            ["DDoS Activity", "01:03"],
            ["Data Exfiltration", "01:27"],
          ].map(([label, time]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e4002b] shadow-[0_0_7px_rgba(228,0,43,0.7)]" />
                <span className="truncate font-mono text-[8px] text-black/55">{label}</span>
              </span>
              <span className="font-mono text-[8px] text-black/35">{time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attack readout */}
      {activeSource && activeTarget && (
        <div className="pointer-events-none absolute bottom-[8%] left-[8%] font-mono text-[8px] uppercase tracking-[0.14em] text-black/45">
          <span className="text-[#e4002b]">ACTIVE PATH</span>
          <span className="mx-2">/</span>
          {activeSource.country}
          <span className="mx-1">→</span>
          {activeTarget.country}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   GLOBAL THREAT INTELLIGENCE
========================================================= */

export default function GlobalThreatSection() {
  const sectionRef = useRef(null);
  const globeWrapRef = useRef(null);

  const [statValues, setStatValues] = useState(STATS.map(() => 0));
  const [globeActive, setGlobeActive] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return undefined;

    let tweens = [];

    const ctx = gsap.context(() => {
      const startCount = () => {
        tweens.forEach((tween) => tween.kill());
        tweens = [];

        setGlobeActive(true);

        STATS.forEach((stat, index) => {
          const counter = { value: 0 };

          const tween = gsap.to(counter, {
            value: stat.value,
            duration: 2.4,
            delay: index * 0.15,
            ease: "power3.out",
            onUpdate: () => {
              setStatValues((previous) => {
                const next = [...previous];
                next[index] = counter.value;
                return next;
              });
            },
            onComplete: () => {
              setStatValues((previous) => {
                const next = [...previous];
                next[index] = stat.value;
                return next;
              });
            },
          });

          tweens.push(tween);
        });
      };

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%",
        end: "bottom 20%",
        onEnter: startCount,
        onEnterBack: startCount,
        onLeave: () => setGlobeActive(false),
        onLeaveBack: () => setGlobeActive(false),
      });
    }, sectionRef);

    return () => {
      tweens.forEach((tween) => tween.kill());
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !globeWrapRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".global-threat-copy",
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
          },
        }
      );

      /*
        The globe enters from the right, but the opacity and blur make it
        feel like it is being revealed from the white page rather than
        dropped into a box.
      */
      gsap.fromTo(
        globeWrapRef.current,
        {
          opacity: 0,
          x: -110,
          scale: 0.92,
          filter: "blur(12px)",
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.45,
          ease: "power4.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global-threat-intelligence"
      className="relative min-h-screen overflow-hidden bg-white text-black"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] items-center px-6 py-24 md:px-12 lg:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-0">
          {/* LEFT */}
          <div className="global-threat-copy relative z-10 max-w-[650px]">
            <h2 className="max-w-[620px] text-[clamp(3.2rem,5.2vw,6.2rem)] font-semibold leading-[0.91] tracking-[-0.055em]">
              One environment.
              <br />
              <span className="transition-colors duration-300 hover:text-[#e4002b]">
                A world of context.
              </span>
            </h2>

            <p className="mt-8 max-w-[570px] text-[clamp(1.05rem,1.3vw,1.32rem)] leading-[1.55] tracking-[-0.015em] text-black/65">
              Every incident SAOM AI resolves sharpens the picture for every
              customer it protects. Attack patterns surfacing on one network
              inform detection on all of them, within minutes.
            </p>

            {/* STATS */}
            <div className="mt-12">
              <div className="mb-6 h-px w-full bg-black/15" />

              <div className="grid grid-cols-3">
                {STATS.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="group cursor-default border-r border-black/10 px-5 first:pl-0 last:border-r-0 last:pr-0"
                  >
                    <div className="transition-transform duration-300 group-hover:-translate-y-1">
                      <p className="text-[clamp(2rem,3.4vw,3.6rem)] font-semibold leading-none tracking-[-0.055em] text-black transition-colors duration-300 group-hover:text-[#e4002b]">
                        {formatStat(stat.format, statValues[index])}
                      </p>

                      <div className="mt-4 flex items-start gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e4002b]" />

                        <p className="max-w-[140px] text-[10px] font-medium uppercase leading-[1.4] tracking-[0.08em] text-black/55">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STATUS */}
            <div className="mt-9 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#e4002b] opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-[#e4002b]" />
              </span>

              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
                Global intelligence continuously learning
              </span>
            </div>
          </div>

          {/* REAL WORLD GLOBE */}
          <div
            ref={globeWrapRef}
            className="global-threat-globe relative h-[520px] w-full lg:h-[720px]"
          >
            <RealWorldGlobe active={globeActive} />
          </div>
        </div>
      </div>

      <style>{`
        #global-threat-intelligence svg {
          display: block;
          overflow: visible;
        }

        #global-threat-intelligence .country-glow {
          animation: countryPulse 2.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        @keyframes countryPulse {
          0%, 100% { opacity: 0.72; }
          50% { opacity: 1; }
        }

        #global-threat-intelligence .globe-side-glow {
          animation: sideGlow 2.8s ease-in-out infinite;
        }

        #global-threat-intelligence .globe-side-glow-delay {
          animation-delay: -1.35s;
        }

        @keyframes sideGlow {
          0%, 100% { opacity: 0.28; }
          50% { opacity: 0.82; }
        }

        @media (max-width: 768px) {
          #global-threat-intelligence {
            min-height: auto;
          }

          .global-threat-globe {
            height: 430px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          #global-threat-intelligence *,
          #global-threat-intelligence *::before,
          #global-threat-intelligence *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}
