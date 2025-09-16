import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface AuthResponse {
    signature: string;
    token: string;
    expire: number;
}

export interface ImageKitUploadResponse {
    fileId: string;
    name: string;
    url: string;
}

export interface DeleteResponse {
    success: boolean;
}

// берем API URL из .env
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_ENDPOINT as string;

export const imageApi = createApi({
    reducerPath: "imageApi",
    baseQuery: fetchBaseQuery({
        baseUrl: AUTH_BASE_URL,
    }),
    endpoints: (builder) => ({
        // Получение подписи для загрузки
        getAuth: builder.query<AuthResponse, void>({
            query: () => "", // т.к. AUTH_BASE_URL уже = /api/imagekit/auth
        }),

        // Загрузка картинки в ImageKit
        uploadImage: builder.mutation<
            ImageKitUploadResponse,
            { formData: FormData; auth: AuthResponse }
        >({
            async queryFn({ formData, auth }) {
                try {
                    formData.append("signature", auth.signature);
                    formData.append("expire", String(auth.expire));
                    formData.append("token", auth.token);

                    const response = await fetch(
                        "https://upload.imagekit.io/api/v1/files/upload",
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (!response.ok) {
                        return {
                            error: {
                                status: response.status,
                                error: await response.text(),
                            } as any,
                        };
                    }

                    const data =
                        (await response.json()) as ImageKitUploadResponse;
                    return { data };
                } catch (err: any) {
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            error: err?.message ?? "Upload failed",
                        } as any,
                    };
                }
            },
        }),

        // Удаление файла через backend
        deleteFile: builder.mutation<DeleteResponse, string>({
            query: (fileId) => ({
                url: `/api/delete/${fileId}`,
                method: "DELETE",
            }),
        }),
    }),
});

export const {
    useGetAuthQuery,
    useUploadImageMutation,
    useDeleteFileMutation,
} = imageApi;
