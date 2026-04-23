import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";

export default function AuthLayout() {
  const { accessToken } = useSelector((s) => s.auth);

  if (accessToken) {
    if (sessionStorage.getItem("new_registration")) {
      return <Navigate to="/onboarding" />;
    }
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
