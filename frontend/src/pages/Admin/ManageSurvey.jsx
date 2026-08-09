import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, BarChart3 } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import "./ManageSurvey.css";

export default function ManageSurvey() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("likert");
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    const res = await api.get("/survey/questions");
    setQuestions(res.data);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSaving(true);
    try {
      await api.post("/survey/questions", {
        question_text: questionText,
        question_type: questionType,
        order_index: questions.length + 1,
      });
      setQuestionText("");
      await loadQuestions();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/survey/questions/${id}`);
    await loadQuestions();
  };

  return (
    <div className="manage-survey-page">
      <Navbar
        title="Manage Post-Use Survey"
        subtitle="These questions appear in the student survey after chat use"
        onLogout={logout}
        rightActions={
          <button className="btn btn-ghost" onClick={() => navigate("/admin/survey/results")}>
            <BarChart3 size={15} />
            <span className="btn-label">View Results</span>
          </button>
        }
      />

      <div className="manage-survey-content">
        <form className="card add-question-card" onSubmit={handleAdd}>
          <button type="button" className="survey-back" onClick={() => navigate("/admin")}>
            <ArrowLeft size={16} /> Back to dashboard
          </button>

          <h3>Add a new question</h3>
          <textarea
            placeholder="e.g. I found the tutor useful for solving my programming problem."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={2}
            required
          />

          <div className="question-type-select">
            <label className={`type-option ${questionType === "likert" ? "selected" : ""}`}>
              <input
                type="radio"
                name="type"
                value="likert"
                checked={questionType === "likert"}
                onChange={() => setQuestionType("likert")}
              />
              Likert scale (1–5)
            </label>
            <label className={`type-option ${questionType === "text" ? "selected" : ""}`}>
              <input
                type="radio"
                name="type"
                value="text"
                checked={questionType === "text"}
                onChange={() => setQuestionType("text")}
              />
              Open text
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Plus size={15} />
            {saving ? "Adding..." : "Add Question"}
          </button>
        </form>

        <div className="card question-list-card">
          <h3>Current Questions ({questions.length})</h3>
          {questions.length === 0 && <p className="admin-empty">No questions added yet — students will see an empty survey.</p>}
          <div className="question-list">
            {questions.map((q, idx) => (
              <div key={q.id} className="question-row">
                <div>
                  <span className="question-index">{idx + 1}.</span> {q.question_text}
                  <span className={`badge ${q.question_type === "likert" ? "badge-primary" : "badge-success"} question-type-badge`}>
                    {q.question_type === "likert" ? "Likert 1–5" : "Open text"}
                  </span>
                </div>
                <button className="question-delete-btn" onClick={() => handleDelete(q.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
