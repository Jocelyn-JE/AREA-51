import { Link, Outlet } from "react-router-dom";

export default function Layout() {
    const user = localStorage.getItem("token");

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/explore";
    };

    return (
        <div className="min-h-screen bg-gray-50 flex w-screen flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-6 bg-white shadow">
                <Link to="/" className="text-2xl font-bold text-blue-600">
                    AREA
                </Link>
                {user ? (
                    <div className="flex items-center">
                        <span className="text-gray-600 mr-4">Welcome back!</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                            Log out
                        </button>
                    </div>
                ) : (
                    <nav className="flex gap-4">
                        <Link to="/login" className="text-gray-600 px-4 py-2 hover:text-blue-600">
                            Log in
                        </Link>
                        <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Sign up
                        </Link>
                    </nav>
                )}
            </header>

            {/* Main content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="p-6 bg-gray-100 text-center text-gray-500">
                © {new Date().getFullYear()} AREA — Inspired by IFTTT
            </footer>
        </div>
    );
}
