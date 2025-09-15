import React from "react";
import UploadImage from "./components/UploadImage";

const App: React.FC = () => {
    return (
        <div
            style={{
                fontFamily: "Arial, sans-serif",
                background: "#f5f5f5",
                minHeight: "100vh",
                padding: "20px",
            }}
        >
            <UploadImage />
        </div>
    );
};

export default App;
