import React, { useState, useRef, useEffect } from "react";
import { useGetAuthQuery } from "../features/api/imageApi";

interface UploadHistoryItem {
    url: string;
    name: string;
    fileId: string;
}

const UploadImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [loaded, setLoaded] = useState<Record<string, boolean>>({});
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [closingModal, setClosingModal] = useState(false);

    const dropRef = useRef<HTMLDivElement | null>(null);

    const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

    const { data: auth, refetch } = useGetAuthQuery();

    useEffect(() => {
        const saved = localStorage.getItem("uploadHistory");
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("uploadHistory", JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        const div = dropRef.current;
        if (!div) return;

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            div.classList.add("dragover");
        };
        const handleDragLeave = () => {
            div.classList.remove("dragover");
        };
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            div.classList.remove("dragover");
            if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        };

        div.addEventListener("dragover", handleDragOver);
        div.addEventListener("dragleave", handleDragLeave);
        div.addEventListener("drop", handleDrop);

        return () => {
            div.removeEventListener("dragover", handleDragOver);
            div.removeEventListener("dragleave", handleDragLeave);
            div.removeEventListener("drop", handleDrop);
        };
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setProgress(0);
    };

    const handleUpload = async () => {
        if (!file || !auth) return;

        const freshAuth = await refetch().unwrap();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append(
            "publicKey",
            import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY ||
            "public_yv2tW6glCoeLBRuNQ6OCfOmd6F0="
        );
        formData.append("signature", freshAuth.signature);
        formData.append("expire", freshAuth.expire);
        formData.append("token", freshAuth.token);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const res = JSON.parse(xhr.responseText);
                setHistory((prev) => [
                    { url: res.url, name: file.name, fileId: res.fileId },
                    ...prev,
                ]);
                setFile(null);
                setPreview(null);
                setProgress(0);
            } else {
                console.error("Upload failed:", xhr.responseText);
            }
        };

        xhr.onerror = () => console.error("Upload error");

        xhr.send(formData);
    };

    const handleDelete = async (fileId: string) => {
        setDeleting(fileId);
        setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/delete/${fileId}`, {
                    method: "DELETE",
                });
                if (!res.ok) throw new Error("Error deleting file");
                console.log("File deleted:")
                setHistory((prev) => prev.filter((item) => item.fileId !== fileId));
            } catch (err) {
                console.error(err);
            } finally {
                setDeleting(null);
            }
        }, 400);
    };

    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem("uploadHistory");
    };

    const markAsLoaded = (fileId: string) => {
        setLoaded((prev) => ({ ...prev, [fileId]: true }));
    };

    const closeModal = () => {
        setClosingModal(true);
        setTimeout(() => {
            setSelectedImage(null);
            setClosingModal(false);
        }, 300);
    };

    return (
        <div style={{ maxWidth: 900, margin: "20px auto", textAlign: "center" }}>
            <h1 style={{ color: "#1976d2" }}>ImageKit uploader</h1>

            {/* Drag & Drop */}
            <div
                ref={dropRef}
                style={{
                    border: "2px dashed #1976d2",
                    padding: "40px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    background: "#f9f9f9",
                    cursor: "pointer",
                }}
                onClick={() => document.getElementById("fileInput")?.click()}
            >
                {file ? (
                    <p
                        style={{
                            maxWidth: "90%",
                            margin: "0 auto",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        Выбран файл: {file.name}
                    </p>
                ) : (
                    <p>Перетащите файл сюда или нажмите</p>
                )}
                <input
                    id="fileInput"
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) =>
                        e.target.files && handleFileSelect(e.target.files[0])
                    }
                />
            </div>

            {/* Превью */}
            {preview && (
                <div style={{ marginBottom: "20px" }}>
                    <img
                        src={preview}
                        alt="preview"
                        style={{
                            maxWidth: "400px",
                            maxHeight: "300px",
                            objectFit: "contain",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            display: "block",
                            margin: "0 auto",
                        }}
                    />
                </div>
            )}

            {/* Кнопка загрузки */}
            <button
                onClick={handleUpload}
                disabled={!file || !auth || (progress > 0 && progress < 100)}
                style={{
                    padding: "12px 24px",
                    background: !file ? "#aaa" : "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: !file ? "not-allowed" : "pointer",
                    transition: "0.3s",
                }}
            >
                {progress > 0 && progress < 100 ? "Загрузка..." : "Загрузить"}
            </button>

            {/* progress bar */}
            {progress > 0 && (
                <div
                    style={{
                        width: "100%",
                        background: "#eee",
                        borderRadius: "6px",
                        marginTop: "15px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: "16px",
                            background:
                                "linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)",
                            backgroundSize: "200% 100%",
                            animation: "progressAnim 1.5s linear infinite",
                            color: "#fff",
                            textAlign: "center",
                            lineHeight: "16px",
                            fontSize: "12px",
                            transition: "width 0.3s ease",
                        }}
                    >
                        {progress}%
                    </div>
                </div>
            )}

            {/* History */}
            <div style={{ marginTop: "40px", textAlign: "left" }}>
                <h3 style={{ display: "flex", alignItems: "center" }}>
                    История загрузок
                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            style={{
                                marginLeft: "10px",
                                padding: "6px 14px",
                                background: "#e53935",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 500,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            }}
                        >
                            Очистить
                        </button>
                    )}
                </h3>
                {history.length === 0 && <p>История пуста</p>}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "20px",
                        marginTop: "20px",
                    }}
                >
                    {history.map((item) => {
                        const ext = item.name.split(".").pop()?.toUpperCase() || "FILE";
                        const isLoaded = loaded[item.fileId];
                        return (
                            <div
                                key={item.fileId}
                                style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    overflow: "hidden",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    cursor: "pointer",
                                    transition: "all 0.4s ease",
                                    opacity: deleting === item.fileId ? 0 : 1,
                                    transform:
                                        deleting === item.fileId ? "scale(0.9)" : "scale(1)",
                                    animation: "fadeIn 0.4s ease",
                                }}
                            >
                                <div
                                    style={{
                                        background: "#f0f4fa",
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                >
                                    {ext}
                                </div>

                                <div
                                    style={{ flexGrow: 1 }}
                                    onClick={() => setSelectedImage(item.url)}
                                >
                                    {!isLoaded && (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "160px",
                                                background:
                                                    "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                                                backgroundSize: "200% 100%",
                                                animation: "loadingShimmer 1.5s infinite",
                                            }}
                                        />
                                    )}
                                    <img
                                        src={item.url}
                                        alt={item.name}
                                        style={{
                                            width: "100%",
                                            height: "160px",
                                            objectFit: "cover",
                                            display: isLoaded ? "block" : "none",
                                            opacity: isLoaded ? 1 : 0,
                                            transform: isLoaded ? "scale(1)" : "scale(0.95)",
                                            transition: "all 0.4s ease",
                                        }}
                                        onLoad={() => markAsLoaded(item.fileId)}
                                    />
                                </div>

                                <div style={{ padding: "8px 10px", fontSize: "13px" }}>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            marginBottom: "4px",
                                        }}
                                        title={item.name}
                                    >
                                        {item.name}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(item.fileId)}
                                    style={{
                                        position: "absolute",
                                        top: "8px",
                                        right: "8px",
                                        background: "rgba(255,255,255,0.9)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "28px",
                                        height: "28px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "16px",
                                        color: "#e53935",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* modalka */}
            {selectedImage && (
                <div
                    onClick={closeModal}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 999,
                        animation: closingModal
                            ? "fadeOut 0.3s ease forwards"
                            : "fadeIn 0.3s ease",
                    }}
                >
                    <img
                        src={selectedImage}
                        alt="enlarged"
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            borderRadius: "12px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                            animation: closingModal
                                ? "zoomOut 0.3s ease forwards"
                                : "zoomIn 0.3s ease",
                        }}
                    />
                </div>
            )}

            {/* CSS */}
            <style>
                {`
        @keyframes loadingShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes zoomOut {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.9); opacity: 0; }
        }
        @keyframes progressAnim {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}
            </style>
        </div>
    );
};

export default UploadImage;
