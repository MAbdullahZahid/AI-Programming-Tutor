import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  // Not logged in, or wrong role trying to reach a page that isn't theirs
  // (e.g. a student hitting /admin) — send them to the Home screen.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
