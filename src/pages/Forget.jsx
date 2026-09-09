 import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NetworkField from "../components/NetworkField";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const COLORS = {
  ink: "#1D1D1F",
  inkSoft: "#6E6E73",
  inkFaint: "#A1A1A6",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F5F7",
  divider: "#E5E5EA",
  red: "#E1102A",
  redDark: "#B4001F",
  redSoft: "#FDECEE",
};

/* ============================================================
   SIGN-IN STYLE PRIMITIVES
   ============================================================ */

function Wordmark() {
  return (
    <span
      className="text-[15px] font-semibold tracking-tight"
      style={{ color: COLORS.ink }}
    >
      SAOM<span style={{ color: COLORS.red }}>.</span>AI
    </span>
  );
}

function IconLock(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const fieldMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const containerMotion = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

function FloatingField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  rightSlot,
  inputMode,
  maxLength,
}) {
  return (
    <motion.div variants={fieldMotion} className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required
        placeholder=" "
        className="peer w-full border-b-2 bg-transparent pb-2 pt-6 text-[16px] outline-none transition-colors duration-300 placeholder-transparent"
        style={{
          color: COLORS.ink,
          borderColor: COLORS.divider,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = COLORS.red;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = COLORS.divider;
        }}
      />

      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[15px] transition-all duration-200 peer-focus:top-0 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
        style={{ color: COLORS.inkFaint }}
      >
        {label}
      </label>

      {rightSlot && (
        <div className="absolute bottom-2 right-0 flex items-center">
          {rightSlot}
        </div>
      )}
    </motion.div>
  );
}

function ShowHideButton({ shown, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-medium"
      style={{ color: COLORS.inkFaint }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = COLORS.red;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = COLORS.inkFaint;
      }}
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}

function StatusBanner({ tone = "error", children }) {
  const bg =
    tone === "error" ? COLORS.redSoft : COLORS.surfaceSoft;
  const text =
    tone === "error" ? COLORS.redDark : COLORS.ink;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 text-[13px] leading-relaxed"
      style={{
        backgroundColor: bg,
        color: text,
      }}
      role="status"
    >
      {children}
    </motion.div>
  );
}

function PrimaryButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-full px-7 py-3.5 text-[15px] font-medium text-white shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundColor: COLORS.red,
        ["--tw-ring-color"]: COLORS.red,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = COLORS.redDark;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = COLORS.red;
        }
      }}
    >
      {children}
    </button>
  );
}

function TrustNote({ children }) {
  return (
    <div
      className="flex items-center justify-center gap-2 text-[12.5px]"
      style={{ color: COLORS.inkFaint }}
    >
      <IconLock className="h-3.5 w-3.5 shrink-0" />
      {children}
    </div>
  );
}

/* ============================================================
   HERO PANEL — MATCHES SIGN-IN PAGE
   ============================================================ */

