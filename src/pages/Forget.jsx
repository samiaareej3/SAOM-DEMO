import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import HoverInvert from "../components/HoverInvert.jsx";
import AuthDoors, {
  SignalDot,
  StatusTicker,
  FieldLabel,
  StatusBanner,
  SubmitButton,
  RequirementRow,
} from "../components/AuthDoors.jsx";

const FORGET_TICKER = ["ACCESS SUSPENDED", "IDENTITY REVALIDATING", "CONTROL RESTORING"];

function Forget() {
  const formRef = useRef(null);
  const navigate = useNavigate();

  // ============================================================
  // STATE — UNCHANGED
  // ============================================================

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
  // GSAP — field entrance only, scoped to whichever step is
  // mounted. Framer Motion (in AuthDoors, and the per-step
  // AnimatePresence below) owns opacity of the panel/step
  // wrappers themselves — never the same element as GSAP.
  // ============================================================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".forgot-field", {
        opacity: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, formRef);

    return () => ctx.revert();
  }, [step]);

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
    <AuthDoors active="forgot">
      <div ref={formRef} className="flex h-full w-full flex-col lg:flex-row">
        {/* TAGLINE STRIP */}
        <div className="forgot-field relative flex shrink-0 flex-col justify-center gap-3 overflow-hidden px-6 py-6 lg:w-[36%] lg:px-10 lg:py-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 30% 10%, #f5f3ee 0%, #e7e4dc 45%, #cfccc3 80%, #b9b6ac 100%)",
            }}
          />
          <p className="relative font-mono-tech flex items-center gap-2 text-xs tracking-[0.14em] text-ink/50">
            <SignalDot />
            ACCOUNT RECOVERY
          </p>

          <h1
            className="relative max-w-md font-sans font-semibold leading-[0.98] tracking-[-0.03em] text-ink"
            style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)" }}
          >
            Regain
            <br />
            <span className="text-signal">control.</span>
          </h1>

          <p className="relative hidden max-w-sm text-sm leading-[1.55] text-ink/60 md:block">
            Securely recover access to your SAOM-AI workspace in
            two verified steps.
          </p>

          <div className="relative hidden flex-col gap-2 text-xs tracking-[0.16em] text-ink/45 lg:flex">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-signal" />
              <span className="font-mono-tech">RECOVERY · VERIFICATION · ACCESS</span>
            </div>
            <StatusTicker
              messages={FORGET_TICKER}
              className="font-mono-tech pl-11 text-ink/55"
            />
          </div>
        </div>

        {/* FORM */}
        <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-5 py-6 md:px-10 lg:px-12 lg:py-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 100% at 70% 0%, #f5f3ee 0%, #e7e4dc 50%, #cfccc3 100%)",
            }}
          />
          <div className="relative w-full max-w-[420px]">
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
                  <p className="forgot-field font-mono-tech mb-3 text-xs tracking-[0.18em] text-signal">
                    ACCOUNT RECOVERY
                  </p>

                  <h2 className="forgot-field font-sans text-2xl font-semibold tracking-[-0.02em] text-ink md:text-3xl">
                    Forgot password?
                  </h2>

                  <p className="forgot-field mt-3 text-sm leading-relaxed text-ink/55">
                    Enter the email associated with your account and
                    we'll send you a verification code.
                  </p>

                  <form onSubmit={handleForgotPassword} className="mt-7 space-y-5">
                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-email" surface="light">Email</FieldLabel>
                      <input
                        id="fp-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        autoFocus
                        required
                        className="w-full rounded-xl border border-ink/12 bg-paper/70 px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                      />
                    </div>

                    {error && (
                      <StatusBanner tone="error" surface="light">
                        {error}
                      </StatusBanner>
                    )}
                    {message && (
                      <StatusBanner tone="success" surface="light">
                        {message}
                      </StatusBanner>
                    )}

                    <div className="forgot-field">
                      <SubmitButton disabled={loading} surface="light">
                        {loading ? "Sending code…" : "Send Reset Code"}
                      </SubmitButton>
                    </div>
                  </form>

                  <p className="mt-6 text-center text-sm text-ink/55">
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
                  <p className="forgot-field font-mono-tech mb-3 text-xs tracking-[0.18em] text-signal">
                    RESET PASSWORD
                  </p>

                  <h2 className="forgot-field font-sans text-2xl font-semibold tracking-[-0.02em] text-ink md:text-3xl">
                    Create a new password
                  </h2>

                  <p className="forgot-field mt-3 text-sm text-ink/55">
                    Verification code sent to:
                  </p>
                  <p className="forgot-field mt-1 break-all text-sm font-medium text-ink">
                    {email}
                  </p>

                  <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-otp" surface="light">Verification code</FieldLabel>
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
                        className="w-full rounded-xl border border-ink/15 bg-paper/70 px-4 py-4 text-center text-2xl tracking-[0.5em] text-ink outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(to right, transparent 0, transparent calc(100%/6 - 1px), rgba(10,10,10,0.08) calc(100%/6 - 1px), rgba(10,10,10,0.08) calc(100%/6))",
                        }}
                      />
                    </div>

                    <div className="forgot-field">
                      <FieldLabel htmlFor="fp-new" surface="light">New password</FieldLabel>
                      <div className="relative">
                        <input
                          id="fp-new"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          autoComplete="new-password"
                          required
                          className="w-full rounded-xl border border-ink/12 bg-paper/70 px-4 py-3 pr-16 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
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
                      <FieldLabel htmlFor="fp-confirm" surface="light">Confirm password</FieldLabel>
                      <div className="relative">
                        <input
                          id="fp-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          required
                          className="w-full rounded-xl border border-ink/12 bg-paper/70 px-4 py-3 pr-16 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
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

                    <div className="forgot-field rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-xs">
                      <p className="mb-3 text-ink/45">Password requirements</p>
                      <div className="grid grid-cols-2 gap-2">
                        <RequirementRow met={resetRequirements.length} surface="light">8+ characters</RequirementRow>
                        <RequirementRow met={resetRequirements.uppercase} surface="light">Uppercase</RequirementRow>
                        <RequirementRow met={resetRequirements.lowercase} surface="light">Lowercase</RequirementRow>
                        <RequirementRow met={resetRequirements.number} surface="light">Number</RequirementRow>
                      </div>
                    </div>

                    {error && (
                      <StatusBanner tone="error" surface="light">
                        {error}
                      </StatusBanner>
                    )}
                    {message && (
                      <StatusBanner tone="success" surface="light">
                        {message}
                      </StatusBanner>
                    )}

                    <SubmitButton disabled={loading} surface="light">
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
    </AuthDoors>
  );
}

export default Forget;