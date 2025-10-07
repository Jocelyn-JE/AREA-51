import { Link, Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-50 flex w-screen flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-6 bg-white shadow">
                <Link to="/" className="text-2xl font-bold text-blue-600">
                    AREA
                </Link>
                <nav className="flex gap-4">
                    <Link to="/login" className="text-gray-600 px-4 py-2 hover:text-blue-600">
                        Log in
                    </Link>
                    <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Sign up
                    </Link>
                </nav>
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
