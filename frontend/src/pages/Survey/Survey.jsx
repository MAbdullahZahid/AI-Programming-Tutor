import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../../api/axios.js";
import "./Survey.css";

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/survey/questions").then((res) => setQuestions(res.data));
  }, []);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      answers: Object.entries(answers).map(([question_id, answer_value]) => ({
        question_id: Number(question_id),
        answer_value,
      })),
    };
    await api.post("/survey/responses", payload);
    setSubmitted(true);
    setLoading(false);
    setTimeout(() => navigate("/chat"), 1400);
  };

  if (submitted) {
    return (
      <div className="survey-page">
        <div className="survey-card survey-success">
          <CheckCircle2 size={40} color="var(--color-success)" />
          <h2>Thank you!</h2>
          <p>Your feedback has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-page">
      <div className="survey-card">
        <button className="survey-back" onClick={() => navigate("/chat")}>
          <ArrowLeft size={16} /> Back to chat
        </button>
        <h2 className="survey-title">Post-Use Survey</h2>
        <p className="survey-subtitle">Your honest feedback helps improve the tutor for future students.</p>

        <form onSubmit={handleSubmit}>
          {questions.length === 0 && <p className="survey-empty">No survey questions have been published yet.</p>}

          {questions.map((q, idx) => (
            <div key={q.id} className="survey-question">
              <label>{idx + 1}. {q.question_text}</label>
              {q.question_type === "likert" ? (
                <div className="likert-scale">
                  {[
                    { val: 1, label: "Strongly Disagree" },
                    { val: 2, label: "Disagree" },
                    { val: 3, label: "Neutral" },
                    { val: 4, label: "Agree" },
                    { val: 5, label: "Strongly Agree" },
                  ].map(({ val, label }) => (
                    <label key={val} className={`likert-pill ${answers[q.id] === String(val) ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={val}
                        checked={answers[q.id] === String(val)}
                        onChange={() => handleChange(q.id, String(val))}
                        required
                      />
                      <span className="likert-number">{val}</span>
                      <span className="likert-label">{label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={3}
                  placeholder="Type your answer..."
                  value={answers[q.id] || ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                />
              )}
            </div>
          ))}

          {questions.length > 0 && (
            <button type="submit" className="btn btn-primary survey-submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Survey"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
