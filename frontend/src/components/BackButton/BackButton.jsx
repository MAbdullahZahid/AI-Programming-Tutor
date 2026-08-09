import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./BackButton.css";

/**
 * Floating "back" button. Defaults to Home ("/"), pass `to` to override.
 */
export default function BackButton({ to = "/", label = "Back to home" }) {
  const navigate = useNavigate();
  return (
    <button className="back-button" onClick={() => navigate(to)}>
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}
