import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import MagneticButton from "../components/MagneticButton.jsx";
import HoverInvert from "../components/HoverInvert.jsx";
import AuthDoors, {
  SignalDot,
  StatusTicker,
  FieldLabel,
  StatusBanner,
  SubmitButton,
  RequirementRow,
} from "../components/AuthDoors.jsx";

const SIGNUP_TICKER = ["IDENTITY FORMING", "CONTEXT LINKING", "VERIFICATION PENDING"];

function Signup() {
  const formRef = useRef(null);

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
  // GSAP — field entrance only, scoped to whichever step is
  // mounted. Framer Motion (in AuthDoors, and the per-step
  // AnimatePresence below) owns opacity of the panel/step
  // wrappers themselves — never the same element as GSAP.
  // ============================================================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".signup-field", {
        opacity: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.out",
      });
    }, formRef);

    return () => ctx.revert();
  }, [step]);

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
    <AuthDoors active="signup">
      <div ref={formRef} className="flex h-full w-full flex-col lg:flex-row-reverse">
        {/* TAGLINE STRIP */}
        <div className="signup-field relative flex shrink-0 flex-col justify-center gap-3 overflow-hidden bg-ink px-6 py-6 lg:w-[38%] lg:px-10 lg:py-10">
          <p className="font-mono-tech flex items-center gap-2 text-xs tracking-[0.14em] text-paper/50">
            <SignalDot />
            IDENTITY VERIFICATION
          </p>

          <h1
            className="max-w-md font-sans font-semibold leading-[0.98] tracking-[-0.03em] text-paper"
            style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)" }}
          >
            Create your
            <br />
            <span className="text-signal">SAOM-AI identity.</span>
          </h1>

          <p className="hidden max-w-sm text-sm leading-[1.55] text-paper/60 md:block">
            Create your workspace and give SAOM-AI the context it
            needs to start watching your environment.
          </p>

          <div className="hidden flex-col gap-2 text-xs tracking-[0.16em] text-paper/40 lg:flex">
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

        {/* FORM */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-ink px-5 py-6 md:px-10 lg:px-12 lg:py-10">
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
                  <p className="signup-field font-mono-tech mb-3 text-xs tracking-[0.18em] text-signal">
                    CREATE ACCOUNT
                  </p>

                  <h2 className="signup-field font-sans text-2xl font-semibold tracking-[-0.02em] text-paper md:text-3xl">
                    Get started
                  </h2>

                  <form onSubmit={handleRegister} className="mt-6 space-y-4">
                    <div className="signup-field">
                      <FieldLabel htmlFor="su-name" surface="dark">Full name</FieldLabel>
                      <input
                        id="su-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        required
                        className="w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 text-paper placeholder:text-paper/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                      />
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-org" surface="dark">Organization</FieldLabel>
                      <input
                        id="su-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Your organization"
                        autoComplete="organization"
                        required
                        className="w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 text-paper placeholder:text-paper/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                      />
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-email" surface="dark">Email</FieldLabel>
                      <input
                        id="su-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                        className="w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 text-paper placeholder:text-paper/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                      />
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-password" surface="dark">Password</FieldLabel>
                      <div className="relative">
                        <input
                          id="su-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          required
                          className="w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 pr-16 text-paper placeholder:text-paper/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-paper/45 transition-colors hover:text-signal"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="signup-field">
                      <FieldLabel htmlFor="su-confirm" surface="dark">Confirm password</FieldLabel>
                      <div className="relative">
                        <input
                          id="su-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          required
                          className="w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 pr-16 text-paper placeholder:text-paper/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-paper/45 transition-colors hover:text-signal"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="signup-field rounded-xl border border-paper/15 bg-paper/[0.03] p-4 text-xs">
                      <p className="mb-3 text-paper/45">Password requirements</p>
                      <div className="grid grid-cols-2 gap-2">
                        <RequirementRow met={passwordRequirements.length} surface="dark">8+ characters</RequirementRow>
                        <RequirementRow met={passwordRequirements.uppercase} surface="dark">Uppercase</RequirementRow>
                        <RequirementRow met={passwordRequirements.lowercase} surface="dark">Lowercase</RequirementRow>
                        <RequirementRow met={passwordRequirements.number} surface="dark">Number</RequirementRow>
                      </div>
                    </div>

                    {error && (
                      <StatusBanner tone="error" surface="dark">
                        {error}
                      </StatusBanner>
                    )}

                    <div className="signup-field">
                      <SubmitButton disabled={loading} surface="dark">
                        {loading ? "Creating account…" : "Create Account"}
                      </SubmitButton>
                    </div>
                  </form>

                  <div className="my-5 flex items-center gap-4">
                    <div className="h-px flex-1 bg-paper/15" />
                    <span className="font-mono-tech text-[11px] tracking-[0.14em] text-paper/35">OR</span>
                    <div className="h-px flex-1 bg-paper/15" />
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

                  <p className="mt-6 text-center text-sm text-paper/55">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-paper">
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
                  <p className="signup-field font-mono-tech mb-3 text-xs tracking-[0.18em] text-signal">
                    EMAIL VERIFICATION
                  </p>

                  <h2 className="signup-field font-sans text-2xl font-semibold tracking-[-0.02em] text-paper md:text-3xl">
                    Verify your email
                  </h2>

                  <p className="signup-field mt-3 text-sm text-paper/55">
                    Enter the 6-digit code sent to:
                  </p>
                  <p className="signup-field mt-1 break-all text-sm font-medium text-paper">
                    {email}
                  </p>

                  <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      autoFocus
                      required
                      className="w-full rounded-xl border border-paper/20 bg-paper/[0.04] px-4 py-4 text-center text-3xl tracking-[0.6em] text-paper outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to right, transparent 0, transparent calc(100%/6 - 1px), rgba(245,243,238,0.12) calc(100%/6 - 1px), rgba(245,243,238,0.12) calc(100%/6))",
                      }}
                    />

                    {error && (
                      <StatusBanner tone="error" surface="dark">
                        {error}
                      </StatusBanner>
                    )}
                    {message && (
                      <StatusBanner tone="success" surface="dark">
                        {message}
                      </StatusBanner>
                    )}

                    <SubmitButton disabled={loading} surface="dark">
                      {loading ? "Verifying…" : "Verify Email"}
                    </SubmitButton>

                    <button
                      type="button"
                      onClick={handleBackToSignup}
                      disabled={loading}
                      className="w-full text-sm text-paper/50 transition-colors hover:text-paper disabled:opacity-50"
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
    </AuthDoors>
  );
}

export default Signup;