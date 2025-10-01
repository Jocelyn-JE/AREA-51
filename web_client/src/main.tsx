import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Explore from "./pages/Explore";
import Layout from "./components/Layout";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect `/` to `/explore` */}
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* fallback route */}
          <Route path="*" element={<App />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
