import express from "express";
import cors from "cors";
import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS
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

// Init ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Auth route
app.get("/auth", (req, res) => {
    try {
        const auth = imagekit.getAuthenticationParameters();
        res.json(auth);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete route
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
