import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import MagneticButton from "../components/MagneticButton.jsx";
import HoverInvert from "../components/HoverInvert.jsx";
import AuthDoors, {
  SignalDot,
  StatusTicker,
  FieldLabel,
  StatusBanner,
  SubmitButton,
} from "../components/AuthDoors.jsx";

const SIGNIN_TICKER = ["MONITORING ACTIVE", "SIGNAL VERIFIED", "SESSION SECURED"];

function Signin() {
  const formRef = useRef(null);

  // ============================================================
  // STATE — UNCHANGED
  // ============================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // GSAP — field entrance only, runs once this door's content
  // mounts (i.e. once the door has finished opening). Framer
  // Motion (in AuthDoors) owns the panel's own opacity — this
  // never touches that same element.
  // ============================================================

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".signin-field", {
        opacity: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.out",
      });
    }, formRef);

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
    <AuthDoors active="signin">
      <div ref={formRef} className="flex h-full w-full flex-col lg:flex-row">
        {/* TAGLINE STRIP */}
        <div className="signin-field relative flex shrink-0 flex-col justify-center gap-3 overflow-hidden bg-ink px-6 py-6 lg:w-[38%] lg:px-10 lg:py-10">
          <p className="font-mono-tech flex items-center gap-2 text-xs tracking-[0.14em] text-paper/50">
            <SignalDot />
            SECURE ACCESS
          </p>

          <h1
            className="max-w-md font-sans font-semibold leading-[0.98] tracking-[-0.03em] text-paper"
            style={{ fontSize: "clamp(1.7rem, 3vw, 2.6rem)" }}
          >
            Welcome back.
            <br />
            <span className="text-signal">Access your workspace.</span>
          </h1>

          <p className="hidden max-w-sm text-sm leading-[1.55] text-paper/60 md:block">
            Sign in to monitor live signals, review investigations,
            and stay ahead of what your systems are telling you.
          </p>

          <div className="hidden flex-col gap-2 text-xs tracking-[0.16em] text-paper/40 lg:flex">
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

        {/* FORM */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-ink px-5 py-6 md:px-10 lg:px-12 lg:py-10">
          <div className="w-full max-w-[420px]">
            <p className="signin-field font-mono-tech mb-3 text-xs tracking-[0.18em] text-signal">
              AUTHENTICATION
            </p>

            <h2 className="signin-field font-sans text-2xl font-semibold tracking-[-0.02em] text-paper md:text-3xl">
              Sign in to SAOM-AI
            </h2>

            <form onSubmit={handleSignin} className="mt-7 space-y-5">
              {/* EMAIL */}
              <div className="signin-field">
                <FieldLabel htmlFor="signin-email" surface="dark">Email</FieldLabel>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 text-paper placeholder:text-paper/30 outline-none transition-colors duration-300 focus:border-signal focus:ring-2 focus:ring-signal/20"
                />
              </div>

              {/* PASSWORD */}
              <div className="signin-field">
                <FieldLabel htmlFor="signin-password" surface="dark">Password</FieldLabel>
                <div className="relative">
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              {/* OPTIONS */}
              <div className="signin-field flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-paper/60">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#ED1C2E]"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="text-paper/60">
                  <HoverInvert className="hover:!text-signal">
                    Forgot password?
                  </HoverInvert>
                </Link>
              </div>

              {error && (
                <StatusBanner tone="error" surface="dark">
                  {error}
                </StatusBanner>
              )}

              <div className="signin-field">
                <SubmitButton disabled={loading} surface="dark">
                  {loading ? "Signing in…" : "Sign In"}
                </SubmitButton>
              </div>
            </form>

            <div className="my-6 flex items-center gap-4">
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
              {loading ? "Please wait…" : "Continue with Google"}
            </MagneticButton>

            <p className="mt-7 text-center text-sm text-paper/55">
              Don't have an account?{" "}
              <Link to="/signup" className="text-paper">
                <HoverInvert className="hover:!text-signal">Create one</HoverInvert>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthDoors>
  );
}

export default Signin;