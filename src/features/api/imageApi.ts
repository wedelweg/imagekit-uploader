import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const imageApi = createApi({
    reducerPath: "imageApi",
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    endpoints: (builder) => ({
        // Получаем auth от backend
        getAuth: builder.query<any, void>({
            query: () => "http://localhost:4000/auth",
        }),

        // Загружаем файл в ImageKit
        uploadImage: builder.mutation<any, { formData: FormData; auth: any }>({
            // queryFn используется вместо query
            queryFn: async ({ formData, auth }) => {
                try {
                    // добавляем auth-параметры
                    formData.append("signature", auth.signature);
                    formData.append("expire", auth.expire);
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
                                error: response.statusText,
                            } as any,
                        };
                    }

                    const data = await response.json();
                    return { data };
                } catch (err: any) {
                    return {
                        error: { status: "CUSTOM_ERROR", error: err.message } as any,
                    };
                }
            },
        }),
    }),
});

export const { useGetAuthQuery, useUploadImageMutation } = imageApi;
