import { User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatBubble.css";

export default function ChatBubble({ sender, content, pending }) {
  const isUser = sender === "user";
  return (
    <div className={`bubble-row ${isUser ? "from-user" : "from-tutor"}`}>
      <div className="bubble-avatar">{isUser ? <User size={16} /> : <Sparkles size={15} />}</div>
      <div className={`bubble ${pending ? "pending" : ""}`}>
        {pending ? (
          <span className="typing-dots">
            <span></span><span></span><span></span>
          </span>
        ) : isUser ? (
          <div className="md-content">{content}</div>
        ) : (
          <div className="md-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
