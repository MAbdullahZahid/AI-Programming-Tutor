import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, User, Mail, Lock, Sparkles, MessageSquareCode, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";
import "../Login/Login.css"; // shared auth-page styling

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(fullName, email, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
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
              Start learning<br /> the way that sticks.
            </h2>
            <p>Create your account and get a personal tutor that meets you exactly where you are.</p>
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
              Free to join, no credit card needed
            </li>
          </ul>
        </aside>

        <div className="auth-panel">
          <div className="auth-icon">
            <GraduationCap size={24} />
          </div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Start learning with your personal AI tutor</p>

          {error && <div className="auth-error animate-fade-up">{error}</div>}
          {success && <div className="auth-success animate-fade-up">Account created! Redirecting to login...</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <User size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
