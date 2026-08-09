import { LogOut, Menu } from "lucide-react";
import "./Navbar.css";

export default function Navbar({ title, subtitle, rightActions, onLogout, onMenuClick }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        {onMenuClick && (
          <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1 className="navbar-title">{title}</h1>
          {subtitle && <p className="navbar-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="navbar-actions">
        {rightActions}
        {onLogout && (
          <button className="btn btn-ghost" onClick={onLogout}>
            <LogOut size={15} />
            <span className="btn-label">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
