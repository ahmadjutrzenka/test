import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../constants/url";

const createEmptyMediaMap = () => ({
  anime: [],
  manga: [],
  game: [],
});

const normalizeMediaMap = (payload) => ({
  anime: Array.isArray(payload?.anime) ? payload.anime : [],
  manga: Array.isArray(payload?.manga) ? payload.manga : [],
  game: Array.isArray(payload?.game) ? payload.game : [],
});

const initialState = {
  vibeResults: createEmptyMediaMap(),
  titleResults: createEmptyMediaMap(),
  excludedThisSession: createEmptyMediaMap(),
  loading: false,
  error: "",
};

const recommendationSlice = createSlice({
  name: "recommendation",
  initialState,
  reducers: {
    recommendationPending: (state) => {
      state.loading = true;
      state.error = "";
    },
    vibeMatchSuccess: (state, action) => {
      state.loading = false;
      state.vibeResults = normalizeMediaMap(action.payload);
    },
    titleMatchSuccess: (state, action) => {
      state.loading = false;
      state.titleResults = normalizeMediaMap(action.payload);
    },
    recommendationFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addExcluded: (state, action) => {
      const { type, titles } = action.payload;
      if (!state.excludedThisSession[type] || !Array.isArray(titles)) return;

      const merged = [...state.excludedThisSession[type], ...titles];
      state.excludedThisSession[type] = [...new Set(merged.filter(Boolean))];
    },
    clearSession: (state) => {
      state.vibeResults = createEmptyMediaMap();
      state.titleResults = createEmptyMediaMap();
      state.excludedThisSession = createEmptyMediaMap();
      state.loading = false;
      state.error = "";
    },
  },
});

export const {
  recommendationPending,
  vibeMatchSuccess,
  titleMatchSuccess,
  recommendationFailed,
  addExcluded,
  clearSession,
} = recommendationSlice.actions;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const fetchVibeMatch =
  (referenceIds, targetMediaTypes, excludeTitles = []) =>
  async (dispatch) => {
    try {
      dispatch(recommendationPending());
      const { data } = await axios.post(
        `${BASE_URL}/ai/vibe-match`,
        { referenceIds, targetMediaTypes, excludeTitles },
        { headers: getHeaders() },
      );
      dispatch(vibeMatchSuccess(data));
    } catch (error) {
      dispatch(
        recommendationFailed(
          error.response?.data?.message || "Failed to fetch vibe match",
        ),
      );
    }
  };

export const fetchTitleMatch =
  (collectionId, excludeTitles = []) =>
  async (dispatch) => {
    try {
      dispatch(recommendationPending());
      const { data } = await axios.post(
        `${BASE_URL}/ai/title-match`,
        { collectionId, excludeTitles },
        { headers: getHeaders() },
      );
      dispatch(titleMatchSuccess(data));
    } catch (error) {
      dispatch(
        recommendationFailed(
          error.response?.data?.message || "Failed to fetch title match",
        ),
      );
    }
  };

export const recommendationReducer = recommendationSlice.reducer;
export default recommendationReducer;
