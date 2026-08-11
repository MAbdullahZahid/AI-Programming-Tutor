import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Mail, Lock, Sparkles, MessageSquareCode, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin" : "/chat");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <BackButton />

      <div className="auth-shell animate-bounce-in">
        <aside className="auth-visual">
          <div className="auth-visual-blob auth-visual-blob-a" />
          <div className="auth-visual-blob auth-visual-blob-b" />
          <div className="auth-visual-grid" />

          <div className="auth-visual-brand">
            <span className="auth-visual-brand-dot" />
            AI Tutor
          </div>

          <div className="auth-visual-copy">
            <h2>
              Guided learning,<br /> not just answers.
            </h2>
            <p>Your tutor nudges you toward the fix with hints first, so the understanding actually sticks.</p>
          </div>

          <ul className="auth-visual-points">
            <li>
              <span className="auth-visual-point-icon"><MessageSquareCode size={15} /></span>
              Ask questions & paste code anytime
            </li>
            <li>
              <span className="auth-visual-point-icon"><Sparkles size={15} /></span>
              Hint-first tutoring, not copy-paste answers
            </li>
            <li>
              <span className="auth-visual-point-icon"><ShieldCheck size={15} /></span>
              Every session saved & picked up where you left off
            </li>
          </ul>
        </aside>

        <div className="auth-panel">
          <div className="auth-icon">
            <GraduationCap size={24} />
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Log in to continue your tutoring session</p>

          {error && <div className="auth-error animate-fade-up">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
