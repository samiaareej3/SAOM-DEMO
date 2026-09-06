import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import NetworkField from "./NetworkField.jsx";

/* ============================================================
   AuthDoors — shared "three-door" authentication chamber
   ============================================================
   Purely presentational + layout mechanics. Carries no auth
   state and makes no API calls. Each route page (Signin,
   Signup, Forget) supplies its own eyebrow/title/form as
   `children` and tells this shell which door is active; the
   other two doors render as closed architectural panels that
   navigate via React Router when opened.

   ANIMATION SPLIT (per project convention):
   - GSAP owns the physical door mechanics: flex-basis of the
     three panels (their "width" along the layout's main axis,
     which is horizontal on desktop and vertical on mobile).
   - Framer Motion owns everything inside a panel: the active
     form's entrance, the closed-face micro hover-tilt, and the
     eyebrow/heading text.
   Neither ever touches the other's property on the same node.
   ============================================================ */

const DOOR_LAYOUT = {
  signin: { left: "56%", center: "10%", right: "34%" },
  forgot: { left: "23%", center: "54%", right: "23%" },
  signup: { left: "34%", center: "10%", right: "56%" },
};

const NEUTRAL_LAYOUT = { left: "38%", center: "24%", right: "38%" };

const DOOR_EASE = "power4.inOut";
const DOOR_DURATION = 1.05;
const DOOR_DELAY = 0.15;

/* ------------------------------------------------------------
   Wordmark — UNCHANGED. Do not restyle, animate, or re-brand.
   ------------------------------------------------------------ */

export function Wordmark({ tone = "ink" }) {
  return (
    <span
      className={`font-mono-tech text-sm tracking-[0.15em] ${
        tone === "paper" ? "text-paper" : "text-ink"
      }`}
    >
      SAOM<span className="text-signal">.</span>AI
    </span>
  );
}

/* ------------------------------------------------------------
   Small shared presentational primitives
   ------------------------------------------------------------ */

