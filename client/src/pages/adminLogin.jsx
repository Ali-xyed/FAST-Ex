import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminAPI } from "../utils/api";

function AdminLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await adminAPI.login({
                email: formData.email,
                password: formData.password,
            });

            if (response.data.success) {
                // Store Clerk token (same as regular users)
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                toast.success("Admin login successful!");
                navigate("/admin/users");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid admin credentials";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            <div className="w-full lg:w-[48%] flex flex-col justify-center px-12 lg:px-20 py-12">
                <div className="max-w-[340px] w-full mx-auto">
                    <div className="mb-12 -ml-0.5">
                        <h1 className="text-4xl font-black tracking-tighter text-black flex items-baseline">
                            ADMIN<span className="text-gray-300 font-bold italic ml-0.5">Panel</span>
                        </h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-1">Admin Access</h2>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            Enter admin credentials to access the dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-[12px] font-bold text-gray-800 mb-2">Admin Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm placeholder-gray-300"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-gray-800 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm placeholder-gray-300"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400 hover:text-black"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-black text-white py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all hover:bg-gray-900 ${isLoading ? "opacity-50" : ""}`}
                            >
                                {isLoading ? "..." : "Sign In as Admin"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-[12px] font-bold text-gray-400 uppercase tracking-tight">
                        <button onClick={() => navigate("/")} className="text-black font-black hover:underline underline-offset-4">Back to Home</button>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block lg:w-[52%] bg-black relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent flex flex-col justify-center px-20">
                    <div className="max-w-lg">
                        <h3 className="text-white text-6xl font-black italic tracking-tighter leading-[0.9] mb-8 animate-in slide-in-from-left-8 duration-700">
                            ADMIN <br />
                            <span className="text-white/40">DASHBOARD</span>
                        </h3>
                        <div className="space-y-2 animate-in slide-in-from-left-12 duration-1000">
                            <p className="text-white/80 text-2xl font-bold tracking-tight uppercase">
                                Manage & Verify
                            </p>
                            <p className="text-white/50 text-xl font-medium leading-relaxed italic">
                                Control platform content <br />
                                and user activity..
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-16 left-20 z-10 pointer-events-none">
                    <h3 className="text-white/5 text-[8rem] font-black italic tracking-[1.5rem] uppercase select-none leading-none">ADMIN</h3>
                </div>
            </div>
        </div>
    );
}

export default AdminLoginPage;
