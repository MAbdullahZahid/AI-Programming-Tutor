import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ClipboardList } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import ChatBubble from "../../components/ChatBubble/ChatBubble.jsx";
import "./Chat.css";

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  // null activeChatId = "draft" state: no chat row exists yet in the
  // database. It's only created the moment the first message is sent,
  // titled from that message — so the sidebar never shows empty,
  // untitled "New Chat" entries.
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const loadChats = async () => {
    const res = await api.get("/chat");
    setChats(res.data);
    if (res.data.length > 0) {
      selectChat(res.data[0].id);
    }
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const selectChat = async (chatId) => {
    setActiveChatId(chatId);
    setSidebarOpen(false); // auto-close the mobile drawer once a chat is picked
    const res = await api.get(`/chat/${chatId}/messages`);
    setMessages(res.data);
  };

  const handleNewChat = () => {
    // No API call here — this is just a local draft until the user
    // actually sends a message.
    setActiveChatId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    let chatId = activeChatId;

    if (!chatId) {
      // First message of a brand-new chat — create the chat now,
      // titled straight from what the student typed.
      const res = await api.post("/chat", { title: userText.slice(0, 45) });
      chatId = res.data.id;
      setChats((prev) => [res.data, ...prev]);
      setActiveChatId(chatId);
    }

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, sender: "user", content: userText }]);

    try {
      const res = await api.post(`/chat/${chatId}/messages`, { content: userText });
      setMessages((prev) => [
        ...prev.filter((m) => !String(m.id).startsWith("temp-")),
        res.data.user_message,
        res.data.tutor_message,
      ]);
      // The backend may have just auto-titled this chat (new chat, or an
      // old empty one) — sync the sidebar with the confirmed title.
      const updatedChat = res.data.chat;
      if (updatedChat) {
        setChats((prev) => {
          const exists = prev.some((c) => c.id === updatedChat.id);
          if (exists) {
            return prev.map((c) => (c.id === updatedChat.id ? updatedChat : c));
          }
          return [updatedChat, ...prev];
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
      />
      <main className="chat-main">
        <Navbar
          title={`Hi, ${user?.full_name?.split(" ")[0] || "there"}`}
          subtitle="Ask a question, paste code, or request a hint"
          onLogout={logout}
          onMenuClick={() => setSidebarOpen(true)}
          rightActions={
            <button className="btn btn-ghost" onClick={() => navigate("/survey")}>
              <ClipboardList size={15} />
              <span className="btn-label">Survey</span>
            </button>
          }
        />

        <div className="messages-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>👋 Ask your first programming question to get started.</p>
              <p className="empty-state-hint">The tutor gives hints first — not full answers — to help you actually learn.</p>
            </div>
          )}
          {messages.map((m) => (
            <ChatBubble key={m.id} sender={m.sender} content={m.content} />
          ))}
          {sending && <ChatBubble sender="tutor" pending />}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-bar" onSubmit={handleSend}>
          <textarea
            placeholder="Ask a programming question or paste your code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button type="submit" className="btn btn-primary chat-send-btn" disabled={sending || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  );
}
