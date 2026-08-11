import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, CheckCircle2, TrendingUp } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar.jsx";
import "./SurveyResults.css";

const LIKERT_LABELS = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" };

export default function SurveyResults() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/admin/survey/analytics").then((res) => setData(res.data));
  }, []);

  const likertQuestions = data ? data.questions.filter((q) => q.question_type === "likert") : [];
  const textQuestions = data ? data.questions.filter((q) => q.question_type === "text") : [];

  const overallAverage = data && likertQuestions.length
    ? (
        likertQuestions.reduce((sum, q) => sum + (q.average || 0), 0) /
        likertQuestions.filter((q) => q.average !== null).length
      ).toFixed(2)
    : "—";

  return (
    <div className="admin-page">
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <AdminSidebar isOpen={sidebarOpen} onLogout={logout} />

      <div className="admin-main">
        <Navbar
          title="Survey Results"
          subtitle="Aggregated feedback across all students"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {!data ? (
          <div className="results-content"><p className="admin-empty">Loading analytics...</p></div>
        ) : (
        <div className="results-content">
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple"><Users size={20} /></div>
              <div>
                <div className="stat-value">{data.respondent_count} / {data.total_students}</div>
                <div className="stat-label">Students Responded</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-cyan"><CheckCircle2 size={20} /></div>
              <div>
                <div className="stat-value">{data.completion_rate}%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green"><TrendingUp size={20} /></div>
              <div>
                <div className="stat-value">{overallAverage} / 5</div>
                <div className="stat-label">Overall Average Score</div>
              </div>
            </div>
          </div>

          {likertQuestions.length === 0 && textQuestions.length === 0 && (
            <div className="card results-empty">
              <p>No survey questions have been published yet.</p>
            </div>
          )}

          {likertQuestions.length > 0 && (
            <div className="results-section">
              <h3 className="results-section-title">Likert Scale Questions</h3>
              <div className="results-grid">
                {likertQuestions.map((q, idx) => {
                  const chartData = Object.entries(q.counts).map(([score, count]) => ({
                    score: LIKERT_LABELS[score],
                    count,
                  }));
                  return (
                    <div key={q.id} className="card question-result-card animate-fade-up" style={{ animationDelay: `${Math.min(idx * 0.06, 0.3)}s` }}>
                      <span className="badge badge-primary">{q.survey_title}</span>
                      <div className="question-result-header">
                        <p className="question-result-text">{q.question_text}</p>
                        <div className="question-result-avg">
                          <span className="avg-number">{q.average ?? "—"}</span>
                          <span className="avg-of">/ 5</span>
                        </div>
                      </div>
                      <p className="question-result-meta">{q.total_responses} response{q.total_responses !== 1 ? "s" : ""}</p>
                      <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                            <XAxis dataKey="score" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: "var(--color-surface-alt)" }}
                              contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }}
                            />
                            <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {textQuestions.length > 0 && (
            <div className="results-section">
              <h3 className="results-section-title">Open-Ended Questions</h3>
              <div className="results-grid results-grid-single">
                {textQuestions.map((q) => (
                  <div key={q.id} className="card question-result-card">
                    <span className="badge badge-primary">{q.survey_title}</span>
                    <div className="question-result-header">
                      <p className="question-result-text">{q.question_text}</p>
                    </div>
                    <p className="question-result-meta">{q.total_responses} response{q.total_responses !== 1 ? "s" : ""}</p>
                    <div className="text-response-list">
                      {q.responses.length === 0 && <p className="admin-empty">No responses yet.</p>}
                      {q.responses.map((text, idx) => (
                        <div key={idx} className="text-response-item">{text}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
