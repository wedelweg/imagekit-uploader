import express from "express";
import cors from "cors";
import ImageKit from "imagekit";

const app = express();

// CORS: разрешаем доступ с фронта
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
app.use(
    cors({
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.options("*", cors());

app.use(express.json());

// Инициализация ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_yv2tW6glCoeLBRuNQ6OCfOmd6F0=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_XuF+pra0S7Un0gmfel+IoWVRLj4=",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io",
});

// Подпись для фронта
app.get("/auth", (req, res) => {
    try {
        const auth = imagekit.getAuthenticationParameters();
        res.json(auth);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Удаление файла
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
