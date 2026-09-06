import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import HoverInvert from "../components/HoverInvert.jsx";
import NetworkField from "../components/NetworkField.jsx";

const FORGET_TICKER = ["ACCESS SUSPENDED", "IDENTITY REVALIDATING", "CONTROL RESTORING"];

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

/* ============================================================
   LOCAL PRESENTATION HELPERS
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

function RequirementRow({ met, children }) {
  return (
    <span className={met ? "text-emerald-600" : "text-ink/35"}>
      {met ? "✓" : "○"} {children}
    </span>
  );
}

/* ============================================================
   FORGOT / RESET PASSWORD
   ============================================================ */

function Forget() {
  const pageRef = useRef(null);
  const scanRef = useRef(null);
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ============================================================
  // GSAP — ambient/entrance only. Framer Motion owns the card.
  // ============================================================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".forgot-brand", {
        opacity: 0,
        x: -24,
        duration: 0.8,
        delay: 0.1,
        ease: "power3.out",
      });

      gsap.from(".forgot-field", {
        opacity: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.08,
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
  // SEND RESET OTP — UNCHANGED
  // ============================================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to send reset code."
        );
      }

      setMessage(
        "Reset code sent to your email."
      );

      setStep("reset");
    } catch (err) {
      setError(
        err.message ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESET PASSWORD — UNCHANGED
  // ============================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // OTP
    if (!otp || otp.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    // Password
    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError(
        "Password must contain an uppercase letter."
      );
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError(
        "Password must contain a lowercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError(
        "Password must contain a number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset password."
        );
      }

      setMessage(
        "Password reset successfully."
      );

      setTimeout(() => {
        navigate("/signin");
      }, 1200);
    } catch (err) {
      setError(
        err.message ||
          "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CHANGE EMAIL — UNCHANGED
  // ============================================================

  const handleChangeEmail = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  // Display-only checklist derived from newPassword — does not alter
  // the validation performed in handleResetPassword above.
  const resetRequirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
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
            LEFT — RECOVERY PANEL
            ============================================================ */}

        <div className="forgot-brand relative flex shrink-0 flex-col justify-between overflow-hidden bg-ink px-8 py-8 text-paper md:px-12 md:py-12 lg:w-[46%] lg:px-14 lg:py-14">

          <NetworkField className="pointer-events-auto absolute inset-0 opacity-60" />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(245,243,238,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,.6) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

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
              ACCOUNT RECOVERY
            </p>

            <h1
              className="max-w-md font-sans font-semibold leading-[0.98] tracking-[-0.03em] text-paper"
              style={{ fontSize: "clamp(2.4rem, 4.2vw, 3.6rem)" }}
            >
              Regain
              <br />
              <span className="text-signal">control.</span>
            </h1>

            <p className="mt-5 max-w-sm text-base leading-[1.55] text-paper/60">
              Securely recover access to your SAOM-AI workspace in
              two verified steps.
            </p>
          </div>

          <div className="relative z-10 mt-14 flex flex-col gap-2 text-xs tracking-[0.16em] text-paper/40 lg:mt-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-signal" />
              <span className="font-mono-tech">RECOVERY · VERIFICATION · ACCESS</span>
            </div>
            <StatusTicker
              messages={FORGET_TICKER}
              className="font-mono-tech pl-11 text-paper/55"
            />
          </div>
        </div>

        {/* ============================================================
            RIGHT — FORM
            ============================================================ */}

        <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">

              {/* ==================================================
                  EMAIL STEP
                  ================================================== */}

              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-mono-tech mb-4 text-xs tracking-[0.18em] text-signal">
                    ACCOUNT RECOVERY
                  </p>

                  <h2 className="font-sans text-3xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">
                    Forgot password?
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-ink/55">
                    Enter the email associated with your account and
                    we'll send you a verification code.
                  </p>

                  <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-email">Email</FieldLabel>
                      <input
                        id="fp-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        autoFocus
                        required
                        className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                      />
                    </div>

                    {error && <StatusBanner tone="error">{error}</StatusBanner>}
                    {message && <StatusBanner tone="success">{message}</StatusBanner>}

                    <SubmitButton disabled={loading}>
                      {loading ? "Sending code…" : "Send Reset Code"}
                    </SubmitButton>
                  </form>

                  <p className="mt-7 text-center text-sm text-ink/55">
                    Remember your password?{" "}
                    <Link to="/signin" className="text-ink">
                      <HoverInvert className="hover:!text-signal">Sign in</HoverInvert>
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* ==================================================
                  RESET STEP
                  ================================================== */}

              {step === "reset" && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-mono-tech mb-4 text-xs tracking-[0.18em] text-signal">
                    RESET PASSWORD
                  </p>

                  <h2 className="font-sans text-3xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">
                    Create a new password
                  </h2>

                  <p className="mt-3 text-sm text-ink/55">
                    Verification code sent to:
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-ink">
                    {email}
                  </p>

                  <form onSubmit={handleResetPassword} className="mt-7 space-y-5">
                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-otp">Verification code</FieldLabel>
                      <input
                        id="fp-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        autoFocus
                        required
                        className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-4 text-center text-2xl tracking-[0.5em] text-ink outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(to right, transparent 0, transparent calc(100%/6 - 1px), rgba(10,10,10,0.08) calc(100%/6 - 1px), rgba(10,10,10,0.08) calc(100%/6))",
                        }}
                      />
                    </div>

                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-new">New password</FieldLabel>
                      <div className="relative">
                        <input
                          id="fp-new"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          autoComplete="new-password"
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

                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-confirm">Confirm password</FieldLabel>
                      <div className="relative">
                        <input
                          id="fp-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          required
                          className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 pr-16 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/45 transition-colors hover:text-signal"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="forgot-field rounded-xl border border-hair bg-ink/[0.02] p-4 text-xs">
                      <p className="mb-3 text-ink/45">Password requirements</p>
                      <div className="grid grid-cols-2 gap-2">
                        <RequirementRow met={resetRequirements.length}>8+ characters</RequirementRow>
                        <RequirementRow met={resetRequirements.uppercase}>Uppercase</RequirementRow>
                        <RequirementRow met={resetRequirements.lowercase}>Lowercase</RequirementRow>
                        <RequirementRow met={resetRequirements.number}>Number</RequirementRow>
                      </div>
                    </div>

                    {error && <StatusBanner tone="error">{error}</StatusBanner>}
                    {message && <StatusBanner tone="success">{message}</StatusBanner>}

                    <SubmitButton disabled={loading}>
                      {loading ? "Resetting…" : "Reset Password"}
                    </SubmitButton>

                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      disabled={loading}
                      className="w-full text-sm text-ink/50 transition-colors hover:text-ink disabled:opacity-50"
                    >
                      ← Change email
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forget;