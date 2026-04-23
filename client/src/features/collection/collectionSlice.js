import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../constants/url";

const initialState = {
  items: [],
  loading: false,
  error: "",
};

export const collectionSlice = createSlice({
  name: "collection",
  initialState,
  reducers: {
    collectionPending: (state) => {
      state.loading = true;
      state.error = "";
    },
    collectionSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload;
    },
    collectionFailed: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addItemSuccess: (state, action) => {
      state.items.push(action.payload);
      state.loading = false;
    },
    updateItemSuccess: (state, action) => {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
      state.loading = false;
    },
    removeItemSuccess: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.loading = false;
    },
  },
});

export const {
  collectionPending,
  collectionSuccess,
  collectionFailed,
  addItemSuccess,
  updateItemSuccess,
  removeItemSuccess,
} = collectionSlice.actions;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const fetchCollections = (type) => async (dispatch) => {
  try {
    dispatch(collectionPending());
    const url = type
      ? `${BASE_URL}/collections?type=${type}`
      : `${BASE_URL}/collections`;
    const { data } = await axios.get(url, {
      headers: getHeaders(),
    });
    dispatch(collectionSuccess(data.collections));
  } catch (error) {
    dispatch(
      collectionFailed(
        error.response?.data?.message || "Failed to fetch collections",
      ),
    );
  }
};

export const addToCollection = (payload) => async (dispatch) => {
  try {
    dispatch(collectionPending());
    const { data } = await axios.post(`${BASE_URL}/collections`, payload, {
      headers: getHeaders(),
    });
    dispatch(addItemSuccess(data.collection));
  } catch (error) {
    dispatch(
      collectionFailed(
        error.response?.data?.message || "Failed to add item to collection",
      ),
    );
  }
};

export const updateCollection = (id, body) => async (dispatch) => {
  try {
    dispatch(collectionPending());
    const { data } = await axios.patch(`${BASE_URL}/collections/${id}`, body, {
      headers: getHeaders(),
    });
    dispatch(updateItemSuccess(data.collection));
  } catch (error) {
    dispatch(
      collectionFailed(
        error.response?.data?.message || "Failed to update collection",
      ),
    );
  }
};

export const removeFromCollection = (id) => async (dispatch) => {
  try {
    dispatch(collectionPending());
    await axios.delete(`${BASE_URL}/collections/${id}`, {
      headers: getHeaders(),
    });
    dispatch(removeItemSuccess(id));
  } catch (error) {
    dispatch(
      collectionFailed(
        error.response?.data?.message ||
          "Failed to remove item from collection",
      ),
    );
  }
};

export const collectionReducer = collectionSlice.reducer;
export default collectionReducer;
