import { User, Bot } from "lucide-react";
import "./ChatBubble.css";

export default function ChatBubble({ sender, content, pending }) {
  const isUser = sender === "user";
  return (
    <div className={`bubble-row ${isUser ? "from-user" : "from-tutor"}`}>
      <div className="bubble-avatar">{isUser ? <User size={16} /> : <Bot size={16} />}</div>
      <div className={`bubble ${pending ? "pending" : ""}`}>
        {pending ? (
          <span className="typing-dots">
            <span></span><span></span><span></span>
          </span>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
