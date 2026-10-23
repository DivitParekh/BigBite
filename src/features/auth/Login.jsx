
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, LoaderCircle } from "lucide-react";
import { loginUser, resetPassword } from "./authService";

export default function Login({ onSuccess, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await loginUser(email, password);
      onSuccess?.();
    } catch (err) {
      console.error("Login error:", err);

      const messages = {
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/too-many-requests":
          "Too many attempts. Please wait and try again.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
      };

      setError(
        messages[err.code] ||
          "Unable to log in. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address first to reset your password.");
      return;
    }

    setResetLoading(true);

    try {
      await resetPassword(email);
      setMessage(
        "If an account exists for this email, password reset instructions will be sent."
      );
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait and try again.");
      } else {
        setError(
          "Unable to send reset instructions. Please try again later."
        );
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <section className="auth-form">
      <div className="auth-brand-mark">B</div>

      <div className="auth-heading">
        <span className="auth-eyebrow">WELCOME BACK</span>
        <h2>Login to BigBite</h2>
        <p>Sign in to order your campus favourites.</p>
      </div>

      {error && (
        <div className="auth-message auth-message-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="auth-message auth-message-success" role="status">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />

            <button
              className="auth-password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-forgot-row">
          <button
            type="button"
            className="auth-text-button"
            onClick={handleForgotPassword}
            disabled={loading || resetLoading}
          >
            {resetLoading ? "Sending instructions..." : "Forgot password?"}
          </button>
        </div>

        <button
          className="auth-submit"
          type="submit"
          disabled={loading || resetLoading}
        >
          {loading ? (
            <>
              <LoaderCircle className="auth-spinner" size={18} />
              Signing in...
            </>
          ) : (
            <>
              Login to account <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="auth-switch">
        New to BigBite?{" "}
        <button
          type="button"
          className="auth-text-button"
          onClick={onRegister}
          disabled={loading}
        >
          Create student account
        </button>
      </p>

      <p className="auth-terms">
        By continuing, you agree to follow your college canteen's ordering
        policies.
      </p>
    </section>
  );
}
