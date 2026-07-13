import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function DefaultRedirect() {
  const { user } = useAuth();
  const target =
    user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "REPORTER" ? "/home" : "/pos";
  return <Navigate to={target} replace />;
}
