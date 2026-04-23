import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import collectionReducer from "../features/collection/collectionSlice.js";
import reviewReducer from "../features/review/reviewSlice.js";
import searchReducer from "../features/search/searchSlice.js";
import recommendationReducer from "../features/recommendation/recommendationSlice.js";
import tasteDnaReducer from "../features/tasteDna/tasteDnaSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    collection: collectionReducer,
    review: reviewReducer,
    search: searchReducer,
    recommendation: recommendationReducer,
    tasteDna: tasteDnaReducer,
  },
});
