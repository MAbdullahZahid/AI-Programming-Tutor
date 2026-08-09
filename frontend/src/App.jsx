import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import Survey from "./pages/Survey/Survey.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import ManageSurvey from "./pages/Admin/ManageSurvey.jsx";
import SurveyResults from "./pages/Admin/SurveyResults.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// Redirects an already-logged-in user straight to their app (chat/admin)
// so they never see the Home, Login, or Register screens again until logout.
function RedirectIfLoggedIn({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/chat"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectIfLoggedIn><Home /></RedirectIfLoggedIn>} />
      <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
      <Route path="/register" element={<RedirectIfLoggedIn><Register /></RedirectIfLoggedIn>} />

      <Route
        path="/chat"
        element={
          <ProtectedRoute role="student">
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/survey"
        element={
          <ProtectedRoute role="student">
            <Survey />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/survey"
        element={
          <ProtectedRoute role="admin">
            <ManageSurvey />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/survey/results"
        element={
          <ProtectedRoute role="admin">
            <SurveyResults />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
