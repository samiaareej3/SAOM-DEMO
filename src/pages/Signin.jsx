import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import MagneticButton from "../components/MagneticButton.jsx";
import HoverInvert from "../components/HoverInvert.jsx";
import NetworkField from "../components/NetworkField.jsx";

const SIGNIN_TICKER = ["MONITORING ACTIVE", "SIGNAL VERIFIED", "SESSION SECURED"];

/* Cycles short system-status lines. Purely decorative — carries no
   auth state and never blocks or delays the real flow. */
function StatusTicker({ messages, className = "" }) {
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

/* Submit-safe sibling of MagneticButton: same magnetic hover + inverted
   hover styling, but a real <button type="submit"> so it works inside
   a <form> (MagneticButton doesn't forward type/disabled). */
function SubmitButton({ children, disabled, className = "" }) {
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

  return (
    <motion.button
      ref={ref}
      type="submit"
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={`group relative inline-flex w-full items-center justify-center gap-3 border border-ink bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition-colors duration-500 ease-signal hover:border-signal hover:bg-signal disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-ink disabled:hover:bg-ink ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ============================================================
   LOCAL PRESENTATION HELPERS
   (kept local to this file so it stays a single drop-in unit)
   ============================================================ */

function Wordmark({ tone = "ink" }) {
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

function SignalDot({ className = "" }) {
  return (
    <span className={`relative flex h-1.5 w-1.5 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
    </span>
  );
}

function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm text-ink/70">
      {children}
    </label>
  );
}

