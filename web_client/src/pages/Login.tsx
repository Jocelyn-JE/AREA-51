import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          const loginRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          const loginData = await loginRes.json();
          if (!loginRes.ok) {
            throw new Error(loginData.error || "Auto-login failed");
          }

          localStorage.setItem("token", loginData.token);
          window.location.href = "/explore";
        } catch (err: any) {
          console.error("Login error:", err);
          setError(err.message || "Login failed. Please try again.");
        }
    };

    return (
        <div className="h-screen bg-gray-50 max-w-screen flex flex-1 flex-col justify-center items-center text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Connect to your account</h2>
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow">
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <div className="mb-4 text-left">
                        <label className="block text-gray-700 mb-2" htmlFor="identifier">
                            Email or Username
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-gray-700 mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Log in
                    </button>
                </form>
                <p className="mt-4 text-gray-600">Don't have an account ?
                    <a href="/signup" className="text-blue-600 hover:underline"> Sign up</a>
                </p>
                <div className="my-4 flex items-center w-full max-w-md">
                    <hr className="flex-grow border-t border-gray-300" />
                    <span className="mx-2 text-gray-500">or</span>
                    <hr className="flex-grow border-t border-gray-300" />
                </div>
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google/verify`, {
                            token: credentialResponse.credential
                        })
                        .then(response => {
                            localStorage.setItem("token", response.data.token);
                            window.location.href = "/explore";
                        }).catch(error => {
                            console.error("Google login error:", error);
                            setError("Google login failed");
                        });
                    }}
                    onError={() => {
                        console.log("Login Failed");
                        setError("Google login failed");
                    }}
                />       
        </div>
    );
}
export default Login;