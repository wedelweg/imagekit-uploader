import express from "express";
import cors from "cors";
import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// --- CORS ---
const rawOrigins = process.env.CLIENT_ORIGIN || "";
const allowedOrigins = rawOrigins
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, cb) {
            // Разрешаем Postman/cURL и SSR-запросы без Origin
            if (!origin) return cb(null, true);
            // Разрешаем, если домен есть в списке
            if (allowedOrigins.includes(origin)) return cb(null, true);
            // Блокируем, если Origin не совпадает
            cb(new Error(`Not allowed by CORS: ${origin}`));
        },
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.options("*", cors());

app.use(express.json());

// --- ImageKit ---
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// 🔑 Подпись для загрузки
app.get("/api/imagekit/auth", (_req, res) => {
    try {
        const auth = imagekit.getAuthenticationParameters();
        res.json(auth);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🗑️ Удаление файла
app.delete("/api/delete/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;
        const resp = await imagekit.deleteFile(fileId);
        res.json({ success: true, response: resp });
    } catch (e) {
        res.status(e?.statusCode || 500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
