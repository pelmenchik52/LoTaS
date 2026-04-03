import { Navigate } from "react-router";
import type { UserRole } from "../types";

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole") as UserRole | null;

  // Немає токена → на логін
  if (!token) return <Navigate to="/login" replace />;

  // Роль не підходить → 403
  if (!role || !allowedRoles.includes(role)) {
    return <div className="p-8 text-red-500">Доступ заборонено</div>;
  }

  return <>{children}</>;
}