function HeroPanel() {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:w-[42%] lg:items-center lg:justify-center"
      style={{
        background:
          "linear-gradient(135deg, #FF3B4E 0%, #E1102A 45%, #7A0014 100%)",
      }}
    >
      <NetworkField className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none relative z-10 flex flex-col items-center px-14 text-center text-white">
        <p className="mb-3 text-[15px] font-medium text-white/70">
          Account recovery
        </p>

        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">
          Regain access.
        </h1>

        <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-white/80">
          Securely recover your SAOM-AI workspace and create
          a new password in two verified steps.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   FORGET / RESET PASSWORD
   Backend flow preserved exactly:
   /forgot-password
   /reset-password
   ============================================================ */

function Forget() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* ==========================================================
     SEND RESET OTP — BACKEND UNCHANGED
     ========================================================== */

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
          data.message || "Unable to send reset code."
        );
      }

      setMessage("Reset code sent to your email.");
      setStep("reset");
    } catch (err) {
      setError(
        err.message || "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RESET PASSWORD — BACKEND UNCHANGED
     ========================================================== */

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp || otp.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
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
          data.message || "Unable to reset password."
        );
      }

      setMessage("Password reset successfully.");

      setTimeout(() => {
        navigate("/signin");
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     CHANGE EMAIL
     ========================================================== */

  const handleChangeEmail = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  const resetRequirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        fontFamily: FONT_STACK,
        backgroundColor: COLORS.surface,
      }}
    >
      <HeroPanel />

      {/* ======================================================
          FORM COLUMN
          ====================================================== */}

      <div className="relative flex w-full flex-col overflow-hidden lg:w-[58%]">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: COLORS.red }}
        />

        {/* TOP WORDMARK */}

        <div className="relative z-10 px-6 py-6 lg:px-14 lg:py-8">
          <Link to="/">
            <Wordmark />
          </Link>
        </div>

        {/* FORM */}

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16 pt-4 lg:px-14">
          <div className="w-full max-w-[400px]">
            <motion.div
              variants={containerMotion}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="wait">
                {/* ==================================================
                    EMAIL STEP
                    ================================================== */}

                {step === "email" && (
                  <motion.div
                    key="email"
                    initial={{
                      opacity: 0,
                      x: 20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <motion.h2
                      variants={fieldMotion}
                      className="text-[32px] font-semibold tracking-tight md:text-[36px]"
                      style={{ color: COLORS.ink }}
                    >
                      Forgot password?
                    </motion.h2>

                    <motion.p
                      variants={fieldMotion}
                      className="mt-2 text-[15px]"
                      style={{
                        color: COLORS.inkSoft,
                      }}
                    >
                      Enter your email to receive a
                      verification code.
                    </motion.p>

                    <form
                      onSubmit={handleForgotPassword}
                      className="mt-9 space-y-6"
                    >
                      <FloatingField
                        id="fp-email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        autoComplete="email"
                      />

                      <AnimatePresence>
                        {error && (
                          <StatusBanner key="err">
                            {error}
                          </StatusBanner>
                        )}

                        {message && (
                          <StatusBanner
                            key="msg"
                            tone="info"
                          >
                            {message}
                          </StatusBanner>
                        )}
                      </AnimatePresence>

                      <motion.div variants={fieldMotion}>
                        <PrimaryButton disabled={loading}>
                          {loading
                            ? "Sending code…"
                            : "Send reset code"}
                        </PrimaryButton>
                      </motion.div>
                    </form>

                    <motion.p
                      variants={fieldMotion}
                      className="mt-6 text-center text-[14px]"
                      style={{
                        color: COLORS.inkSoft,
                      }}
                    >
                      Remember your password?{" "}
                      <Link
                        to="/signin"
                        className="font-medium"
                        style={{
                          color: COLORS.red,
                        }}
                      >
                        Sign in
                      </Link>
                    </motion.p>

                    <div className="mt-6">
                      <TrustNote>
                        Your account information stays
                        protected.
                      </TrustNote>
                    </div>
                  </motion.div>
                )}

                {/* ==================================================
                    RESET STEP
                    ================================================== */}

                {step === "reset" && (
                  <motion.div
                    key="reset"
                    initial={{
                      opacity: 0,
                      x: 20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <motion.h2
                      variants={fieldMotion}
                      className="text-[32px] font-semibold tracking-tight md:text-[36px]"
                      style={{ color: COLORS.ink }}
                    >
                      Create a new password
                    </motion.h2>

                    <motion.p
                      variants={fieldMotion}
                      className="mt-2 text-[15px]"
                      style={{
                        color: COLORS.inkSoft,
                      }}
                    >
                      Enter the verification code and
                      choose your new password.
                    </motion.p>

                    <motion.div
                      variants={fieldMotion}
                      className="mt-4"
                    >
                      <p
                        className="text-[13px]"
                        style={{
                          color: COLORS.inkFaint,
                        }}
                      >
                        Verification code sent to
                      </p>

                      <p
                        className="mt-1 break-all text-[14px] font-medium"
                        style={{
                          color: COLORS.ink,
                        }}
                      >
                        {email}
                      </p>
                    </motion.div>

                    <form
                      onSubmit={handleResetPassword}
                      className="mt-7 space-y-6"
                    >
                      {/* OTP */}

                      <FloatingField
                        id="fp-otp"
                        label="Verification code"
                        type="text"
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />

                      {/* NEW PASSWORD */}

                      <FloatingField
                        id="fp-new"
                        label="New password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        autoComplete="new-password"
                        rightSlot={
                          <ShowHideButton
                            shown={showPassword}
                            onClick={() =>
                              setShowPassword(
                                (value) => !value
                              )
                            }
                          />
                        }
                      />

                      {/* CONFIRM PASSWORD */}

                      <FloatingField
                        id="fp-confirm"
                        label="Confirm password"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        autoComplete="new-password"
                        rightSlot={
                          <ShowHideButton
                            shown={
                              showConfirmPassword
                            }
                            onClick={() =>
                              setShowConfirmPassword(
                                (value) => !value
                              )
                            }
                          />
                        }
                      />

                      {/* REQUIREMENTS */}

                      <motion.div
                        variants={fieldMotion}
                        className="rounded-xl px-4 py-4 text-[12.5px]"
                        style={{
                          backgroundColor:
                            COLORS.surfaceSoft,
                        }}
                      >
                        <p
                          className="mb-3"
                          style={{
                            color: COLORS.inkFaint,
                          }}
                        >
                          Password requirements
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <span
                            style={{
                              color:
                                resetRequirements.length
                                  ? "#198754"
                                  : COLORS.inkFaint,
                            }}
                          >
                            {resetRequirements.length
                              ? "✓"
                              : "○"}{" "}
                            8+ characters
                          </span>

                          <span
                            style={{
                              color:
                                resetRequirements.uppercase
                                  ? "#198754"
                                  : COLORS.inkFaint,
                            }}
                          >
                            {resetRequirements.uppercase
                              ? "✓"
                              : "○"}{" "}
                            Uppercase
                          </span>

                          <span
                            style={{
                              color:
                                resetRequirements.lowercase
                                  ? "#198754"
                                  : COLORS.inkFaint,
                            }}
                          >
                            {resetRequirements.lowercase
                              ? "✓"
                              : "○"}{" "}
                            Lowercase
                          </span>

                          <span
                            style={{
                              color:
                                resetRequirements.number
                                  ? "#198754"
                                  : COLORS.inkFaint,
                            }}
                          >
                            {resetRequirements.number
                              ? "✓"
                              : "○"}{" "}
                            Number
                          </span>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {error && (
                          <StatusBanner key="err">
                            {error}
                          </StatusBanner>
                        )}

                        {message && (
                          <StatusBanner
                            key="msg"
                            tone="info"
                          >
                            {message}
                          </StatusBanner>
                        )}
                      </AnimatePresence>

                      <motion.div variants={fieldMotion}>
                        <PrimaryButton disabled={loading}>
                          {loading
                            ? "Resetting…"
                            : "Reset password"}
                        </PrimaryButton>
                      </motion.div>

                      <button
                        type="button"
                        onClick={handleChangeEmail}
                        disabled={loading}
                        className="w-full text-[14px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          color: COLORS.inkSoft,
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.color =
                              COLORS.ink;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.color =
                              COLORS.inkSoft;
                          }
                        }}
                      >
                        ← Change email
                      </button>
                    </form>

                    <div className="mt-6">
                      <TrustNote>
                        Your password is securely
                        protected.
                      </TrustNote>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forget;
