import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import MagneticButton from "../components/MagneticButton.jsx";
import HoverInvert from "../components/HoverInvert.jsx";
import NetworkField from "../components/NetworkField.jsx";

const SIGNUP_TICKER = ["IDENTITY FORMING", "CONTEXT LINKING", "VERIFICATION PENDING"];

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
   SIGN UP
   ============================================================ */

function Signup() {
  const pageRef = useRef(null);
  const scanRef = useRef(null);

  // ============================================================
  // STATE — UNCHANGED
  // ============================================================

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

  // ============================================================
  // GSAP
  // IMPORTANT:
  // GSAP DOES NOT CONTROL THE MAIN CARD OPACITY.
  // FRAMER MOTION CONTROLS THE CARD.
  // ============================================================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".signup-brand", {
        opacity: 0,
        x: -24,
        duration: 0.8,
        delay: 0.1,
        ease: "power3.out",
      });

      gsap.from(".signup-field", {
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
  // PASSWORD VALIDATION — UNCHANGED
  // ============================================================

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passwordValid =
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.lowercase &&
    passwordRequirements.number;

  // ============================================================
  // REGISTER — UNCHANGED
  // ============================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !fullName.trim() ||
      !organization.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordValid) {
      setError(
        "Password must be at least 8 characters and contain uppercase, lowercase, and a number."
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // REGISTER
      // --------------------------------------------------------

      const registerResponse = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            organization: organization.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.message ||
            "Unable to create account."
        );
      }

      // --------------------------------------------------------
      // SEND OTP
      // --------------------------------------------------------

      const otpResponse = await fetch(
        "http://localhost:5000/api/auth/send-otp",
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

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        throw new Error(
          otpData.message ||
            "Unable to send verification code."
        );
      }

      setMessage(
        "Verification code sent to your email."
      );

      setStep("otp");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // VERIFY OTP — UNCHANGED
  // ============================================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // VERIFY OTP
      // --------------------------------------------------------

      const verifyResponse = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.message ||
            "Invalid verification code."
        );
      }

      setMessage(
        "Email verified. Signing you in..."
      );

      // --------------------------------------------------------
      // AUTOMATIC LOGIN
      // --------------------------------------------------------

      const loginResponse = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginData.message ||
            "Email verified, but automatic login failed."
        );
      }

      // --------------------------------------------------------
      // SAVE AUTH DATA
      // --------------------------------------------------------

      localStorage.setItem(
        "saom_token",
        loginData.token
      );

      localStorage.setItem(
        "saom_user",
        JSON.stringify(loginData.user)
      );

      // --------------------------------------------------------
      // REDIRECT
      // --------------------------------------------------------

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err) {
      setError(
        err.message ||
          "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GOOGLE AUTH — UNCHANGED
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
    setMessage("");

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

            // --------------------------------------------------
            // SEND GOOGLE ACCESS TOKEN TO BACKEND
            // --------------------------------------------------

            const googleResponse = await fetch(
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

            const data =
              await googleResponse.json();

            if (!googleResponse.ok) {
              throw new Error(
                data.message ||
                  "Google authentication failed."
              );
            }

            // --------------------------------------------------
            // SAVE AUTH DATA
            // --------------------------------------------------

            localStorage.setItem(
              "saom_token",
              data.token
            );

            localStorage.setItem(
              "saom_user",
              JSON.stringify(data.user)
            );

            // --------------------------------------------------
            // REDIRECT
            // --------------------------------------------------

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
  // GO BACK TO SIGNUP — UNCHANGED
  // ============================================================

  const handleBackToSignup = () => {
    setStep("signup");
    setOtp("");
    setError("");
    setMessage("");
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

        <div className="signup-brand relative flex shrink-0 flex-col justify-between overflow-hidden bg-ink px-8 py-8 text-paper md:px-12 md:py-12 lg:w-[46%] lg:px-14 lg:py-14">

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
              IDENTITY VERIFICATION
            </p>

            <h1
              className="max-w-md font-sans font-semibold leading-[0.98] tracking-[-0.03em] text-paper"
              style={{ fontSize: "clamp(2.2rem, 3.8vw, 3.3rem)" }}
            >
              Initialize your
              <br />
              <span className="text-signal">SAOM-AI identity.</span>
            </h1>

            <p className="mt-5 max-w-sm text-base leading-[1.55] text-paper/60">
              Create your workspace and give SAOM-AI the context it
              needs to start watching your environment.
            </p>
          </div>

          <div className="relative z-10 mt-14 flex flex-col gap-2 text-xs tracking-[0.16em] text-paper/40 lg:mt-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-signal" />
              <span className="font-mono-tech">IDENTITY · VERIFICATION · ACCESS</span>
            </div>
            <StatusTicker
              messages={SIGNUP_TICKER}
              className="font-mono-tech pl-11 text-paper/55"
            />
          </div>
        </div>

        {/* ============================================================
            RIGHT — FORM
            ============================================================ */}

        <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-[440px]">
            <AnimatePresence mode="wait">

              {/* ==================================================
                  SIGNUP FORM
                  ================================================== */}

              {step === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-mono-tech mb-4 text-xs tracking-[0.18em] text-signal">
                    CREATE ACCOUNT
                  </p>

                  <h2 className="font-sans text-3xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">
                    Get started
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-ink/55">
                    Create your SAOM-AI account.
                  </p>

                  <form onSubmit={handleRegister} className="mt-8 space-y-4">
                    <div className="signup-field">
                      <FieldLabel htmlFor="su-name">Full name</FieldLabel>
                      <input
                        id="su-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        required
                        className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                      />
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-org">Organization</FieldLabel>
                      <input
                        id="su-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Your organization"
                        autoComplete="organization"
                        required
                        className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                      />
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-email">Email</FieldLabel>
                      <input
                        id="su-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                        className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                      />
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-password">Password</FieldLabel>
                      <div className="relative">
                        <input
                          id="su-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
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

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-confirm">Confirm password</FieldLabel>
                      <div className="relative">
                        <input
                          id="su-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
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

                    <div className="signup-field rounded-xl border border-hair bg-ink/[0.02] p-4 text-xs">
                      <p className="mb-3 text-ink/45">Password requirements</p>
                      <div className="grid grid-cols-2 gap-2">
                        <RequirementRow met={passwordRequirements.length}>8+ characters</RequirementRow>
                        <RequirementRow met={passwordRequirements.uppercase}>Uppercase</RequirementRow>
                        <RequirementRow met={passwordRequirements.lowercase}>Lowercase</RequirementRow>
                        <RequirementRow met={passwordRequirements.number}>Number</RequirementRow>
                      </div>
                    </div>

                    {error && <StatusBanner tone="error">{error}</StatusBanner>}

                    <SubmitButton disabled={loading}>
                      {loading ? "Creating account…" : "Create Account"}
                    </SubmitButton>
                  </form>

                  <div className="my-6 flex items-center gap-4">
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
                    Continue with Google
                  </MagneticButton>

                  <p className="mt-7 text-center text-sm text-ink/55">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-ink">
                      <HoverInvert className="hover:!text-signal">Sign in</HoverInvert>
                    </Link>
                  </p>
                </motion.div>
              )}

              {/* ==================================================
                  OTP
                  ================================================== */}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-mono-tech mb-4 text-xs tracking-[0.18em] text-signal">
                    EMAIL VERIFICATION
                  </p>

                  <h2 className="font-sans text-3xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">
                    Verify your email
                  </h2>

                  <p className="mt-3 text-sm text-ink/55">
                    Enter the 6-digit code sent to:
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-ink">
                    {email}
                  </p>

                  <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      autoFocus
                      required
                      className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-4 text-center text-3xl tracking-[0.6em] text-ink outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/10"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to right, transparent 0, transparent calc(100%/6 - 1px), rgba(10,10,10,0.08) calc(100%/6 - 1px), rgba(10,10,10,0.08) calc(100%/6))",
                      }}
                    />

                    {error && <StatusBanner tone="error">{error}</StatusBanner>}
                    {message && <StatusBanner tone="success">{message}</StatusBanner>}

                    <SubmitButton disabled={loading}>
                      {loading ? "Verifying…" : "Verify Email"}
                    </SubmitButton>

                    <button
                      type="button"
                      onClick={handleBackToSignup}
                      disabled={loading}
                      className="w-full text-sm text-ink/50 transition-colors hover:text-ink disabled:opacity-50"
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
    </div>
  );
}

export default Signup;