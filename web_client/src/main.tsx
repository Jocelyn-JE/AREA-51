import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import App from "./App";
import Explore from "./pages/Explore";
import Layout from "./components/Layout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ServiceDetail from "./pages/ServiceDetail";
import Areas from "./pages/Areas";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error("Missing Google OAuth client ID. Please set VITE_GOOGLE_CLIENT_ID in your environment.");
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/explore" replace />} />
              <Route path="explore" element={<Explore />} />
              <Route path="service/:serviceName" element={<ServiceDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="areas" element={<ProtectedRoute><Areas /></ProtectedRoute>} />
              <Route path="*" element={<App />} />
            </Route>
          </Routes>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
