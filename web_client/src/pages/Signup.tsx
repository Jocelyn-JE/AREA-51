import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const registerRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.error || "Registration failed");
      }

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
      navigate("/explore");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="h-screen bg-gray-50 flex max-w-screen flex-1 flex-col justify-center items-center text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Create your account</h2>
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow">
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <div className="mb-4 text-left">
                        <label className="block text-gray-700 mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <div className="mb-4 text-left">
                        <label className="block text-gray-700 mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    <div className="mb-6 text-left">
                        <label className="block text-gray-700 mb-2" htmlFor="confirm-password">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>
                <p className="mt-4 text-gray-600">Already have an account ?
                    <a href="/login" className="text-blue-600 hover:underline"> Log in</a>
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
                            navigate("/explore");
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
export default Signup;