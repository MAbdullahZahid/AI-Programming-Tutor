import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageSquare, ClipboardList, Settings2, BarChart3, X } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSurvey, setUserSurvey] = useState([]);

  const loadUsers = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data.users);
    setTotalUsers(res.data.total_users);
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

  return (
    <div className="admin-page">
      <Navbar
        title="Admin Dashboard"
        subtitle={`Signed in as ${user?.full_name}`}
        onLogout={logout}
        rightActions={
          <>
            <button className="btn btn-ghost" onClick={() => navigate("/admin/survey/results")}>
              <BarChart3 size={15} />
              <span className="btn-label">View Results</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/admin/survey")}>
              <Settings2 size={15} />
              <span className="btn-label">Manage Survey</span>
            </button>
          </>
        }
      />

      <div className="admin-content">
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

        <div className="card admin-table-card">
          <h3 className="admin-section-title">Registered Users</h3>
          <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Chats</th>
                <th>Survey Responses</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td className="admin-email">{u.email}</td>
                  <td><span className="badge badge-primary">{u.chat_count}</span></td>
                  <td><span className="badge badge-success">{u.survey_response_count}</span></td>
                  <td>
                    <button className="btn btn-ghost admin-view-btn" onClick={() => viewUser(u)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="admin-empty">No students registered yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
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
