import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../constants/url";

const initialState = {
  results: { anime: [], manga: [], game: [], users: [] },
  detail: null,
  loading: false,
  error: "",
};

export const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    searchPending: (state) => {
      state.loading = true;
      state.error = "";
    },
    searchSuccess: (state, action) => {
      state.results = action.payload;
      state.loading = false;
    },
    detailSuccess: (state, action) => {
      state.detail = action.payload;
      state.loading = false;
    },
    searchFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearResults: (state) => {
      state.results = { anime: [], manga: [], game: [], users: [] };
    },
  },
});

export const {
  searchPending,
  searchSuccess,
  detailSuccess,
  searchFailed,
  clearResults,
} = searchSlice.actions;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const searchMedia =
  (q, type = "all") =>
  async (dispatch) => {
    try {
      dispatch(searchPending());
      const { data } = await axios.get(
        `${BASE_URL}/search?q=${encodeURIComponent(q)}&type=${type}`,
        { headers: getHeaders() },
      );
      dispatch(searchSuccess(data));
    } catch (error) {
      dispatch(searchFailed(error.response?.data?.message || "Search failed"));
    }
  };

export const getMediaDetail = (id, type) => async (dispatch) => {
  try {
    dispatch(searchPending());
    const { data } = await axios.get(
      `${BASE_URL}/search/detail?id=${id}&type=${type}`,
      { headers: getHeaders() },
    );
    dispatch(detailSuccess(data));
  } catch (error) {
    dispatch(
      searchFailed(error.response?.data?.message || "Failed to get detail"),
    );
  }
};

export const searchReducer = searchSlice.reducer;
export default searchReducer;
