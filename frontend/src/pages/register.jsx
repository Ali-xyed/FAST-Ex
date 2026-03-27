import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rollNo: "",
        password: "",
    });

    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const TOTAL_STEPS = 3;
    const stepLabels = ["Personal Info", "Email & Roll No", "Password"];

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/home");
        }
    }, [isAuthenticated, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (step === 1 && !formData.name) return;
        if (step === 2 && (!formData.email || !formData.rollNo)) return;
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (formData.password.length < 10) {
            toast.error("Password must be at least 10 characters.");
            return;
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
        if (!passwordRegex.test(formData.password)) {
            toast.error("Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await authAPI.register({
                email: formData.email,
                name: formData.name,
                rollNo: formData.rollNo,
                password: formData.password,
            });

            if (response.data.message) {
                toast.success(response.data.message);
                setStep(4); // Go to OTP verification step
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otpCode.join("");
        if (code.length < 6) {
            toast.error("Please enter the complete 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await authAPI.verifyOTP({
                email: formData.email,
                code: code,
            });

            if (response.data.message) {
                toast.success(response.data.message);
                navigate("/login");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid code.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otpCode.map((d, idx) => (idx === index ? element.value : d))];
        setOtpCode(newOtp);
        if (element.value && element.nextSibling) element.nextSibling.focus();
    };

    return (
        <div className="flex min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            <div className="w-full lg:w-[48%] flex flex-col justify-center px-12 lg:px-20 py-12">
                <div className="max-w-[340px] w-full mx-auto">
                    <div className="mb-10 -ml-0.5">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-black flex items-baseline">
                            FAST<span className="text-gray-300 font-bold ml-0.5">-Ex</span>
                        </h1>
                    </div>

                    {step <= TOTAL_STEPS && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                                    Step {step} of {TOTAL_STEPS}
                                    <span className="text-black ml-2">— {stepLabels[step - 1]}</span>
                                </p>
                                <p className="text-[11px] font-extrabold text-gray-300 uppercase tracking-widest">
                                    {Math.round((step / TOTAL_STEPS) * 100)}%
                                </p>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black rounded-full transition-all duration-300"
                                    style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight mb-1">
                            {step === 1 ? "What's your name?" :
                                step === 2 ? "University details" :
                                    step === 3 ? "Set a password" :
                                        "Verify your email"}
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            {step === 1 ? "Enter your full name" :
                                step === 2 ? "Use your FAST university email and roll number" :
                                    step === 3 ? "Must include uppercase, lowercase, digit & special character" :
                                        `We sent a 6-digit code to ${formData.email}`}
                        </p>
                    </div>

                    {step <= TOTAL_STEPS && (
                        <form onSubmit={step === TOTAL_STEPS ? handleRegister : handleNext} className="space-y-5">
                            {step === 1 && (
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-800 mb-2">Full Name</label>
                                    <input
                                        type="text" name="name" value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm placeholder-gray-300"
                                        placeholder="Muhammad Ahmad" required
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-800 mb-2">University Email</label>
                                        <input
                                            type="email" name="email" value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm placeholder-gray-300"
                                            placeholder="l23XXX@lhr.nu.edu.pk" required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-800 mb-2">Roll Number</label>
                                        <input
                                            type="text" name="rollNo" value={formData.rollNo}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm placeholder-gray-300"
                                            placeholder="23L-3059" required
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-800 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password" value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm placeholder-gray-300"
                                                placeholder="Password" required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase text-gray-400">
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <p className={`text-[10px] font-medium ${formData.password.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                                                ✓ At least 10 characters
                                            </p>
                                            <p className={`text-[10px] font-medium ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                ✓ One uppercase letter
                                            </p>
                                            <p className={`text-[10px] font-medium ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                ✓ One lowercase letter
                                            </p>
                                            <p className={`text-[10px] font-medium ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                ✓ One digit
                                            </p>
                                            <p className={`text-[10px] font-medium ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                ✓ One special character (!@#$%^&*)
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-800 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm placeholder-gray-300"
                                                placeholder="Confirm password" required
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase text-gray-400">
                                                {showConfirmPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                {step > 1 && (
                                    <button type="button" onClick={handleBack}
                                        className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-extrabold text-gray-500 uppercase tracking-tighter">
                                        Back
                                    </button>
                                )}
                                <button type="submit" disabled={isLoading}
                                    className={`flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-widest ${isLoading ? "opacity-50" : ""}`}>
                                    {isLoading ? "..." : step === TOTAL_STEPS ? "Complete" : "Next →"}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 4 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="flex justify-between gap-2">
                                {otpCode.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        value={data}
                                        onChange={(e) => handleOtpChange(e.target, index)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-11 h-11 text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-lg font-black"
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button type="submit" disabled={isLoading}
                                    className={`w-full bg-black text-white py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all hover:bg-gray-900 ${isLoading ? "opacity-50" : ""}`}>
                                    {isLoading ? "..." : "Verify & Continue"}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">
                            Already registered?{" "}
                            <button onClick={() => navigate("/login")} className="text-black font-extrabold hover:underline underline-offset-4">
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block lg:w-[52%] bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent flex flex-col justify-center px-20">
                    <div className="max-w-lg">
                        <h3 className="text-white text-6xl font-extrabold tracking-tighter leading-[0.9] mb-8">
                            STUDENT <br />
                            <span className="text-white/40">MARKETPLACE</span>
                        </h3>
                        <div className="space-y-2">
                            <p className="text-white/80 text-2xl font-bold tracking-tight uppercase">Join the community.</p>
                            <p className="text-white/50 text-xl font-medium leading-relaxed">
                                Buy, sell, rent, and exchange <br />
                                within your campus..
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-16 left-20 z-10 pointer-events-none">
                    <h3 className="text-white/5 text-[10rem] font-extrabold tracking-[1.5rem] uppercase select-none leading-none">FAST</h3>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
