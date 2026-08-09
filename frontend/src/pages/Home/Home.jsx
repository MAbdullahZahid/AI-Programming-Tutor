import { useNavigate } from "react-router-dom";
import { GraduationCap, MessageSquareCode, Lightbulb, LineChart, ArrowRight } from "lucide-react";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="home-brand">
          <span className="home-brand-dot" />
          AI Tutor
        </div>
        <div className="home-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/register")}>
            Get Started
          </button>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-hero-icon">
          <GraduationCap size={30} />
        </div>
        <h1 className="home-hero-title">
          Learn to code with a tutor that <span>guides</span>, not just answers
        </h1>
        <p className="home-hero-subtitle">
          A personalised AI programming tutor for beginners. Ask questions, paste code
          for review, and get hints and explanations first — so you actually understand
          the concept instead of just copying a solution.
        </p>
        <div className="home-hero-actions">
          <button className="btn btn-primary home-cta" onClick={() => navigate("/register")}>
            Start Learning <ArrowRight size={16} />
          </button>
          <button className="btn btn-ghost home-cta" onClick={() => navigate("/login")}>
            I already have an account
          </button>
        </div>
      </section>

      <section className="home-features">
        <div className="home-feature-card">
          <div className="home-feature-icon home-feature-icon-purple">
            <MessageSquareCode size={20} />
          </div>
          <h3>Ask & Debug</h3>
          <p>Ask programming questions or paste code that isn't working — get help finding the bug, not just the fix.</p>
        </div>
        <div className="home-feature-card">
          <div className="home-feature-icon home-feature-icon-cyan">
            <Lightbulb size={20} />
          </div>
          <h3>Hint-First Tutoring</h3>
          <p>The tutor nudges you toward the answer with hints and questions before ever giving a full solution.</p>
        </div>
        <div className="home-feature-card">
          <div className="home-feature-icon home-feature-icon-green">
            <LineChart size={20} />
          </div>
          <h3>Track Your Progress</h3>
          <p>Every chat is saved, so you can revisit past sessions and see how far you've come.</p>
        </div>
      </section>

      <footer className="home-footer">
        AI Programming Tutor — MSc Dissertation Project, University of Hull
      </footer>
    </div>
  );
}
