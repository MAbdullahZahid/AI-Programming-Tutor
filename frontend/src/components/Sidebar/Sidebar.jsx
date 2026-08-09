import { Plus, MessageSquare } from "lucide-react";
import "./Sidebar.css";

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-dot" />
        AI Tutor
      </div>

      <button className="sidebar-new-chat" onClick={onNewChat}>
        <Plus size={16} />
        New Chat
      </button>

      <div className="sidebar-section-label">Recent chats</div>

      <div className="sidebar-chat-list">
        {chats.length === 0 && <p className="sidebar-empty">No previous chats yet</p>}
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={`sidebar-chat-item ${chat.id === activeChatId ? "active" : ""}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare size={15} />
            <span className="sidebar-chat-title">{chat.title || "Untitled Chat"}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
