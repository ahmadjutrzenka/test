import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../constants/url";

const initialState = {
  reviews: [],
  loading: false,
  error: "",
};

export const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    reviewPending: (state) => {
      state.loading = true;
      state.error = "";
    },
    fetchReviewsSuccess: (state, action) => {
      state.reviews = action.payload;
      state.loading = false;
    },
    createReviewSuccess: (state, action) => {
      state.reviews.unshift(action.payload);
      state.loading = false;
    },
    updateReviewSuccess: (state, action) => {
      const idx = state.reviews.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.reviews[idx] = {
          ...state.reviews[idx],
          rating: action.payload.rating,
          content: action.payload.content,
          updatedAt: action.payload.updatedAt,
          isEdited: action.payload.isEdited,
        };
      }
      state.loading = false;
    },
    deleteReviewSuccess: (state, action) => {
      state.reviews = state.reviews.filter((r) => r.id !== action.payload);
      state.loading = false;
    },
    reviewFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  reviewPending,
  fetchReviewsSuccess,
  createReviewSuccess,
  updateReviewSuccess,
  deleteReviewSuccess,
  reviewFailed,
} = reviewSlice.actions;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const fetchRecentReviews = () => async (dispatch) => {
  try {
    dispatch(reviewPending());
    const { data } = await axios.get(`${BASE_URL}/reviews/recent`, {
      headers: getHeaders(),
    });
    dispatch(fetchReviewsSuccess(data));
  } catch (error) {
    dispatch(
      reviewFailed(error.response?.data?.message || "Failed to fetch reviews"),
    );
  }
};

export const createReview = (payload) => async (dispatch) => {
  try {
    dispatch(reviewPending());
    const { data } = await axios.post(`${BASE_URL}/reviews`, payload, {
      headers: getHeaders(),
    });
    dispatch(createReviewSuccess(data));
  } catch (error) {
    dispatch(
      reviewFailed(error.response?.data?.message || "Failed to create review"),
    );
  }
};

export const updateReview = (id, payload) => async (dispatch) => {
  try {
    dispatch(reviewPending());
    const { data } = await axios.patch(`${BASE_URL}/reviews/${id}`, payload, {
      headers: getHeaders(),
    });
    dispatch(updateReviewSuccess(data));
  } catch (error) {
    dispatch(
      reviewFailed(error.response?.data?.message || "Failed to update review"),
    );
  }
};

export const deleteReview = (id) => async (dispatch) => {
  try {
    dispatch(reviewPending());
    await axios.delete(`${BASE_URL}/reviews/${id}`, {
      headers: getHeaders(),
    });
    dispatch(deleteReviewSuccess(id));
  } catch (error) {
    dispatch(
      reviewFailed(error.response?.data?.message || "Failed to delete review"),
    );
  }
};

export const reviewReducer = reviewSlice.reducer;
export default reviewReducer;
