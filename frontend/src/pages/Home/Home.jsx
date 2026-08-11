import { useNavigate } from "react-router-dom";
import { GraduationCap, MessageSquareCode, Lightbulb, LineChart, ArrowRight, Sparkles, User } from "lucide-react";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-blob home-blob-a" />
      <div className="home-blob home-blob-b" />

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
        <div className="home-hero-copy">
          <div className="home-hero-icon animate-fade-up">
            <GraduationCap size={26} />
          </div>
          <h1 className="home-hero-title animate-fade-up delay-1">
            Learn to code with a tutor that <span>guides</span>, not just answers
          </h1>
          <p className="home-hero-subtitle animate-fade-up delay-2">
            A personalised AI programming tutor for beginners. Ask questions, paste code
            for review, and get hints and explanations first — so you actually understand
            the concept instead of just copying a solution.
          </p>
          <div className="home-hero-actions animate-fade-up delay-3">
            <button className="btn btn-primary home-cta" onClick={() => navigate("/register")}>
              Start Learning <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost home-cta" onClick={() => navigate("/login")}>
              I already have an account
            </button>
          </div>
        </div>

        {/* Signature element: a live mock-up of the hint-first exchange —
            the single most characteristic moment in this product. */}
        <div className="home-hero-mock animate-scale-in delay-2">
          <div className="mock-window">
            <div className="mock-window-bar">
              <span /><span /><span />
              <span className="mock-window-title">tutor session</span>
            </div>
            <div className="mock-body">
              <div className="mock-row mock-row-user">
                <div className="mock-avatar mock-avatar-user"><User size={13} /></div>
                <div className="mock-bubble mock-bubble-user">
                  Why does my for loop only run once?
                  <pre className="mock-code">for i in range(5):{"\n"}    print(i){"\n"}    return</pre>
                </div>
              </div>
              <div className="mock-row">
                <div className="mock-avatar mock-avatar-tutor"><Sparkles size={12} /></div>
                <div className="mock-bubble">
                  <span className="mock-hint-tag">Hint 1 of 2</span>
                  Look at what's inside the loop body — one of those lines ends the
                  function immediately. Which one, and what does it do?
                </div>
              </div>
              <div className="mock-row mock-row-fade">
                <div className="mock-avatar mock-avatar-tutor"><Sparkles size={12} /></div>
                <div className="mock-bubble mock-bubble-locked">
                  Full explanation unlocks once you try again
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="home-feature-card animate-fade-up delay-1">
          <div className="home-feature-icon home-feature-icon-purple">
            <MessageSquareCode size={20} />
          </div>
          <h3>Ask & Debug</h3>
          <p>Ask programming questions or paste code that isn't working — get help finding the bug, not just the fix.</p>
        </div>
        <div className="home-feature-card animate-fade-up delay-2">
          <div className="home-feature-icon home-feature-icon-cyan">
            <Lightbulb size={20} />
          </div>
          <h3>Hint-First Tutoring</h3>
          <p>The tutor nudges you toward the answer with hints and questions before ever giving a full solution.</p>
        </div>
        <div className="home-feature-card animate-fade-up delay-3">
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
