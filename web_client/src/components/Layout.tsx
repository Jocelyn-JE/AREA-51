import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Layout({children}: {children?: React.ReactNode}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
    logout();
    navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex w-screen flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-6 bg-white shadow">
                <a href="/" className="text-2xl font-bold text-blue-600">
                    AREA
                </a>
                {user ? (
                    <div className="flex items-center">
                        <span className="text-gray-600 mr-4">Welcome {user.username}!</span>
                        <a
                            href="/areas"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-4"
                        >
                            Areas
                        </a>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                            Log out
                        </button>
                    </div>
                ) : (
                    <nav className="flex gap-4">
                        <a href="/login" className="text-gray-600 px-4 py-2 hover:text-blue-600">
                            Log in
                        </a>
                        <a href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Sign up
                        </a>
                    </nav>
                )}
            </header> 

            {/* Main content */}
            <main className="flex-1">
                {children ? children : <Outlet />}
            </main>

            {/* Footer */}
            <footer className="p-6 bg-gray-100 text-center text-gray-500">
                © {new Date().getFullYear()} AREA — Inspired by IFTTT
            </footer>
        </div>
    );
}
