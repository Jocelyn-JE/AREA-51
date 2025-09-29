import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Explore from "./pages/Explore";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
          {/* Redirect `/` to `/explore` */}
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />
          {/* fallback route */}
          <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
