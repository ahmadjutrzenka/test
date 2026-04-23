import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";

export default function AuthLayout() {
  const { accessToken } = useSelector((s) => s.auth);
  if (accessToken) return <Navigate to="/" />;
  return <Outlet />;
}
