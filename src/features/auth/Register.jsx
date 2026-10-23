
import { useState } from "react";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { registerStudent } from "./authService";

export default function Register({ onSuccess, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerStudent(cleanName, cleanEmail, password);
      onSuccess?.();
    } catch (err) {
      console.error("Registration error:", err);

      const messages = {
        "auth/email-already-in-use":
          "An account with this email already exists. Please log in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password":
          "Please choose a stronger password with at least 6 characters.",
        "auth/operation-not-allowed":
          "Email/password registration is disabled in Firebase Console.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
        "permission-denied":
          "Your account could not be saved. Check your Firestore security rules.",
      };

      setError(
        messages[err.code] ||
          (err.code === "permission-denied"
            ? messages["permission-denied"]
            : "Unable to create your account. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-form">
      <div className="auth-brand-mark">B</div>

      <div className="auth-heading">
        <span className="auth-eyebrow">JOIN THE CAMPUS TABLE</span>
        <h2>Create your account</h2>
        <p>Register to order food and manage your campus pickups.</p>
      </div>

      {error && (
        <div className="auth-message auth-message-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="register-email"
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
          <label htmlFor="register-password">Password</label>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
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

        <div className="auth-field">
          <label htmlFor="register-confirm-password">
            Confirm password
          </label>
          <div className="auth-input-wrap">
            <CheckCircle2 size={18} />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={loading}
            />
            <button
              className="auth-password-toggle"
              type="button"
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="auth-spinner" size={18} />
              Creating account...
            </>
          ) : (
            <>
              Create student account <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="auth-switch">
        Already registered?{" "}
        <button
          type="button"
          className="auth-text-button"
          onClick={onLogin}
          disabled={loading}
        >
          Log in
        </button>
      </p>

      <p className="auth-terms">
        Public registration creates a student account. Administrator access
        is assigned separately.
      </p>
    </section>
  );
}
