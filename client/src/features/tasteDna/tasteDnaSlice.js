import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../constants/url";

const initialState = {
  content: null,
  generatedAt: null,
  loading: false,
  error: "",
};

const tasteDnaSlice = createSlice({
  name: "tasteDna",
  initialState,
  reducers: {
    tasteDnaPending: (state) => {
      state.loading = true;
      state.error = "";
    },
    tasteDnaSuccess: (state, action) => {
      state.loading = false;
      state.content = action.payload.content;
      state.generatedAt = action.payload.generatedAt;
      state.error = "";
    },
    tasteDnaFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearTasteDna: (state) => {
      state.content = null;
      state.generatedAt = null;
      state.loading = false;
      state.error = "";
    },
  },
});

export const {
  tasteDnaPending,
  tasteDnaSuccess,
  tasteDnaFailed,
  clearTasteDna,
} = tasteDnaSlice.actions;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const generateTasteDNA = () => async (dispatch) => {
  try {
    dispatch(tasteDnaPending());
    const { data } = await axios.post(
      `${BASE_URL}/ai/taste-dna`,
      {},
      { headers: getHeaders() },
    );
    dispatch(tasteDnaSuccess(data));
  } catch (error) {
    dispatch(
      tasteDnaFailed(
        error.response?.data?.message || "Failed to generate Taste DNA",
      ),
    );
  }
};

export const tasteDnaReducer = tasteDnaSlice.reducer;
export default tasteDnaReducer;
