 import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

function CyberGlobe({ active }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const rotationRef = useRef(0);

  const mouseRef = useRef({
    x: 0,
    y: 0,
  });

  const attackRef = useRef({
    index: 0,
    start: 0,
    duration: 2800,
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    window.addEventListener("resize", resize);

    /* =====================================================
       GLOBAL LOCATIONS
    ===================================================== */

    const locations = [
      { name: "NEW YORK", country: "USA", lat: 40.7, lon: -74 },
      { name: "LONDON", country: "UK", lat: 51.5, lon: -0.1 },
      { name: "BERLIN", country: "GERMANY", lat: 52.5, lon: 13.4 },
      { name: "SÃO PAULO", country: "BRAZIL", lat: -23.5, lon: -46.6 },
      { name: "CAPE TOWN", country: "SOUTH AFRICA", lat: -33.9, lon: 18.4 },
      { name: "DUBAI", country: "UAE", lat: 25.2, lon: 55.3 },
      { name: "MUMBAI", country: "INDIA", lat: 19, lon: 72.8 },
      { name: "SINGAPORE", country: "SINGAPORE", lat: 1.35, lon: 103.8 },
      { name: "TOKYO", country: "JAPAN", lat: 35.6, lon: 139.6 },
      { name: "SYDNEY", country: "AUSTRALIA", lat: -33.8, lon: 151.2 },
    ];

    /* =====================================================
       ATTACK SEQUENCE
    ===================================================== */

    const attackSequence = [0, 6, 8, 5, 3, 7, 1, 9, 4];

    /* =====================================================
       SURFACE DOTS (fibonacci sphere)
    ===================================================== */

    const surfacePoints = [];
    const POINT_COUNT = 460;

    for (let i = 0; i < POINT_COUNT; i++) {
      const y = 1 - (i / (POINT_COUNT - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;

      surfacePoints.push({
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
      });
    }

    /* =====================================================
       GOLD CYBER PARTICLES (shell just above the surface)
    ===================================================== */

    const cyberDots = [];

    for (let i = 0; i < 190; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.91 + Math.random() * 0.08;

      cyberDots.push({
        x: Math.sin(phi) * Math.cos(theta) * radius,
        y: Math.cos(phi) * radius,
        z: Math.sin(phi) * Math.sin(theta) * radius,
        phase: Math.random() * Math.PI * 2,
      });
    }

    /* =====================================================
       DEEP-SPACE STARFIELD — ambient backdrop, always alive
    ===================================================== */

    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.3 + Math.random() * 1.3,
      baseAlpha: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0011 + Math.random() * 0.0016,
      driftX: (Math.random() - 0.5) * 0.00003,
      driftY: (Math.random() - 0.5) * 0.00003,
    }));

    /* =====================================================
       METEOR STREAKS — rare, fast, theatrical
    ===================================================== */

    let meteor = null;
    let nextMeteorAt = performance.now() + 1800 + Math.random() * 2600;

    const maybeSpawnMeteor = (now) => {
      if (meteor || now < nextMeteorAt) return;

      meteor = {
        x: Math.random() * width * 0.7,
        y: -20,
        vx: 2.6 + Math.random() * 1.6,
        vy: 3.6 + Math.random() * 1.8,
        life: 1,
      };

      nextMeteorAt = now + 3200 + Math.random() * 5200;
    };

    const drawMeteor = () => {
      if (!meteor) return;

      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.life -= 0.018;

      if (meteor.life <= 0 || meteor.y > height + 40 || meteor.x > width + 40) {
        meteor = null;
        return;
      }

      const tailX = meteor.x - meteor.vx * 7;
      const tailY = meteor.y - meteor.vy * 7;

      const trail = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
      trail.addColorStop(0, "rgba(255,235,190,0)");
      trail.addColorStop(1, `rgba(255,235,190,${meteor.life * 0.9})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(meteor.x, meteor.y);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "rgba(255,225,170,0.8)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${meteor.life})`;
      ctx.fill();
    };

    /* =====================================================
       LOCATION CONVERSION
    ===================================================== */

    const locationTo3D = (location) => {
      const lat = (location.lat * Math.PI) / 180;
      const lon = (location.lon * Math.PI) / 180;

      return {
        x: Math.cos(lat) * Math.cos(lon),
        y: Math.sin(lat),
        z: Math.cos(lat) * Math.sin(lon),
      };
    };

    const location3D = locations.map(locationTo3D);

    /* =====================================================
       PROJECT 3D
    ===================================================== */

    const project = (point, rotation, tiltX) => {
      let x = point.x;
      let y = point.y;
      let z = point.z;

      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      const rotatedX = x * cosR - z * sinR;
      const rotatedZ = x * sinR + z * cosR;

      x = rotatedX;
      z = rotatedZ;

      const cosT = Math.cos(tiltX);
      const sinT = Math.sin(tiltX);

      const rotatedY = y * cosT - z * sinT;
      const rotatedZ2 = y * sinT + z * cosT;

      y = rotatedY;
      z = rotatedZ2;

      const radius = Math.min(width, height) * 0.38;
      const perspective = 1 / (1.65 - z * 0.3);

      return {
        x: width / 2 + x * radius * perspective,
        y: height / 2 + y * radius * perspective,
        z,
        scale: perspective,
      };
    };

    /* =====================================================
       ATTACK RADAR
    ===================================================== */

    const drawAttack = (point, progress) => {
      if (!point) return;

      const maxRadius = 82;

      for (let i = 0; i < 4; i++) {
        const ringProgress = (progress + i * 0.16) % 1;
        const radius = ringProgress * maxRadius;
        const opacity = (1 - ringProgress) * 0.75;

        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(237,28,46,${opacity})`;
        ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 46);
      glow.addColorStop(0, "rgba(237,28,46,0.55)");
      glow.addColorStop(0.25, "rgba(237,28,46,0.24)");
      glow.addColorStop(1, "rgba(237,28,46,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 46, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(point.x, point.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ed1c2e";
      ctx.shadowColor = "rgba(237,28,46,0.95)";
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    };

    /* =====================================================
       MAIN DRAW LOOP
    ===================================================== */

    const draw = () => {
      const now = Date.now();
      const perfNow = performance.now();

      ctx.clearRect(0, 0, width, height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const tiltX = mouseY * 0.12;

      if (active) {
        rotationRef.current += 0.0013;
      }

      const rotation = rotationRef.current;

      const centerX = width / 2;
      const centerY = height / 2;
      const globeRadius = Math.min(width, height) * 0.38;

      /* =================================================
         DEEP SPACE BACKDROP
      ================================================= */

      const backdrop = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, height) * 0.75
      );
      backdrop.addColorStop(0, "rgba(28,20,14,1)");
      backdrop.addColorStop(0.55, "rgba(10,9,9,1)");
      backdrop.addColorStop(1, "rgba(3,3,4,1)");
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, width, height);

      /* =================================================
         STARFIELD
      ================================================= */

      stars.forEach((star) => {
        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < 0) star.x = 1;
        if (star.x > 1) star.x = 0;
        if (star.y < 0) star.y = 1;
        if (star.y > 1) star.y = 0;

        const twinkle = star.baseAlpha + Math.sin(now * star.speed + star.phase) * 0.25;

        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, twinkle)})`;
        ctx.fill();
      });

      maybeSpawnMeteor(perfNow);
      drawMeteor();

      /* =================================================
         CURSOR-REACTIVE LIGHT
      ================================================= */

      const cursorPX = centerX + mouseX * globeRadius * 1.15;
      const cursorPY = centerY + mouseY * globeRadius * 1.15;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cursorGlow = ctx.createRadialGradient(cursorPX, cursorPY, 0, cursorPX, cursorPY, globeRadius * 0.9);
      cursorGlow.addColorStop(0, "rgba(255,205,120,0.16)");
      cursorGlow.addColorStop(0.4, "rgba(237,28,46,0.06)");
      cursorGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cursorGlow;
      ctx.beginPath();
      ctx.arc(cursorPX, cursorPY, globeRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* =================================================
         BREATHING HALO RINGS — the globe's ambient pulse
      ================================================= */

      const breath = 1 + Math.sin(now * 0.0012) * 0.02;

      for (let i = 0; i < 3; i++) {
        const ringProgress = ((now * 0.00022) + i * 0.34) % 1;
        const radius = globeRadius * (1.05 + ringProgress * 0.85) * breath;
        const opacity = (1 - ringProgress) * 0.16;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(199,149,27,${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* =================================================
         ATMOSPHERE — layered gold + red bloom
      ================================================= */

      const atmosphere = ctx.createRadialGradient(
        centerX - globeRadius * 0.3, centerY - globeRadius * 0.35, 10,
        centerX, centerY, globeRadius * 1.5 * breath
      );
      atmosphere.addColorStop(0, "rgba(255,205,110,0.32)");
      atmosphere.addColorStop(0.28, "rgba(255,180,80,0.16)");
      atmosphere.addColorStop(0.6, "rgba(237,28,46,0.09)");
      atmosphere.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = atmosphere;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.5 * breath, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* =================================================
         GLOBE BODY
      ================================================= */

      const globeGradient = ctx.createRadialGradient(
        centerX - globeRadius * 0.32, centerY - globeRadius * 0.32, 10,
        centerX, centerY, globeRadius
      );
      globeGradient.addColorStop(0, "rgba(92,74,44,0.55)");
      globeGradient.addColorStop(0.4, "rgba(38,32,24,0.6)");
      globeGradient.addColorStop(0.78, "rgba(14,12,10,0.78)");
      globeGradient.addColorStop(1, "rgba(4,4,5,0.92)");

      ctx.fillStyle = globeGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      /* =================================================
         GOLDEN RIM LIGHT
      ================================================= */

      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.015, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,205,110,0.7)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(255,205,110,0.65)";
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* =================================================
         GRID
      ================================================= */

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.7;

      for (let i = 0; i < 11; i++) {
        const angle = (Math.PI * i) / 10;

        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(Math.cos(angle)) * globeRadius, globeRadius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = -4; i <= 4; i++) {
        const lat = i / 5;
        const radius = Math.sqrt(Math.max(0, 1 - lat * lat)) * globeRadius;

        ctx.beginPath();
        ctx.ellipse(0, lat * globeRadius, radius, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      /* =================================================
         SURFACE NETWORK
      ================================================= */

      surfacePoints.forEach((point) => {
        const projected = project(point, rotation, tiltX);
        if (projected.z < 0.08) return;

        const size = 0.55 + projected.z * 0.9;
        const opacity = 0.18 + projected.z * 0.42;

        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });

      /* =================================================
         GOLD PARTICLES
      ================================================= */

      cyberDots.forEach((point) => {
        const projected = project(point, rotation, tiltX);
        if (projected.z < 0.16) return;

        const pulse = 0.6 + Math.sin(now * 0.002 + point.phase) * 0.35;

        ctx.beginPath();
        ctx.arc(projected.x, projected.y, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,205,110,${pulse})`;
        ctx.shadowColor = "rgba(255,205,110,0.75)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      /* =================================================
         PROJECT LOCATIONS
      ================================================= */

      const projectedLocations = location3D.map((point) => project(point, rotation, tiltX));

      /* =================================================
         ATTACK TIMER
      ================================================= */

      if (!attackRef.current.start) {
        attackRef.current.start = now;
      }

      let elapsed = now - attackRef.current.start;

      if (elapsed > attackRef.current.duration) {
        attackRef.current.index = (attackRef.current.index + 1) % attackSequence.length;
        attackRef.current.start = now;
        elapsed = 0;
      }

      const currentAttack = attackSequence[attackRef.current.index];
      const progress = elapsed / attackRef.current.duration;

      /* =================================================
         STATIC GOLD CONNECTIONS
      ================================================= */

      const connections = [
        [0, 1], [1, 2], [2, 6], [6, 7], [7, 8], [8, 9], [0, 3], [3, 4], [4, 5],
      ];

      connections.forEach(([aIndex, bIndex]) => {
        const a = projectedLocations[aIndex];
        const b = projectedLocations[bIndex];

        if (a.z < 0.2 || b.z < 0.2) return;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,205,110,0.28)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      /* =================================================
         ACTIVE THREAT + TRAVELING PACKET WITH FADING TRAIL
      ================================================= */

      const attackPoint = projectedLocations[currentAttack];

      if (attackPoint && attackPoint.z > 0.15) {
        drawAttack(attackPoint, progress);

        const destinations = [1, 6, 7, 8];
        const destinationIndex = destinations[attackRef.current.index % destinations.length];
        const destination = projectedLocations[destinationIndex];

        if (destination && destination.z > 0.15) {
          const travel = Math.min(1, progress * 1.35);

          const x = attackPoint.x + (destination.x - attackPoint.x) * travel;
          const y = attackPoint.y + (destination.y - attackPoint.y) * travel;

          ctx.beginPath();
          ctx.moveTo(attackPoint.x, attackPoint.y);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(237,28,46,${0.3 + travel * 0.55})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = "rgba(237,28,46,0.7)";
          ctx.shadowBlur = 9;
          ctx.stroke();
          ctx.shadowBlur = 0;

          for (let k = 5; k >= 0; k--) {
            const t = Math.max(0, travel - k * 0.045);
            const tx = attackPoint.x + (destination.x - attackPoint.x) * t;
            const ty = attackPoint.y + (destination.y - attackPoint.y) * t;
            const a = (1 - k / 6) * 0.85;

            ctx.beginPath();
            ctx.arc(tx, ty, k === 0 ? 3.2 : 1.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(237,28,46,${a})`;
            if (k === 0) {
              ctx.shadowColor = "#ed1c2e";
              ctx.shadowBlur = 16;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      /* =================================================
         CITY NODES
      ================================================= */

      projectedLocations.forEach((point, index) => {
        if (point.z < 0.18) return;

        const activeThreat = index === currentAttack;

        ctx.beginPath();
        ctx.arc(point.x, point.y, activeThreat ? 5 : 2.7, 0, Math.PI * 2);
        ctx.fillStyle = activeThreat ? "#ed1c2e" : "#ffcd78";

        ctx.shadowColor = activeThreat ? "rgba(237,28,46,0.95)" : "rgba(255,205,110,0.7)";
        ctx.shadowBlur = activeThreat ? 18 : 6;

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      /* =================================================
         CITY LABELS
      ================================================= */

      projectedLocations.forEach((point, index) => {
        if (point.z < 0.48) return;

        const location = locations[index];
        const activeThreat = index === currentAttack;
        const rightSide = point.x > centerX;
        const offsetX = rightSide ? 19 : -19;
        const offsetY = index % 2 === 0 ? -14 : 14;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x + offsetX * 0.6, point.y + offsetY * 0.6);
        ctx.strokeStyle = activeThreat ? "rgba(237,28,46,0.85)" : "rgba(255,255,255,0.22)";
        ctx.lineWidth = activeThreat ? 1.1 : 0.6;
        ctx.stroke();

        ctx.textAlign = rightSide ? "left" : "right";
        ctx.font = "600 9px Arial, sans-serif";
        ctx.fillStyle = activeThreat ? "#ed1c2e" : "rgba(255,255,255,0.86)";
        ctx.fillText(location.name, point.x + offsetX, point.y + offsetY);

        ctx.font = "7px Arial, sans-serif";
        ctx.fillStyle = activeThreat ? "#ed1c2e" : "#ffcd78";
        ctx.fillText(location.country, point.x + offsetX, point.y + offsetY + 10);
      });

      /* =================================================
         LAYERED ORBITING RINGS
      ================================================= */

      const ringPulse = 0.75 + Math.sin(now * 0.0016) * 0.25;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(now * 0.00008);
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.08, globeRadius * 0.28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,205,110,${0.42 * ringPulse})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(255,205,110,0.5)";
      ctx.shadowBlur = 9;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-now * 0.000055);
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.22, globeRadius * 0.44, 0.4, 0, Math.PI * 2);
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-now * 0.00013);
      ctx.beginPath();
      ctx.arc(0, 0, globeRadius * 1.1, -0.3, 0.2);
      ctx.strokeStyle = "rgba(237,28,46,0.85)";
      ctx.lineWidth = 2.4;
      ctx.shadowColor = "rgba(237,28,46,0.7)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      /* =================================================
         LOOP
      ================================================= */

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    /* =====================================================
       MOUSE
    ===================================================== */

    const handlePointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handlePointerLeave = () => {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [active]);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10"
      style={{
        background: "radial-gradient(120% 140% at 22% 12%, #1e1a14 0%, #100d0a 45%, #050505 100%)",
        boxShadow: "0 0 0 1px rgba(255,205,110,0.06), 0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      {/* faint scanline texture, matches the dark-chamber language used elsewhere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.045]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />

      <canvas ref={canvasRef} className="relative z-[2] h-full w-full" />

      {/* LIVE INDICATOR */}

      <div className="pointer-events-none absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute h-full w-full animate-ping rounded-full bg-[#ed1c2e] opacity-50" />
          <span className="relative h-2 w-2 rounded-full bg-[#ed1c2e]" />
        </span>

        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/75">
          Live threat intelligence
        </span>
      </div>

      {/* LEGEND */}

      <div className="pointer-events-none absolute bottom-6 right-6 z-20 hidden items-center gap-5 font-mono text-[8px] uppercase tracking-[0.15em] text-white/55 lg:flex">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffcd78] shadow-[0_0_6px_#ffcd78]" />
          Monitored
        </span>

        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ed1c2e] shadow-[0_0_6px_#ed1c2e]" />
          Active threat
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   GLOBAL THREAT INTELLIGENCE
========================================================= */

export default function GlobalThreatSection() {
  const sectionRef =
    useRef(null);

  const [statValues, setStatValues] =
    useState(
      STATS.map(() => 0)
    );

  const [globeActive, setGlobeActive] =
    useState(false);

  /* =======================================================
     COUNT UP
  ======================================================= */

  useEffect(() => {
    if (!sectionRef.current)
      return;

    let tweens = [];

    const ctx =
      gsap.context(() => {
        const startCount =
          () => {
            tweens.forEach(
              (tween) =>
                tween.kill()
            );

            tweens = [];

            setGlobeActive(true);

            STATS.forEach(
              (
                stat,
                index
              ) => {
                const counter = {
                  value: 0,
                };

                const tween =
                  gsap.to(
                    counter,
                    {
                      value:
                        stat.value,

                      duration: 2.6,

                      delay:
                        index *
                        0.15,

                      ease:
                        "power3.out",

                      onUpdate:
                        () => {
                          setStatValues(
                            (
                              previous
                            ) => {
                              const next =
                                [
                                  ...previous,
                                ];

                              next[index] =
                                counter.value;

                              return next;
                            }
                          );
                        },

                      onComplete:
                        () => {
                          setStatValues(
                            (
                              previous
                            ) => {
                              const next =
                                [
                                  ...previous,
                                ];

                              next[index] =
                                stat.value;

                              return next;
                            }
                          );
                        },
                    }
                  );

                tweens.push(
                  tween
                );
              }
            );
          };

        ScrollTrigger.create({
          trigger:
            sectionRef.current,

          start: "top 75%",

          end: "bottom 20%",

          onEnter:
            startCount,

          onEnterBack:
            startCount,

          onLeave: () =>
            setGlobeActive(
              false
            ),

          onLeaveBack: () =>
            setGlobeActive(
              false
            ),
        });
      }, sectionRef);

    return () => {
      tweens.forEach(
        (tween) =>
          tween.kill()
      );

      ctx.revert();
    };
  }, []);

  /* =======================================================
     SECTION REVEAL
  ======================================================= */

  useEffect(() => {
    if (!sectionRef.current)
      return;

    const ctx =
      gsap.context(() => {
        gsap.fromTo(
          ".global-threat-copy",
          {
            opacity: 0,
            y: 35,
          },
          {
            opacity: 1,
            y: 0,

            duration: 1,

            ease: "power3.out",

            scrollTrigger: {
              trigger:
                sectionRef.current,

              start: "top 78%",
            },
          }
        );

        gsap.fromTo(
          ".global-threat-globe",
          {
            opacity: 0,
            scale: 0.88,
            x: 45,
          },
          {
            opacity: 1,
            scale: 1,
            x: 0,

            duration: 1.4,

            ease: "power3.out",

            scrollTrigger: {
              trigger:
                sectionRef.current,

              start: "top 75%",
            },
          }
        );
      }, sectionRef);

    return () =>
      ctx.revert();
  }, []);

  /* =======================================================
     FORMAT
  ======================================================= */

  const formatStat = (
    format,
    value
  ) => {
    if (
      format ===
      "millions"
    ) {
      return `${(
        value / 1000000
      ).toFixed(1)}M`;
    }

    if (
      format ===
      "seconds"
    ) {
      return `${Math.round(
        value
      )}s`;
    }

    return Math.round(
      value
    ).toString();
  };

  return (
    <section
      ref={sectionRef}
      id="global-threat-intelligence"
      className="relative min-h-screen overflow-hidden bg-white text-black"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] items-center px-6 py-24 md:px-12 lg:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-0">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="global-threat-copy relative z-10 max-w-[650px]">

            <div className="mb-7 flex items-center gap-3">
              <span className="font-mono text-xs tracking-[0.2em] text-[#ed1c2e]">
                08
              </span>

              <span className="h-px w-8 bg-[#ed1c2e]" />

              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/55">
                Global Threat Intelligence
              </span>
            </div>

            <h2 className="max-w-[620px] text-[clamp(3.2rem,5.2vw,6.2rem)] font-semibold leading-[0.91] tracking-[-0.055em]">
              One environment.
              <br />

              <span className="transition-colors duration-300 hover:text-[#ed1c2e]">
                A world of context.
              </span>
            </h2>

            <p className="mt-8 max-w-[570px] text-[clamp(1.05rem,1.3vw,1.32rem)] leading-[1.55] tracking-[-0.015em] text-black/65">
              Every incident SAOM AI
              resolves sharpens the
              picture for every
              customer it protects.
              Attack patterns
              surfacing on one
              network inform
              detection on all of
              them, within minutes.
            </p>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="mt-12">
              <div className="mb-6 h-px w-full bg-black/15" />

              <div className="grid grid-cols-3">
                {STATS.map(
                  (
                    stat,
                    index
                  ) => (
                    <div
                      key={
                        stat.label
                      }
                      className="group cursor-default border-r border-black/10 px-5 first:pl-0 last:border-r-0 last:pr-0"
                    >
                      <div className="transition-transform duration-300 group-hover:-translate-y-1">

                        <p className="text-[clamp(2rem,3.4vw,3.6rem)] font-semibold leading-none tracking-[-0.055em] text-black transition-colors duration-300 group-hover:text-[#ed1c2e]">
                          {formatStat(
                            stat.format,
                            statValues[
                              index
                            ]
                          )}
                        </p>

                        <div className="mt-4 flex items-start gap-2">
                          <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#ed1c2e]" />

                          <p className="max-w-[140px] text-[10px] font-medium uppercase leading-[1.4] tracking-[0.08em] text-black/55">
                            {
                              stat.label
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* =================================================
                STATUS
            ================================================= */}

            <div className="mt-9 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#ed1c2e] opacity-40" />

                <span className="relative h-2 w-2 rounded-full bg-[#ed1c2e]" />
              </span>

              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
                Global intelligence
                continuously
                learning
              </span>
            </div>
          </div>

          {/* =================================================
              GLOBE
          ================================================= */}

          <div className="global-threat-globe relative h-[520px] w-full lg:h-[720px]">
            <CyberGlobe
              active={
                globeActive
              }
            />
          </div>
        </div>
      </div>

      <style>{`
        #global-threat-intelligence canvas {
          display: block;
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