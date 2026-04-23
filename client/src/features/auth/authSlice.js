import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../constants/url";

const initialState = {
  user: null,
  accessToken: localStorage.getItem("access_token"),
  loading: false,
  error: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginPending: (state) => {
      state.loading = true;
      state.error = "";
    },
    loginSuccess: (state, action) => {
      state.accessToken = action.payload;
      state.loading = false;
      state.error = "";
    },
    loginFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    fetchProfileSuccess: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },

    logoutAction: (state) => {
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const {
  loginPending,
  loginSuccess,
  loginFailed,
  fetchProfileSuccess,
  logoutAction,
} = authSlice.actions;

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginPending());
    const { data } = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    localStorage.setItem("access_token", data.access_token);
    dispatch(loginSuccess(data.access_token));
  } catch (error) {
    dispatch(loginFailed(error.response?.data?.message || "Login failed"));
  }
};

export const fetchProfile = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const { data } = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch(fetchProfileSuccess(data.user));
  } catch (error) {
    dispatch(logoutAction());
    localStorage.removeItem("access_token");
  }
};

export const register = (username, email, password) => async (dispatch) => {
  try {
    dispatch(loginPending());
    await axios.post(`${BASE_URL}/auth/register`, {
      username,
      email,
      password,
    });
    await dispatch(login(email, password));
  } catch (error) {
    dispatch(
      loginFailed(error.response?.data?.message || "Registration failed"),
    );
  }
};

export const googleLogin = (googleToken) => async (dispatch) => {
  try {
    dispatch(loginPending());
    const { data } = await axios.post(
      `${BASE_URL}/auth/google-login`,
      {},
      {
        headers: { access_token_google: googleToken },
      },
    );
    localStorage.setItem("access_token", data.access_token);
    dispatch(loginSuccess(data.access_token));
  } catch (error) {
    dispatch(
      loginFailed(error.response?.data?.message || "Google login failed"),
    );
  }
};

export const logout = () => (dispatch) => {
  localStorage.removeItem("access_token");
  dispatch(logoutAction());
};

export const authReducer = authSlice.reducer;
export default authReducer;
