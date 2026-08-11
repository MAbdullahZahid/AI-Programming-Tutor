import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, BarChart3, LogOut, Sparkles } from "lucide-react";
import "./AdminSidebar.css";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/survey", label: "Manage Survey", icon: ListChecks },
  { to: "/admin/survey/results", label: "Survey Results", icon: BarChart3 },
];

export default function AdminSidebar({ isOpen, onLogout }) {
  return (
    <aside className={`admin-sidebar ${isOpen ? "admin-sidebar-open" : ""}`}>
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-dot" />
        AI Tutor <span className="admin-sidebar-brand-tag">Admin</span>
      </div>

      <nav className="admin-sidebar-nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `admin-sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-hint">
          <Sparkles size={13} />
          Hints, not full answers.
        </div>
        <button className="admin-sidebar-logout" onClick={onLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
