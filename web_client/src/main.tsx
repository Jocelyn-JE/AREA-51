import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Explore from "./pages/Explore";
import Layout from "./components/Layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

const CLIENT_ID = "909777133411-taulnja2d04q6vd0e2n7105n0erkk4uv.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
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
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
