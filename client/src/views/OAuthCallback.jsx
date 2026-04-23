import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDispatch } from "react-redux";
import { loginSuccess, fetchProfile } from "../features/auth/authSlice";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("access_token", token);
      dispatch(loginSuccess(token));
      dispatch(fetchProfile());
    }
    navigate("/");
  }, []);

  return <p className="text-white text-center mt-10">Redirecting...</p>;
}
