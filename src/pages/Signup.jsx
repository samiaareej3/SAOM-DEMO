 import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
 import NetworkField from "../components/NetworkField";
/* ================================================================== */
/* DESIGN TOKENS — white surfaces, one red accent, real contrast      */
/* ================================================================== */
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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

/* ================================================================== */
/* ICONS                                                               */
/* ================================================================== */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z" />
      <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.5z" />
      <path fill="#FBBC05" d="M6.54 13.6A5.86 5.86 0 0 1 6.23 12c0-.56.1-1.1.31-1.6V7.87H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.13l3.24-2.53z" />
      <path fill="#EA4335" d="M12 6.37c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.42 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.7 5.37l3.24 2.53C7.31 8.09 9.46 6.37 12 6.37z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <motion.svg
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      viewBox="0 0 10 10"
      className="h-2.5 w-2.5"
    >
      <path d="M1 5l2.5 2.5L9 2" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ================================================================== */
/* PRIMITIVES                                                          */
/* ================================================================== */
function Wordmark() {
  return (
    <span className="text-[15px] font-semibold tracking-tight" style={{ color: COLORS.ink }}>
      SAOM<span style={{ color: COLORS.red }}>.</span>AI
    </span>
  );
}

const fieldMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const containerMotion = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

function FloatingField({ id, label, type = "text", value, onChange, autoComplete, rightSlot }) {
  return (
    <motion.div variants={fieldMotion} className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        placeholder=" "
        className="peer w-full border-b-2 bg-transparent pb-2 pt-6 text-[16px] outline-none transition-colors duration-300 placeholder-transparent"
        style={{ color: COLORS.ink, borderColor: COLORS.divider }}
        onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.red)}
        onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.divider)}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[15px] transition-all duration-200
          peer-focus:top-0 peer-focus:translate-y-0 peer-focus:text-xs
          peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
        style={{ color: COLORS.inkFaint }}
      >
        {label}
      </label>
      {rightSlot && <div className="absolute bottom-2 right-0 flex items-center">{rightSlot}</div>}
    </motion.div>
  );
}

function ShowHideButton({ shown, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] font-medium transition-colors"
      style={{ color: COLORS.inkFaint }}
      onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.red)}
      onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.inkFaint)}
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}

function Requirement({ met, children }) {
  return (
    <div className="flex items-center gap-2 text-[13px]" style={{ color: met ? COLORS.ink : COLORS.inkFaint }}>
      <motion.span
        animate={{ backgroundColor: met ? COLORS.red : "rgba(0,0,0,0)", borderColor: met ? COLORS.red : COLORS.divider }}
        transition={{ duration: 0.25 }}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]"
      >
        <AnimatePresence>{met && <CheckIcon />}</AnimatePresence>
      </motion.span>
      {children}
    </div>
  );
}

function StatusBanner({ tone = "error", children }) {
  const bg = tone === "error" ? COLORS.redSoft : COLORS.surfaceSoft;
  const text = tone === "error" ? COLORS.redDark : COLORS.ink;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 text-[13px] leading-relaxed"
      style={{ backgroundColor: bg, color: text }}
      role="status"
    >
      {children}
    </motion.div>
  );
}

function PrimaryButton({ children, disabled }) {
  return (
    <motion.button
      type="submit"
      disabled={disabled}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="w-full rounded-full px-7 py-3.5 text-[15px] font-medium text-white shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: COLORS.red, ["--tw-ring-color"]: COLORS.red }}
    >
      {children}
    </motion.button>
  );
}

function GoogleButton({ onClick, disabled, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex w-full items-center justify-center gap-3 rounded-full border px-7 py-3.5 text-[15px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{ borderColor: COLORS.divider, color: COLORS.ink }}
    >
      {children}
    </motion.button>
  );
}

function TrustNote({ children }) {
  return (
    <motion.div
      variants={fieldMotion}
      className="flex items-center justify-center gap-2 text-[12.5px]"
      style={{ color: COLORS.inkFaint }}
    >
      <IconLock className="h-3.5 w-3.5 shrink-0" />
      {children}
    </motion.div>
  );
}

