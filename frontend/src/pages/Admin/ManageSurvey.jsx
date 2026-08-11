import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar.jsx";
import "./ManageSurvey.css";

const blankQuestion = () => ({ question_text: "", question_type: "likert", is_required: true });

export default function ManageSurvey() {
  const { logout } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", questions: [blankQuestion()] });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const load = () => api.get("/survey").then((r) => setSurveys(r.data));
  useEffect(() => { load(); }, []);

  const setQuestion = (index, field, value) => setDraft((d) => ({ ...d,
    questions: d.questions.map((q, i) => i === index ? { ...q, [field]: value } : q) }));
  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      await api.post("/survey", { ...draft, questions: draft.questions.filter((q) => q.question_text.trim()) });
      setDraft({ title: "", description: "", questions: [blankQuestion()] }); setCreating(false); await load();
    } catch (err) { setError(err.response?.data?.error || "Could not create survey"); }
  };
  const removeSurvey = async (id) => {
    if (!window.confirm("Delete this survey and all of its responses?")) return;
    await api.delete(`/survey/${id}`); await load();
  };
  const saveSurvey = async (survey) => { await api.put(`/survey/${survey.id}`, editing); setEditing(null); await load(); };
  const addQuestion = async (surveyId) => {
    const text = window.prompt("Enter the new question");
    if (!text?.trim()) return;
    await api.post(`/survey/${surveyId}/questions`, { question_text: text, question_type: "likert", is_required: true }); await load();
  };
  const toggleRequired = async (q) => { await api.put(`/survey/questions/${q.id}`, { is_required: !q.is_required }); await load(); };
  const editQuestion = async (q) => {
    const text = window.prompt("Edit question", q.question_text);
    if (!text?.trim()) return;
    const type = window.prompt("Question type: likert or text", q.question_type);
    if (!type || !["likert", "text"].includes(type.toLowerCase())) return;
    await api.put(`/survey/questions/${q.id}`, { question_text: text, question_type: type.toLowerCase() }); await load();
  };
  const removeQuestion = async (id) => { await api.delete(`/survey/questions/${id}`); await load(); };

  return <div className="admin-page">
    {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    <AdminSidebar isOpen={sidebarOpen} onLogout={logout} />
    <div className="admin-main">
      <Navbar title="Manage Surveys" subtitle="Create and manage multiple surveys" onMenuClick={() => setSidebarOpen(true)} />
      <div className="manage-survey-content wide">
        <button className="btn btn-primary new-survey-btn" onClick={() => setCreating(!creating)}><Plus size={16}/> Add Survey</button>
        {creating && <form className="card survey-builder" onSubmit={submit}>
          <div className="builder-heading"><h3>New Survey</h3><button type="button" className="icon-btn" onClick={() => setCreating(false)}><X size={18}/></button></div>
          <label>Survey name</label><input required maxLength={200} value={draft.title} onChange={(e) => setDraft({...draft, title:e.target.value})}/>
          <label>Description</label><textarea rows={2} value={draft.description} onChange={(e) => setDraft({...draft, description:e.target.value})}/>
          <h4>Questions</h4>
          {draft.questions.map((q, i) => <div className="builder-question" key={i}>
            <input required value={q.question_text} placeholder={`Question ${i+1}`} onChange={(e) => setQuestion(i,"question_text",e.target.value)}/>
            <select value={q.question_type} onChange={(e) => setQuestion(i,"question_type",e.target.value)}><option value="likert">Likert 1–5</option><option value="text">Open text</option></select>
            <label className="compact-check"><input type="checkbox" checked={q.is_required} onChange={(e) => setQuestion(i,"is_required",e.target.checked)}/> Required</label>
            {draft.questions.length > 1 && <button type="button" className="icon-btn danger" onClick={() => setDraft({...draft,questions:draft.questions.filter((_,x)=>x!==i)})}><Trash2 size={16}/></button>}
          </div>)}
          <button type="button" className="btn btn-ghost" onClick={() => setDraft({...draft, questions:[...draft.questions,blankQuestion()]})}><Plus size={14}/> Add question</button>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary"><Check size={15}/> Publish Survey</button>
        </form>}
        {surveys.length === 0 && <div className="card survey-admin-card"><p className="admin-empty">No surveys yet. Click Add Survey to create one.</p></div>}
        {surveys.map((survey) => <div className="card survey-admin-card" key={survey.id}>
          <div className="survey-admin-header">
            {editing?.id === survey.id ? <div className="inline-edit"><input value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})}/><textarea value={editing.description} onChange={(e)=>setEditing({...editing,description:e.target.value})}/><button className="btn btn-primary" onClick={()=>saveSurvey(survey)}>Save</button></div> : <div><h3>{survey.title}</h3><p>{survey.description}</p></div>}
            <div className="row-actions"><button className="icon-btn" title="Edit survey" onClick={()=>setEditing({id:survey.id,title:survey.title,description:survey.description})}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete survey" onClick={()=>removeSurvey(survey.id)}><Trash2 size={16}/></button></div>
          </div>
          <div className="question-list">{survey.questions.map((q,i)=><div className="question-row" key={q.id}><span>{i+1}. {q.question_text} <span className="badge badge-neutral">{q.question_type === "likert" ? "Likert 1–5" : "Text"}</span></span><div className="row-actions"><button className={`badge ${q.is_required ? "badge-success":"badge-neutral"}`} onClick={()=>toggleRequired(q)}>{q.is_required ? "Required":"Optional"}</button><button className="icon-btn" title="Edit question" onClick={()=>editQuestion(q)}><Pencil size={15}/></button><button className="icon-btn danger" onClick={()=>removeQuestion(q.id)}><Trash2 size={15}/></button></div></div>)}</div>
          <button className="btn btn-ghost add-existing" onClick={()=>addQuestion(survey.id)}><Plus size={14}/> Add question</button>
        </div>)}
      </div>
    </div>
  </div>;
}
