import { useState, FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, User, ShieldAlert, Sparkles, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, signup, triggerLocalToast } = useAuth();
  
  // Tab states: 'login' | 'signup' | 'forgot'
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field states
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const clearForm = () => {
    setUsername("");
    setName("");
    setEmail("");
    setPassword("");
    setUsernameOrEmail("");
    setErrorText(null);
  };

  const handleValidation = (): boolean => {
    if (activeTab === "signup") {
      if (username.length < 3) {
        setErrorText("Username must be at least 3 characters.");
        return false;
      }
      if (name.length < 2) {
        setErrorText("Name is required.");
        return false;
      }
      if (!email.includes("@")) {
        setErrorText("Enter a valid email address.");
        return false;
      }
      if (password.length < 6) {
        setErrorText("Password must be at least 6 characters.");
        return false;
      }
    } else if (activeTab === "login") {
      if (!usernameOrEmail.trim()) {
        setErrorText("Username or email is required.");
        return false;
      }
      if (password.length < 4) {
        setErrorText("Password is too short.");
        return false;
      }
    } else {
      if (!email.includes("@")) {
        setErrorText("Please specify a genuine email registration.");
        return false;
      }
    }
    setErrorText(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!handleValidation() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorText(null);

    const endpoint = activeTab === "signup" ? "/api/auth/signup" : activeTab === "login" ? "/api/auth/login" : "/api/auth/forgot-password";
    const body = activeTab === "signup" 
      ? { username, name, email, password } 
      : activeTab === "login" 
        ? { usernameOrEmail, password } 
        : { email };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something failed");
      }

      if (activeTab === "signup") {
        signup(data.token, data.user);
      } else if (activeTab === "login") {
        login(data.token, data.user);
      } else {
        triggerLocalToast("Instructive codes dispatched to " + email, "Check Inbox");
        setActiveTab("login");
        clearForm();
      }
    } catch (err: any) {
      setErrorText(err.message);
      triggerLocalToast(err.message, "Form Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex relative overflow-hidden select-none">
      
      {/* Background glowing gradients */}
      <div className="absolute top-10 right-10 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* LEFT SECTION: Aesthetic product logo and banner (only on large displays) */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 bg-cover bg-center border-r border-white/5"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(3, 3, 3, 0.85), rgba(3, 3, 3, 0.4)), url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&q=80')"
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">
            <span className="font-display font-bold text-xl text-white tracking-widest">P</span>
          </div>
          <span className="font-display font-semibold text-lg uppercase tracking-widest text-zinc-100">PIXORA</span>
        </div>

        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full select-none">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span className="text-xs font-mono font-medium text-pink-300">FUTURE SOCIAL MEDIA GATEWAY</span>
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
            Discover. Share. Connect. In High Fidelity.
          </h2>
          <p className="text-sm font-sans text-zinc-400 leading-relaxed">
            Pixora provides a visual canvas powered by dynamic stories, full-screen interactive reels, instant direct chat threads, and aesthetic grid categories. Connect with creators around the globe.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Globe className="h-4 w-4" />
          <span>V1.0.4 ENCRYPTED CHANNEL</span>
        </div>

      </div>

      {/* RIGHT SECTION: Interactive Forms Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 z-10 w-full">
        
        <div className="w-full max-w-sm glass-panel-heavy p-8 rounded-3xl shadow-2xl border border-white/10 transition-all">
          
          {/* Logo signature for mobile displays */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center mb-2 shadow-lg shadow-pink-500/10">
              <span className="font-display font-bold text-2xl text-white">P</span>
            </div>
            <h1 className="font-display text-xl font-bold tracking-widest text-white uppercase">PIXORA</h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">SECURE DIRECT CHANNEL</p>
          </div>

          <div className="text-center lg:text-left mb-6">
            <h2 className="font-display text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              {activeTab === "login" ? "Enter Pixora Space" : activeTab === "signup" ? "Synthesize Account" : "Access Credentials"}
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              {activeTab === "login" 
                ? "Discharge keys to start browsing." 
                : activeTab === "signup" 
                  ? "Define credentials to initiate." 
                  : "Type email to sync recovery code."}
            </p>
          </div>

          {/* Form validations error line */}
          {errorText && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 font-mono">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {activeTab === "signup" && (
              <>
                {/* Username Input */}
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username placeholder"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input placeholder-transparent text-white"
                    style={{ WebkitBoxShadow: "0 0 0 1000px #0a0a0a inset" }} /* Anti Chrome autocomplete color flare */
                    id="signup-username"
                  />
                  <label htmlFor="signup-username" className="absolute left-10 text-[10px] uppercase font-mono font-bold text-zinc-500 top-1.5 transition-all group-focus-within:text-pink-500 group-focus-within:top-1.5 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs">
                    Username
                  </label>
                </div>

                {/* Display Name Input */}
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input placeholder-transparent text-white animate-fade-in"
                    id="signup-fullname"
                  />
                  <label htmlFor="signup-fullname" className="absolute left-10 text-[10px] uppercase font-mono font-bold text-zinc-500 top-1.5">
                    Display Name
                  </label>
                </div>
              </>
            )}

            {/* Combined Username / Email input on Login */}
            {activeTab === "login" && (
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input placeholder-transparent text-white"
                  id="login-useremail"
                />
                <label htmlFor="login-useremail" className="absolute left-10 text-[10px] uppercase font-mono font-bold text-zinc-500 top-1.5">
                  Username or Email
                </label>
              </div>
            )}

            {/* Email input for Forgot Password & signup */}
            {(activeTab === "forgot" || activeTab === "signup") && (
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Registration"
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input placeholder-transparent text-white"
                  id="auth-email-input"
                />
                <label htmlFor="auth-email-input" className="absolute left-10 text-[10px] uppercase font-mono font-bold text-zinc-500 top-1.5">
                  Email Address
                </label>
              </div>
            )}

            {/* Password input */}
            {activeTab !== "forgot" && (
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 text-xs rounded-xl glass-input placeholder-transparent text-white"
                  id="auth-password-input"
                />
                <label htmlFor="auth-password-input" className="absolute left-10 text-[10px] uppercase font-mono font-bold text-zinc-500 top-1.5">
                  Password Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {/* Forgot password link on login */}
            {activeTab === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  id="forgot-pwd-trigger"
                  onClick={() => { setActiveTab("forgot"); setErrorText(null); }}
                  className="text-[10px] font-mono uppercase text-pink-400 hover:text-pink-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="auth-submit-btn"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold text-white text-xs tracking-widest uppercase hover:brightness-110 disabled:opacity-50 active:scale-98 shadow-md shadow-pink-500/10 transition"
            >
              {isSubmitting ? "PROCESSING..." : activeTab === "login" ? "ACCESS PIXORA" : activeTab === "signup" ? "INITIALIZE ACCOUNT" : "GET RECOVERY LINK"}
            </button>
          </form>

          {/* Social login divider line */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Simulated third party social connectors */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => triggerLocalToast("Connecting secure Google credentials", "Integration")}
              className="py-2.5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-[11px] font-medium flex items-center justify-center gap-2 transition"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.42-2.42C17.16 1.34 14.8.5 12.24.5a10.5 10.5 0 0 0 0 21c5.94 0 10.5-4.18 10.5-10.5 0-.7-.08-1.33-.23-1.715H12.24z"/>
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => triggerLocalToast("Connecting modern Apple credentials", "Integration")}
              className="py-2.5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-[11px] font-medium flex items-center justify-center gap-2 transition"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Toggle form channels */}
          <div className="text-center">
            {activeTab === "login" ? (
              <p className="text-xs text-zinc-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  id="tab-toggle-signup"
                  onClick={() => { setActiveTab("signup"); clearForm(); }}
                  className="font-semibold text-pink-400 hover:text-pink-300 hover:underline"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                Already have an account?{" "}
                <button
                  type="button"
                  id="tab-toggle-login"
                  onClick={() => { setActiveTab("login"); clearForm(); }}
                  className="font-semibold text-pink-400 hover:text-pink-300 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