/* ================================================================== */
/* HERO PANEL — red gradient ground, live NetworkField graph, headline */
/* ================================================================== */
function HeroPanel({ eyebrow, headline, subhead }) {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:w-[42%] lg:items-center lg:justify-center"
      style={{ background: "linear-gradient(135deg, #FF3B4E 0%, #E1102A 45%, #7A0014 100%)" }}
    >
      <NetworkField className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none relative z-10 flex flex-col items-center px-14 text-center text-white">
        <p className="mb-3 text-[15px] font-medium text-white/70">{eyebrow}</p>
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">{headline}</h1>
        <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-white/80">{subhead}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SIGNUP                                                              */
/* ================================================================== */
function Signup() {
  const [step, setStep] = useState("signup");

  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passwordValid = Object.values(passwordRequirements).every(Boolean);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!fullName.trim() || !organization.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordValid) {
      setError("Password must be at least 8 characters and contain uppercase, lowercase, and a number.");
      return;
    }

    try {
      setLoading(true);

      const registerResponse = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          organization: organization.trim(),
          email: email.trim(),
          password,
        }),
      });
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) {
        throw new Error(registerData.message || "Unable to create account.");
      }

      const otpResponse = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const otpData = await otpResponse.json();
      if (!otpResponse.ok) {
        throw new Error(otpData.message || "Unable to send verification code.");
      }

      setMessage("Verification code sent to your email.");
      setStep("otp");
    } catch (err) {
      setError(err.message || "Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const verifyResponse = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || "Invalid verification code.");
      }

      setMessage("Email verified. Signing you in...");

      const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        throw new Error(loginData.message || "Email verified, but automatic login failed.");
      }

      localStorage.setItem("saom_token", loginData.token);
      localStorage.setItem("saom_user", JSON.stringify(loginData.user));

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (!window.google?.accounts?.oauth2) {
      setError("Google authentication is still loading. Please try again.");
      return;
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google authentication is not configured.");
      return;
    }

    setError("");
    setMessage("");

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (tokenResponse) => {
        try {
          if (!tokenResponse?.access_token) {
            throw new Error("Google authentication was cancelled.");
          }
          setLoading(true);

          const googleResponse = await fetch("http://localhost:5000/api/auth/google-access-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: tokenResponse.access_token }),
          });
          const data = await googleResponse.json();
          if (!googleResponse.ok) {
            throw new Error(data.message || "Google authentication failed.");
          }

          localStorage.setItem("saom_token", data.token);
          localStorage.setItem("saom_user", JSON.stringify(data.user));
          window.location.href = "/dashboard";
        } catch (err) {
          setError(err.message || "Unable to authenticate with Google.");
        } finally {
          setLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  };

  const handleBackToSignup = () => {
    setStep("signup");
    setOtp("");
    setError("");
    setMessage("");
  };

  return (
    <div className="flex min-h-screen w-full" style={{ fontFamily: FONT_STACK, backgroundColor: COLORS.surface }}>
      {/* FORM COLUMN */}
      <div className="relative flex w-full flex-col overflow-hidden lg:w-[58%]">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: COLORS.red }}
        />

        <div className="relative z-10 px-6 py-6 lg:px-14 lg:py-8">
          <Link to="/">
            <Wordmark />
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16 pt-4 lg:px-14">
          <div className="w-full max-w-[400px]">
            <AnimatePresence mode="wait">
              {step === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div variants={containerMotion} initial="hidden" animate="visible">
                    <motion.h2
                      variants={fieldMotion}
                      className="text-[32px] font-semibold tracking-tight md:text-[36px]"
                      style={{ color: COLORS.ink }}
                    >
                      Create your account
                    </motion.h2>
                    <motion.p variants={fieldMotion} className="mt-2 text-[15px]" style={{ color: COLORS.inkSoft }}>
                      Set up your SAOM-AI workspace.
                    </motion.p>

                    <form onSubmit={handleRegister} className="mt-9 space-y-6">
                      <FloatingField id="su-name" label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                      <FloatingField id="su-org" label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} autoComplete="organization" />
                      <FloatingField id="su-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      <FloatingField
                        id="su-password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        rightSlot={<ShowHideButton shown={showPassword} onClick={() => setShowPassword((v) => !v)} />}
                      />
                      <FloatingField
                        id="su-confirm"
                        label="Confirm password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        rightSlot={<ShowHideButton shown={showConfirmPassword} onClick={() => setShowConfirmPassword((v) => !v)} />}
                      />

                      <motion.div
                        variants={fieldMotion}
                        className="grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-xl px-4 py-4"
                        style={{ backgroundColor: COLORS.surfaceSoft }}
                      >
                        <Requirement met={passwordRequirements.length}>8+ characters</Requirement>
                        <Requirement met={passwordRequirements.uppercase}>Uppercase letter</Requirement>
                        <Requirement met={passwordRequirements.lowercase}>Lowercase letter</Requirement>
                        <Requirement met={passwordRequirements.number}>A number</Requirement>
                      </motion.div>

                      <AnimatePresence>{error && <StatusBanner key="err">{error}</StatusBanner>}</AnimatePresence>

                      <motion.div variants={fieldMotion}>
                        <PrimaryButton disabled={loading}>
                          {loading ? "Creating account…" : "Create account"}
                        </PrimaryButton>
                      </motion.div>
                    </form>

                    <motion.div variants={fieldMotion} className="my-7 flex items-center gap-4">
                      <div className="h-px flex-1" style={{ backgroundColor: COLORS.divider }} />
                      <span className="text-[13px]" style={{ color: COLORS.inkFaint }}>
                        or
                      </span>
                      <div className="h-px flex-1" style={{ backgroundColor: COLORS.divider }} />
                    </motion.div>

                    <motion.div variants={fieldMotion}>
                      <GoogleButton onClick={loading ? undefined : handleGoogleAuth} disabled={loading}>
                        <GoogleIcon />
                        {loading ? "Please wait…" : "Continue with Google"}
                      </GoogleButton>
                    </motion.div>

                    <div className="mt-6">
                      <TrustNote>Your information is encrypted in transit and at rest.</TrustNote>
                    </div>

                    <motion.p variants={fieldMotion} className="mt-6 text-center text-[14px]" style={{ color: COLORS.inkSoft }}>
                      Already have an account?{" "}
                      <Link to="/signin" className="font-medium" style={{ color: COLORS.red }}>
                        Sign in
                      </Link>
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-[32px] font-semibold tracking-tight md:text-[36px]" style={{ color: COLORS.ink }}>
                    Verify your email
                  </h2>
                  <p className="mt-3 text-[15px]" style={{ color: COLORS.inkSoft }}>
                    Enter the 6-digit code sent to
                  </p>
                  <p className="mt-1 break-all text-[15px] font-medium" style={{ color: COLORS.ink }}>
                    {email}
                  </p>

                  <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      autoFocus
                      required
                      className="w-full rounded-xl px-4 py-4 text-center text-[28px] tracking-[0.5em] outline-none transition-colors duration-300"
                      style={{ color: COLORS.ink, backgroundColor: COLORS.surfaceSoft, border: `2px solid ${COLORS.divider}` }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.red)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.divider)}
                    />

                    <AnimatePresence>
                      {error && <StatusBanner key="err">{error}</StatusBanner>}
                      {message && <StatusBanner key="msg" tone="info">{message}</StatusBanner>}
                    </AnimatePresence>

                    <PrimaryButton disabled={loading}>{loading ? "Verifying…" : "Verify email"}</PrimaryButton>

                    <button
                      type="button"
                      onClick={handleBackToSignup}
                      disabled={loading}
                      className="w-full text-[14px] transition-colors disabled:opacity-50"
                      style={{ color: COLORS.inkSoft }}
                    >
                      ← Back
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <HeroPanel
        eyebrow="Identity & access"
        headline="Create your workspace."
        subhead="Give SAOM-AI the context it needs to understand your environment, in a few minutes."
      />
    </div>
  );
}

export default Signup;