import { useEffect, useState } from "react";
import { Users, MessageSquare, ClipboardList, X, Download, Trash2, ShieldCheck } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSurvey, setUserSurvey] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [audits, setAudits] = useState([]);

  const loadUsers = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data.users);
    setTotalUsers(res.data.total_users);
    api.get("/admin/data-deletion-audits").then((r) => setAudits(r.data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const viewUser = async (u) => {
    setSelectedUser(u);
    const res = await api.get(`/admin/users/${u.id}/survey-responses`);
    setUserSurvey(res.data);
  };

  const totalChats = users.reduce((sum, u) => sum + u.chat_count, 0);
  const totalResponses = users.reduce((sum, u) => sum + u.survey_response_count, 0);
  const download = async (path, filename, type) => {
    const res = await api.get(path, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  };
  const deleteData = async (u) => {
    if (!window.confirm(`Permanently delete all chats and survey answers for ${u.participant_code || u.full_name}? The account and consent record will remain.`)) return;
    await api.delete(`/admin/users/${u.id}/data`); setSelectedUser(null); await loadUsers();
  };

  return (
    <div className="admin-page">
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <AdminSidebar isOpen={sidebarOpen} onLogout={logout} />

      <div className="admin-main">
        <Navbar
          title="Admin Dashboard"
          subtitle={`Signed in as ${user?.full_name}`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="admin-content">
          <div className="admin-export-actions">
            <button className="btn btn-primary" onClick={()=>download("/admin/survey/export.csv","anonymised-survey-analysis.csv","text/csv")}><Download size={15}/> Export Survey CSV</button>
            <button className="btn btn-ghost" onClick={()=>download("/admin/analysis/export","anonymised-research-data.json","application/json")}><ShieldCheck size={15}/> Export Anonymised Data</button>
          </div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple"><Users size={20} /></div>
              <div>
                <div className="stat-value">{totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-cyan"><MessageSquare size={20} /></div>
              <div>
                <div className="stat-value">{totalChats}</div>
                <div className="stat-label">Total Chats</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green"><ClipboardList size={20} /></div>
              <div>
                <div className="stat-value">{totalResponses}</div>
                <div className="stat-label">Survey Responses</div>
              </div>
            </div>
          </div>

          <div className="card admin-table-card animate-fade-up delay-2">
            <h3 className="admin-section-title">Registered Users</h3>
            <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th><th>Name</th>
                  <th>Email</th>
                  <th>Chats</th>
                  <th>Survey Responses</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><span className="badge badge-success">{u.participant_code || "—"}</span></td><td>{u.full_name}</td>
                    <td className="admin-email">{u.email}</td>
                    <td><span className="badge badge-primary">{u.chat_count}</span></td>
                    <td><span className="badge badge-accent">{u.survey_response_count}</span></td>
                    <td>
                      <button className="btn btn-ghost admin-view-btn" onClick={() => viewUser(u)}>
                        View
                      </button>
                      <button className="btn btn-ghost admin-delete-data-btn" title="Delete research data" onClick={() => deleteData(u)}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">No students registered yet.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          <div className="card admin-table-card animate-fade-up"><h3 className="admin-section-title">Data Deletion Audit Trail</h3><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Participant</th><th>Chats deleted</th><th>Responses deleted</th><th>Deleted at</th></tr></thead><tbody>{audits.map((a)=><tr key={a.id}><td>{a.participant_code}</td><td>{a.chats_deleted}</td><td>{a.responses_deleted}</td><td>{new Date(a.deleted_at).toLocaleString()}</td></tr>)}{audits.length===0&&<tr><td colSpan={4} className="admin-empty">No deletion events recorded.</td></tr>}</tbody></table></div></div>
        </div>
      </div>

      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Survey Responses — {selectedUser.full_name}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              {userSurvey.length === 0 && <p className="admin-empty">No survey responses yet.</p>}
              {userSurvey.map((r, idx) => (
                <div key={idx} className="survey-response-item">
                  <strong>{r.question}</strong>
                  <p>{r.answer}{r.question_type === "likert" && " / 5"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