export function SignalDot({ className = "" }) {
  return (
    <span className={`relative flex h-1.5 w-1.5 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
    </span>
  );
}

export function StatusTicker({ messages, className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2600);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <span className={`relative inline-block h-4 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={messages[index]}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {messages[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* `surface` switches label/input/banner colors between the dark
   side-doors (Sign In / Sign Up) and the bright center opening
   (Forgot Password) — a color swap only, never touching any
   field name, id, value, or handler. */

export function FieldLabel({ htmlFor, children, surface = "dark" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block text-sm ${
        surface === "dark" ? "text-paper/65" : "text-ink/70"
      }`}
    >
      {children}
    </label>
  );
}

export function StatusBanner({ tone = "error", surface = "dark", children }) {
  const errorStyles =
    surface === "dark"
      ? "border-signal/35 bg-signal/[0.1] text-[#ff8a97]"
      : "border-signal/25 bg-signal/[0.06] text-[#b3001f]";
  const successStyles =
    surface === "dark"
      ? "border-paper/20 bg-paper/[0.06] text-paper/85"
      : "border-ink/15 bg-ink/[0.04] text-ink/80";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-4 py-3 text-sm ${
        tone === "error" ? errorStyles : successStyles
      }`}
      role="status"
    >
      {children}
    </motion.div>
  );
}

export function SubmitButton({ children, disabled, surface = "dark", className = "" }) {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 20, mass: 0.3 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 20, mass: 0.3 });

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  const surfaceStyles =
    surface === "dark"
      ? "border-paper bg-paper text-ink hover:border-signal hover:bg-signal hover:text-paper disabled:hover:border-paper disabled:hover:bg-paper disabled:hover:text-ink"
      : "border-ink bg-ink text-paper hover:border-signal hover:bg-signal disabled:hover:border-ink disabled:hover:bg-ink";

  return (
    <motion.button
      ref={ref}
      type="submit"
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={`group relative inline-flex w-full items-center justify-center gap-3 border px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-500 ease-signal disabled:cursor-not-allowed disabled:opacity-50 ${surfaceStyles} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function RequirementRow({ met, surface = "dark", children }) {
  const mutedTone = surface === "dark" ? "text-paper/35" : "text-ink/35";
  return (
    <span className={met ? "text-emerald-500" : mutedTone}>
      {met ? "✓" : "○"} {children}
    </span>
  );
}

/* ------------------------------------------------------------
   Closed door face — shown for the two inactive doors. Clicking
   anywhere navigates to that door's route; the actual page
   opens fresh there with that door active.
   ------------------------------------------------------------ */

function GridOverlay({ tone }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          tone === "dark"
            ? "linear-gradient(rgba(245,243,238,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,.6) 1px, transparent 1px)"
            : "linear-gradient(rgba(10,10,10,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,.5) 1px, transparent 1px)",
        backgroundSize: "38px 38px",
      }}
    />
  );
}

function DoorFace({ index, label, hint, arrow, onOpen, tone }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ rotateY: tone === "dark" ? -3 : 3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d" }}
      className={`relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden px-4 py-8 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 ${
        tone === "dark" ? "bg-ink" : "bg-paper"
      }`}
    >
      {tone === "dark" ? (
        <NetworkField className="pointer-events-none absolute inset-0 opacity-30" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 15%, #f5f3ee 0%, #e7e4dc 45%, #cfccc3 75%, #b9b6ac 100%)",
          }}
        />
      )}
      <GridOverlay tone={tone} />

      <span
        className={`font-mono-tech relative z-10 text-[10px] tracking-[0.2em] ${
          tone === "dark" ? "text-paper/45" : "text-ink/40"
        }`}
      >
        {index}
      </span>

      <h3
        className={`relative z-10 font-sans text-2xl font-semibold tracking-[-0.02em] md:text-3xl ${
          tone === "dark" ? "text-paper" : "text-ink"
        }`}
      >
        {label}
      </h3>

      <span
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-base transition-colors duration-500 ${
          tone === "dark"
            ? "border-paper/25 text-paper"
            : "border-ink/20 text-ink"
        }`}
      >
        {arrow}
      </span>

      <span
        className={`font-mono-tech relative z-10 text-[10px] tracking-[0.22em] ${
          tone === "dark" ? "text-paper/40" : "text-ink/45"
        }`}
      >
        {hint}
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------
   Stage chrome — logo + tiny technical labels shared across all
   three doors, positioned above the composition.
   ------------------------------------------------------------ */

function StageChrome() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 py-5 md:px-8 md:py-7">
      <span className="font-mono-tech hidden max-w-[16ch] text-[10px] leading-relaxed tracking-[0.14em] text-paper/45 sm:block">
        DETECT / ANALYZE
        <br />
        RESPOND · AUTONOMOUSLY
      </span>

      <a href="/" className="pointer-events-auto inline-block">
        <Wordmark tone="paper" />
      </a>

      <span className="font-mono-tech hidden max-w-[18ch] text-right text-[10px] leading-relaxed tracking-[0.14em] text-paper/45 sm:block">
        SECURITY · INTELLIGENCE
        <br />
        AUTOMATION
      </span>
    </div>
  );
}

/* ============================================================
   AuthDoors — main export
   ============================================================ */

function AuthDoors({ active, children }) {
  const stageRef = useRef(null);
  const leftRef = useRef(null);
  const centerRef = useRef(null);
  const rightRef = useRef(null);
  const [mechanicalReady, setMechanicalReady] = useState(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    setMechanicalReady(false);
    const targets = DOOR_LAYOUT[active];

    const ctx = gsap.context(() => {
      gsap.set(leftRef.current, { flexBasis: NEUTRAL_LAYOUT.left });
      gsap.set(centerRef.current, { flexBasis: NEUTRAL_LAYOUT.center });
      gsap.set(rightRef.current, { flexBasis: NEUTRAL_LAYOUT.right });

      const tl = gsap.timeline({
        delay: DOOR_DELAY,
        defaults: { duration: DOOR_DURATION, ease: DOOR_EASE },
      });

      tl.to(leftRef.current, { flexBasis: targets.left }, 0)
        .to(centerRef.current, { flexBasis: targets.center }, 0)
        .to(rightRef.current, { flexBasis: targets.right }, 0)
        .call(() => setMechanicalReady(true), null, "-=0.35");
    }, stageRef);

    return () => ctx.revert();
  }, [active]);

  return (
    <div
      ref={stageRef}
      className="relative min-h-[100svh] w-full overflow-hidden bg-ink px-3 py-4 sm:px-5 sm:py-6 lg:p-8"
    >
      <StageChrome />

      <div className="relative mx-auto flex h-[calc(100svh-2rem)] w-full max-w-[1500px] flex-col overflow-hidden rounded-[22px] border border-paper/10 sm:h-[calc(100svh-3rem)] sm:rounded-[28px] lg:h-[calc(100svh-4rem)] lg:flex-row">
        {/* LEFT DOOR — Sign In */}
        <div
          ref={leftRef}
          className="relative min-h-[64px] overflow-hidden lg:min-h-0"
          style={{ flexBasis: NEUTRAL_LAYOUT.left, flexGrow: 0, flexShrink: 0 }}
        >
          {active === "signin" ? (
            <AnimatePresence>
              {mechanicalReady && (
                <motion.div
                  key="signin-open"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <DoorFace
              index="01"
              label="Sign In"
              hint="SLIDE RIGHT TO SIGN IN"
              arrow="→"
              tone="dark"
              onOpen={() => navigate("/signin")}
            />
          )}
        </div>

        {/* CENTER — Forgot Password */}
        <div
          ref={centerRef}
          className="relative min-h-[64px] overflow-hidden border-y border-paper/10 lg:min-h-0 lg:border-x lg:border-y-0"
          style={{ flexBasis: NEUTRAL_LAYOUT.center, flexGrow: 0, flexShrink: 0 }}
        >
          {active === "forgot" ? (
            <AnimatePresence>
              {mechanicalReady && (
                <motion.div
                  key="forgot-open"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <DoorFace
              index="02"
              label="Forgot Password?"
              hint="SLIDE UP TO DISCOVER"
              arrow="↑"
              tone="light"
              onOpen={() => navigate("/forgot-password")}
            />
          )}
        </div>

        {/* RIGHT DOOR — Sign Up */}
        <div
          ref={rightRef}
          className="relative min-h-[64px] overflow-hidden lg:min-h-0"
          style={{ flexBasis: NEUTRAL_LAYOUT.right, flexGrow: 0, flexShrink: 0 }}
        >
          {active === "signup" ? (
            <AnimatePresence>
              {mechanicalReady && (
                <motion.div
                  key="signup-open"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <DoorFace
              index="03"
              label="Sign Up"
              hint="SLIDE LEFT TO SIGN UP"
              arrow="←"
              tone="dark"
              onOpen={() => navigate("/signup")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthDoors;