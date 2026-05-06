import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setemail] = useState<string>("");
  const [password, setpassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    } else if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.status === 401) {
        toast.error("Invalid email or password");
        return;
      } else if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success("Login successful");
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        
        setTimeout(() => {
          navigate("/products");
        }, 800);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f4f7fb] overflow-hidden p-4 sm:p-6 md:p-10">
      <div className="flex w-full max-w-[960px] h-full max-h-[640px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
        
        {/* Left Side */}
        <div className="hidden md:flex w-[45%] bg-[#101828] relative flex-col items-center justify-center p-12 overflow-hidden">
          <div className="absolute top-0 left-0 w-full pointer-events-none">
            <svg viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full opacity-30">
              <path d="M0 0C100 60 250 20 400 80V0H0Z" fill="url(#wave-gradient)" />
              <path d="M0 0C150 90 200 -10 400 50V0H0Z" fill="url(#wave-gradient-2)" className="opacity-50" />
              <defs>
                <linearGradient id="wave-gradient" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="wave-gradient-2" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563eb" />
                  <stop offset="1" stopColor="#1e40af" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center mb-10">
            <div className="w-[64px] h-[72px] bg-[#2563eb] relative flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
            </div>
            
            <h1 className="text-[26px] font-bold text-white mb-3 tracking-wide">Welcome Back!</h1>
            <p className="text-slate-300 text-[14px] text-center leading-relaxed max-w-[240px]">
              Sign in to continue to your admin dashboard
            </p>
          </div>

          <div className="absolute bottom-0 left-0 w-full flex items-end justify-center px-4 space-x-[2px] opacity-30">
            <div className="w-10 h-20 bg-blue-500/20 rounded-t-sm relative border border-blue-500/10 border-b-0">
              <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-white/40 rounded-[1px]"></div>
              <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-white/60 rounded-[1px]"></div>
              <div className="absolute top-8 left-2 w-1.5 h-1.5 bg-white/50 rounded-[1px]"></div>
            </div>
            <div className="w-14 h-32 bg-blue-500/30 rounded-t-sm relative border border-blue-500/20 border-b-0">
              <div className="absolute top-4 left-3 w-2 h-2 bg-white/70 rounded-[1px]"></div>
              <div className="absolute top-10 left-3 w-2 h-2 bg-white/30 rounded-[1px]"></div>
              <div className="absolute top-10 right-3 w-2 h-2 bg-white/80 rounded-[1px]"></div>
              <div className="absolute top-16 right-3 w-2 h-2 bg-white/60 rounded-[1px]"></div>
            </div>
            <div className="w-12 h-24 bg-blue-500/20 rounded-t-sm relative border border-blue-500/10 border-b-0">
               <div className="absolute top-5 left-4 w-1.5 h-3 bg-white/60 rounded-[1px]"></div>
               <div className="absolute top-12 left-4 w-1.5 h-3 bg-white/40 rounded-[1px]"></div>
            </div>
            <div className="w-16 h-40 bg-blue-500/30 rounded-t-sm relative border border-blue-500/20 border-b-0">
               <div className="absolute top-6 left-3 w-2 h-2 bg-white/50 rounded-[1px]"></div>
               <div className="absolute top-6 right-3 w-2 h-2 bg-white/80 rounded-[1px]"></div>
               <div className="absolute top-14 left-3 w-2 h-2 bg-white/90 rounded-[1px]"></div>
               <div className="absolute top-22 right-3 w-2 h-2 bg-white/40 rounded-[1px]"></div>
            </div>
            <div className="w-12 h-28 bg-blue-500/20 rounded-t-sm relative border border-blue-500/10 border-b-0">
               <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-white/40 rounded-[1px]"></div>
               <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-white/70 rounded-[1px]"></div>
            </div>
            <div className="w-14 h-36 bg-blue-500/30 rounded-t-sm relative border border-blue-500/20 border-b-0">
               <div className="absolute top-8 left-4 w-2 h-2 bg-white/60 rounded-[1px]"></div>
               <div className="absolute top-16 right-4 w-2 h-2 bg-white/50 rounded-[1px]"></div>
            </div>
            <div className="w-10 h-16 bg-blue-500/20 rounded-t-sm relative border border-blue-500/10 border-b-0">
               <div className="absolute top-3 left-2 w-1 h-1 bg-white/70 rounded-[1px]"></div>
               <div className="absolute top-8 right-2 w-1 h-1 bg-white/50 rounded-[1px]"></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#101828] to-transparent z-10"></div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-[55%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-white">
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
              <p className="text-[14px] text-slate-500">Please enter your credentials to access</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className={cn("text-[13px] font-semibold block transition-colors", emailError ? "text-red-500" : "text-slate-700")}>Email Address</label>
                <div className="relative">
                  <Mail className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", emailError ? "text-red-400" : "text-slate-400")} strokeWidth={2.5} />
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => {
                      setemail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-[14px] transition-all bg-white",
                      emailError 
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900" 
                        : "border-slate-200 focus:ring-[#2563eb]/20 focus:border-[#2563eb] text-slate-900 placeholder-slate-400"
                    )}
                  />
                </div>
                {emailError && <p className="text-[11px] text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1 duration-200">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <label className={cn("text-[13px] font-semibold block transition-colors", passwordError ? "text-red-500" : "text-slate-700")}>Password</label>
                <div className="relative">
                  <Lock className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", passwordError ? "text-red-400" : "text-slate-400")} strokeWidth={2.5} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => {
                      setpassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className={cn(
                      "w-full pl-10 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 text-[14px] transition-all bg-white",
                      passwordError 
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900" 
                        : "border-slate-200 focus:ring-[#2563eb]/20 focus:border-[#2563eb] text-slate-900 placeholder-slate-400"
                    )}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-[11px] text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1 duration-200">{passwordError}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#2563eb] text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors mt-4 shadow-sm shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          <div className="absolute bottom-8 left-0 w-full text-center">
            <p className="text-[12px] text-slate-400">© 2024 Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}