import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Consent.css";

export default function Consent() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (user?.has_consented) return <Navigate to="/chat" replace />;
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try { const res = await api.post("/auth/consent", { accepted }); updateUser(res.data.user); navigate("/chat", { replace:true }); }
    catch (err) { setError(err.response?.data?.error || "Could not record consent"); }
    finally { setSaving(false); }
  };
  return <main className="consent-page"><section className="consent-card">
    <div className="consent-title"><ShieldCheck size={30}/><div><h1>Participant Information & Consent</h1><p>AI Programming Tutor study · Information sheet version 1.0</p></div></div>
    <div className="consent-content">
      <h2>What is this study?</h2><p>This MSc project evaluates whether a Gemini-powered, hint-first programming tutor supports introductory programming understanding, debugging and confidence.</p>
      <h2>What will happen?</h2><p>You will use the tutor for programming activities and may complete post-use surveys. Your chat interactions, survey answers and open-ended feedback will be collected for research analysis.</p>
      <h2>How is my data protected?</h2><p>You will be represented in research data by a participant code such as P01. The name-to-code key and your consent record are stored separately. Research exports exclude your name, email and account ID. Only aggregated results and anonymised quotations should be reported.</p>
      <h2>Voluntary participation</h2><p>Participation is voluntary. You can choose not to continue. You may ask the researcher to delete your collected chat and survey data, subject to the approved research retention requirements.</p>
      <h2>Storage and use</h2><p>Data must be transferred to encrypted, password-protected, University-approved storage accessible only to the researcher and supervisor. Retention and deletion must follow the University ethics approval and UK GDPR requirements.</p>
    </div>
    <form onSubmit={submit} className="consent-form"><label><input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)}/><span>I have read and understood the information above. I voluntarily consent to participate and to the described collection and anonymised analysis of my tutor interactions and survey responses.</span></label>{error&&<p className="form-error">{error}</p>}<button className="btn btn-primary" disabled={!accepted||saving}>{saving?"Recording consent...":"I consent and continue"}</button></form>
    <button className="btn btn-ghost consent-logout" onClick={logout}><LogOut size={15}/> Sign out without consenting</button>
  </section></main>;
}
