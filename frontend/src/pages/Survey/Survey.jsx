import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, MessageSquareHeart, Lock } from "lucide-react";
import api from "../../api/axios.js";
import "./Survey.css";

const LIKERT_OPTIONS = [
  { val: 1, label: "Strongly Disagree" },
  { val: 2, label: "Disagree" },
  { val: 3, label: "Neutral" },
  { val: 4, label: "Agree" },
  { val: 5, label: "Strongly Agree" },
];

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [myResponses, setMyResponses] = useState({}); // { [question_id]: { answer_value, submitted_at } }
  const [answers, setAnswers] = useState({});
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({ title: "Post-Use Survey", description: "" });
  const [loadError, setLoadError] = useState(null);

  const loadAll = async () => {
    setLoadError(null);
    const results = await Promise.allSettled([
      api.get("/survey/questions"),
      api.get("/survey/my-responses"),
      api.get("/survey/settings"),
    ]);
    const [questionsResult, myResponsesResult, settingsResult] = results;

    if (questionsResult.status === "fulfilled") {
      setQuestions(questionsResult.value.data);
    }
    if (myResponsesResult.status === "fulfilled") {
      setMyResponses(myResponsesResult.value.data);
    }
    if (settingsResult.status === "fulfilled") {
      setSettings(settingsResult.value.data);
    }
    if (questionsResult.status === "rejected" || myResponsesResult.status === "rejected") {
      const failed = questionsResult.status === "rejected" ? questionsResult.reason : myResponsesResult.reason;
      const status = failed?.response?.status;
      setLoadError(
        status === 404
          ? "The survey backend doesn't recognise one of these routes yet — the server likely needs to be restarted with the latest code."
          : "Couldn't load the survey right now. Please try again."
      );
    }
  };

  useEffect(() => {
    loadAll().finally(() => setChecking(false));
  }, []);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const unanswered = questions.filter((q) => !(String(q.id) in myResponses));
  const answered = questions.filter((q) => String(q.id) in myResponses);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      answers: Object.entries(answers).map(([question_id, answer_value]) => ({
        question_id: Number(question_id),
        answer_value,
      })),
    };
    try {
      await api.post("/survey/responses", payload);
      setJustSubmitted(true);
      setAnswers({});
      await loadAll();
      setTimeout(() => setJustSubmitted(false), 2200);
    } catch {
      // If it was rejected because everything was already answered
      // (e.g. submitted from another tab), just resync with the server.
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="survey-page" />;
  }

  const AnsweredQuestion = ({ q, idx }) => {
    const r = myResponses[String(q.id)];
    return (
      <div className="survey-question survey-question-locked">
        <label>
          {idx + 1}. {q.question_text}
          {q.is_required && <span className="required-star" title="Required">*</span>}
          <span className="answered-tag"><Lock size={11} /> Answered</span>
        </label>
        {q.question_type === "likert" ? (
          <div className="likert-scale likert-scale-locked">
            {LIKERT_OPTIONS.map(({ val, label }) => (
              <div key={val} className={`likert-pill locked ${String(val) === r.answer_value ? "selected" : ""}`}>
                <span className="likert-number">{val}</span>
                <span className="likert-label">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="locked-text-answer">{r.answer_value}</div>
        )}
      </div>
    );
  };

  return (
    <div className="survey-page">
      <div className="survey-card animate-fade-up">
        <button className="survey-back" onClick={() => navigate("/chat")}>
          <ArrowLeft size={16} /> Back to chat
        </button>
        <div className="survey-header">
          <div className="survey-header-icon"><MessageSquareHeart size={22} /></div>
          <div>
            <h2 className="survey-title">{settings.title || "Post-Use Survey"}</h2>
            <p className="survey-subtitle">{settings.description}</p>
          </div>
        </div>

        {justSubmitted && (
          <div className="survey-toast animate-fade-up">
            <CheckCircle2 size={16} /> Thanks — your answers were saved.
          </div>
        )}

        {loadError && (
          <p className="survey-load-error">{loadError}</p>
        )}

        {!loadError && questions.length === 0 && (
          <p className="survey-empty">No survey questions have been published yet.</p>
        )}

        {answered.length > 0 && (
          <div className="survey-answered-block">
            {answered.map((q, idx) => <AnsweredQuestion key={q.id} q={q} idx={idx} />)}
          </div>
        )}

        {unanswered.length > 0 ? (
          <form onSubmit={handleSubmit}>
            {answered.length > 0 && (
              <p className="survey-new-label">
                <Sparkles size={13} /> New question{unanswered.length > 1 ? "s" : ""} added since you last responded
              </p>
            )}
            {unanswered.map((q, idx) => (
              <div key={q.id} className="survey-question animate-fade-up" style={{ animationDelay: `${Math.min(idx * 0.06, 0.4)}s` }}>
                <label>
                  {answered.length + idx + 1}. {q.question_text}
                  {q.is_required && <span className="required-star" title="Required">*</span>}
                </label>
                {q.question_type === "likert" ? (
                  <div className="likert-scale">
                    {LIKERT_OPTIONS.map(({ val, label }) => (
                      <label key={val} className={`likert-pill ${answers[q.id] === String(val) ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={val}
                          checked={answers[q.id] === String(val)}
                          onChange={() => handleChange(q.id, String(val))}
                          required={q.is_required}
                        />
                        <span className="likert-number">{val}</span>
                        <span className="likert-label">{label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    placeholder={q.is_required ? "Type your answer..." : "Type your answer (optional)..."}
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    required={q.is_required}
                  />
                )}
              </div>
            ))}

            <button type="submit" className="btn btn-primary survey-submit" disabled={loading}>
              <Sparkles size={15} />
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        ) : (
          answered.length > 0 && (
            <p className="survey-all-done">
              <CheckCircle2 size={15} /> You're all caught up — no new questions right now.
            </p>
          )
        )}
      </div>
    </div>
  );
}
