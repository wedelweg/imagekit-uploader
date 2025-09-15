import { configureStore } from "@reduxjs/toolkit";
import { imageApi } from "../features/api/imageApi";

export const store = configureStore({
    reducer: {
        [imageApi.reducerPath]: imageApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(imageApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
