import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MessageSquareHeart, Sparkles, Lock } from "lucide-react";
import api from "../../api/axios.js";
import "./Survey.css";

const OPTIONS = [[1,"Strongly Disagree"],[2,"Disagree"],[3,"Neutral"],[4,"Agree"],[5,"Strongly Agree"]];

function SurveyCard({ survey }) {
  const [responses, setResponses] = useState({});
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = () => api.get(`/survey/${survey.id}/my-responses`).then((r)=>setResponses(r.data));
  useEffect(() => { load(); }, [survey.id]);
  const open = survey.questions.filter((q)=>!responses[String(q.id)]);
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/survey/${survey.id}/responses`, { answers:Object.entries(answers).map(([question_id,answer_value])=>({question_id:Number(question_id),answer_value})) });
      await load(); setAnswers({}); setSaved(true); setTimeout(()=>setSaved(false),2200);
    } finally { setSaving(false); }
  };
  const field = (q, locked=false) => q.question_type === "likert" ? <div className={`likert-scale ${locked ? "likert-scale-locked":""}`}>{OPTIONS.map(([val,label])=><label key={val} className={`likert-pill ${locked ? "locked":""} ${(locked ? responses[String(q.id)]?.answer_value : answers[q.id])===String(val) ? "selected":""}`}>
    {!locked && <input type="radio" name={`${survey.id}-${q.id}`} required={q.is_required} checked={answers[q.id]===String(val)} onChange={()=>setAnswers({...answers,[q.id]:String(val)})}/>}<span className="likert-number">{val}</span><span className="likert-label">{label}</span></label>)}</div> : locked ? <div className="locked-text-answer">{responses[String(q.id)]?.answer_value}</div> : <textarea rows={3} required={q.is_required} value={answers[q.id]||""} placeholder={q.is_required ? "Type your answer...":"Type your answer (optional)..."} onChange={(e)=>setAnswers({...answers,[q.id]:e.target.value})}/>;
  return <section className="survey-card animate-fade-up">
    <div className="survey-header"><div className="survey-header-icon"><MessageSquareHeart size={22}/></div><div><h2 className="survey-title">{survey.title}</h2><p className="survey-subtitle">{survey.description}</p></div></div>
    {saved && <div className="survey-toast"><CheckCircle2 size={16}/> Your answers were saved.</div>}
    {survey.questions.length === 0 && <p className="survey-empty">This survey has no questions yet.</p>}
    {survey.questions.filter((q)=>responses[String(q.id)]).map((q,i)=><div className="survey-question survey-question-locked" key={q.id}><label>{i+1}. {q.question_text}{q.is_required&&<span className="required-star">*</span>} <span className="answered-tag"><Lock size={11}/> Answered</span></label>{field(q,true)}</div>)}
    {open.length > 0 && <form onSubmit={submit}>{open.map((q,i)=><div className="survey-question" key={q.id}><label>{survey.questions.indexOf(q)+1}. {q.question_text}{q.is_required&&<span className="required-star">*</span>}</label>{field(q)}</div>)}<button className="btn btn-primary survey-submit" disabled={saving}><Sparkles size={15}/>{saving ? "Submitting...":"Submit Survey"}</button></form>}
    {survey.questions.length > 0 && open.length === 0 && <p className="survey-all-done"><CheckCircle2 size={15}/> Survey completed</p>}
  </section>;
}

export default function Survey() {
  const [surveys,setSurveys]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const navigate=useNavigate();
  useEffect(()=>{api.get("/survey").then((r)=>setSurveys(r.data)).catch(()=>setError("Could not load surveys right now.")).finally(()=>setLoading(false));},[]);
  return <div className="survey-page"><div className="survey-list-wrap"><button className="survey-back" onClick={()=>navigate("/chat")}><ArrowLeft size={16}/> Back to chat</button>{loading&&<p>Loading surveys...</p>}{error&&<p className="survey-load-error">{error}</p>}{!loading&&!error&&surveys.length===0&&<div className="survey-card"><p className="survey-empty">No surveys have been published yet.</p></div>}{surveys.map((s)=><SurveyCard key={s.id} survey={s}/>)}</div></div>;
}