function StatusBanner({ tone = "error", children }) {
  const styles =
    tone === "error"
      ? "border-signal/25 bg-signal/[0.06] text-[#b3001f]"
      : "border-ink/15 bg-ink/[0.04] text-ink/80";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-4 py-3 text-sm ${styles}`}
      role="status"
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   SIGN IN
   ============================================================ */

function Signin() {
  const pageRef = useRef(null);
  const scanRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // GSAP — ambient/entrance only. Framer Motion owns the card.
  // ============================================================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".auth-brand", {
        opacity: 0,
        x: -24,
        duration: 0.8,
        delay: 0.1,
        ease: "power3.out",
      });

      gsap.from(".auth-field", {
        opacity: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.07,
        delay: 0.3,
        ease: "power2.out",
      });

      gsap.fromTo(
        scanRef.current,
        { yPercent: -20, opacity: 0 },
        {
          yPercent: 120,
          opacity: 1,
          duration: 3.2,
          repeat: -1,
          repeatDelay: 1.4,
          ease: "power1.inOut",
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // ============================================================
  // SIGN IN — UNCHANGED
  // ============================================================

  const handleSignin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password."
        );
      }

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem("saom_token", data.token);

      storage.setItem(
        "saom_user",
        JSON.stringify(data.user)
      );

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err.message || "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GOOGLE AUTHENTICATION — UNCHANGED
  // ============================================================

  const handleGoogleAuth = () => {
    if (!window.google?.accounts?.oauth2) {
      setError(
        "Google authentication is still loading. Please try again."
      );
      return;
    }

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError(
        "Google authentication is not configured."
      );
      return;
    }

    setError("");

    const tokenClient =
      window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",

        callback: async (tokenResponse) => {
          try {
            if (!tokenResponse?.access_token) {
              throw new Error(
                "Google authentication was cancelled."
              );
            }

            setLoading(true);

            const response = await fetch(
              "http://localhost:5000/api/auth/google-access-token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  accessToken:
                    tokenResponse.access_token,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Google authentication failed."
              );
            }

            const storage = rememberMe
              ? localStorage
              : sessionStorage;

            storage.setItem(
              "saom_token",
              data.token
            );

            storage.setItem(
              "saom_user",
              JSON.stringify(data.user)
            );

            window.location.href =
              "/dashboard";
          } catch (err) {
            setError(
              err.message ||
                "Unable to authenticate with Google."
            );
          } finally {
            setLoading(false);
          }
        },
      });

    tokenClient.requestAccessToken({
      prompt: "select_account",
    });
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      ref={pageRef}
      className="relative min-h-screen w-full overflow-hidden bg-paper px-5 py-6 md:px-8 lg:p-8"
    >
      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-[28px] border border-hair bg-paper lg:flex-row lg:min-h-[calc(100svh-4rem)]">

        {/* ============================================================
            LEFT — IDENTITY PANEL
            ============================================================ */}

        <div className="auth-brand relative flex shrink-0 flex-col justify-between overflow-hidden bg-ink px-8 py-8 text-paper md:px-12 md:py-12 lg:w-[46%] lg:px-14 lg:py-14">

          {/* live 3D threat network — same component used in the Hero */}
          <NetworkField className="pointer-events-auto absolute inset-0 opacity-60" />

          {/* subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(245,243,238,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,.6) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          {/* scan-line sweep */}
          <div
            ref={scanRef}
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(237,28,46,0.22), transparent)",
            }}
          />

          <div className="relative z-10">
            <Link to="/" className="inline-block">
              <Wordmark tone="paper" />
            </Link>
          </div>

          <div className="relative z-10 mt-16 lg:mt-0">
            <p className="font-mono-tech mb-5 flex items-center gap-2 text-xs tracking-[0.14em] text-paper/50">
              <SignalDot />
              SECURE ACCESS
            </p>

            <h1
              className="max-w-md font-sans font-semibold leading-[0.98] tracking-[-0.03em] text-paper"
              style={{ fontSize: "clamp(2.4rem, 4.2vw, 3.6rem)" }}
            >
              Secure system
              <br />
              <span className="text-signal">access.</span>
            </h1>

            <p className="mt-5 max-w-sm text-base leading-[1.55] text-paper/60">
              Sign in to monitor live signals, review investigations,
              and stay ahead of what your systems are telling you.
            </p>
          </div>

          <div className="relative z-10 mt-14 flex flex-col gap-2 text-xs tracking-[0.16em] text-paper/40 lg:mt-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-signal" />
              <span className="font-mono-tech">SECURE · VERIFIED · CONTROLLED</span>
            </div>
            <StatusTicker
              messages={SIGNIN_TICKER}
              className="font-mono-tech pl-11 text-paper/55"
            />
          </div>
        </div>

        {/* ============================================================
            RIGHT — FORM
            ============================================================ */}

        <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:px-16">
          <motion.div
            className="w-full max-w-[420px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono-tech mb-4 text-xs tracking-[0.18em] text-signal">
              AUTHENTICATION
            </p>

            <h2 className="font-sans text-3xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-ink/55">
              Sign in to continue to your SAOM-AI workspace.
            </p>

            <form onSubmit={handleSignin} className="mt-9 space-y-5">
              {/* EMAIL */}
              <div className="auth-field">
                <FieldLabel htmlFor="signin-email">Email</FieldLabel>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                />
              </div>

              {/* PASSWORD */}
              <div className="auth-field">
                <FieldLabel htmlFor="signin-password">Password</FieldLabel>
                <div className="relative">
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 pr-16 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/45 transition-colors hover:text-signal"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* OPTIONS */}
              <div className="auth-field flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-ink/60">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#ED1C2E]"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="text-ink/60">
                  <HoverInvert className="hover:!text-signal">
                    Forgot password?
                  </HoverInvert>
                </Link>
              </div>

              {error && <StatusBanner tone="error">{error}</StatusBanner>}

              <SubmitButton disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </SubmitButton>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-hair" />
              <span className="font-mono-tech text-[11px] tracking-[0.14em] text-ink/35">OR</span>
              <div className="h-px flex-1 bg-hair" />
            </div>

            <MagneticButton
              variant="light"
              onClick={loading ? undefined : handleGoogleAuth}
              className={`!w-full !justify-center${
                loading ? " !pointer-events-none !opacity-50" : ""
              }`}
            >
              {loading ? "Please wait…" : "Continue with Google"}
            </MagneticButton>

            <p className="mt-8 text-center text-sm text-ink/55">
              Don't have an account?{" "}
              <Link to="/signup" className="text-ink">
                <HoverInvert className="hover:!text-signal">Create one</HoverInvert>
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Signin;