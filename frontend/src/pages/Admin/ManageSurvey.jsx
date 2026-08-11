import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar.jsx";
import "./ManageSurvey.css";

export default function ManageSurvey() {
  const { logout } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("likert");
  const [isRequired, setIsRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState({ title: "", description: "" });
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({ title: "", description: "" });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadQuestions = async () => {
    const res = await api.get("/survey/questions");
    setQuestions(res.data);
  };

  const loadSettings = async () => {
    const res = await api.get("/survey/settings");
    setSettings(res.data);
    setSettingsDraft(res.data);
  };

  useEffect(() => {
    loadQuestions();
    loadSettings();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSaving(true);
    try {
      await api.post("/survey/questions", {
        question_text: questionText,
        question_type: questionType,
        is_required: isRequired,
        order_index: questions.length + 1,
      });
      setQuestionText("");
      setIsRequired(true);
      await loadQuestions();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/survey/questions/${id}`);
    await loadQuestions();
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.put("/survey/settings", settingsDraft);
      setSettings(res.data);
      setEditingSettings(false);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="admin-page">
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <AdminSidebar isOpen={sidebarOpen} onLogout={logout} />

      <div className="admin-main">
        <Navbar
          title="Manage Post-Use Survey"
          subtitle="Set the survey name and manage its questions"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="manage-survey-content">
          <div className="card settings-card animate-fade-up">
            <div className="settings-card-header">
              <h3>Survey Name</h3>
              {!editingSettings && (
                <button className="btn btn-ghost settings-edit-btn" onClick={() => { setSettingsDraft(settings); setEditingSettings(true); }}>
                  <Pencil size={13} /> Edit
                </button>
              )}
            </div>

            {editingSettings ? (
              <div className="settings-form">
                <label>Survey title</label>
                <input
                  type="text"
                  value={settingsDraft.title}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g. Post-Use Survey"
                  maxLength={200}
                />
                <label>Intro text shown to students</label>
                <textarea
                  rows={2}
                  value={settingsDraft.description}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, description: e.target.value }))}
                  placeholder="e.g. Your honest feedback helps improve the tutor for future students."
                />
                <div className="settings-form-actions">
                  <button className="btn btn-ghost" onClick={() => setEditingSettings(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveSettings} disabled={savingSettings}>
                    <Check size={14} /> {savingSettings ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-preview">
                <p className="settings-preview-title">{settings.title || "Post-Use Survey"}</p>
                <p className="settings-preview-desc">{settings.description}</p>
              </div>
            )}
          </div>

          <form className="card add-question-card animate-fade-up delay-1" onSubmit={handleAdd}>
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

            <label className="required-toggle">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
              Required <span className="required-toggle-hint">(students must answer this — marked with *)</span>
            </label>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Plus size={15} />
              {saving ? "Adding..." : "Add Question"}
            </button>
          </form>

          <div className="card question-list-card animate-fade-up delay-2">
            <h3>Current Questions ({questions.length})</h3>
            {questions.length === 0 && <p className="admin-empty">No questions added yet — students will see an empty survey.</p>}
            <div className="question-list">
              {questions.map((q, idx) => (
                <div key={q.id} className="question-row">
                  <div>
                    <span className="question-index">{idx + 1}.</span> {q.question_text}
                    {q.is_required && <span className="required-star" title="Required">*</span>}
                    <span className={`badge ${q.question_type === "likert" ? "badge-primary" : "badge-accent"} question-type-badge`}>
                      {q.question_type === "likert" ? "Likert 1–5" : "Open text"}
                    </span>
                    <span className={`badge ${q.is_required ? "badge-success" : "badge-neutral"} question-type-badge`}>
                      {q.is_required ? "Required" : "Optional"}
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
    </div>
  );
}
