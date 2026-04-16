import { useState, FormEvent } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { motion } from "motion/react";
import { LogIn, User, UserCircle, Lock, AlertCircle } from "lucide-react";

export function LoginScreen() {
  const { signIn, signInWithUsername } = useAuth();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await signInWithUsername(username, password, isSignUp, nickname);
      
      if (result.isSignUp) {
        setSuccess("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
        setIsSignUp(false);
        setPassword(""); // Clear password for security/convenience
        // Don't set loading false here yet if we expect an auto-login, 
        // but since we switched to login mode, we should let them click "Login"
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    try {
      await signIn();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 px-6 relative overflow-hidden" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-sm w-full"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-amber-500/20 rotate-12">
          <span className="text-4xl font-black text-black -rotate-12">صدى</span>
        </div>

        <h1 className="text-4xl font-extrabold text-neutral-50 mb-4 tracking-tight">
          أهلاً بك في صدى
        </h1>
        <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
          أول منصة اجتماعية صوتية عربية تجمعك بأصدقائك في غرف تفاعلية
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-right">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-400">
              <p className="font-bold mb-1">فشل العملية</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-3 text-right animate-in fade-in slide-in-from-top-2">
            <div className="w-5 h-5 text-green-500 shrink-0 mt-0.5">✅</div>
            <div className="text-sm text-green-400">
              <p className="font-bold mb-1">تم بنجاح</p>
              <p>{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 mb-6">
          <div className="relative">
            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم (للدخول)"
              required
              className="w-full bg-neutral-900 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          {isSignUp && (
            <div className="relative">
              <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="الاسم المستعار (للعرض)"
                required
                className="w-full bg-neutral-900 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              minLength={6}
              className="w-full bg-neutral-900 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-amber-400 transition-all active:scale-95 shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}</span>
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-white/5 flex-1" />
          <span className="text-xs text-neutral-500 font-bold">أو</span>
          <div className="h-px bg-white/5 flex-1" />
        </div>

        <button
          onClick={handleGoogleAuth}
          type="button"
          className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-95 shadow-xl mb-6"
        >
          <LogIn className="w-5 h-5" />
          <span>تسجيل الدخول عبر جوجل</span>
        </button>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          type="button"
          className="text-neutral-400 text-sm hover:text-white transition-colors"
        >
          {isSignUp ? "لديك حساب بالفعل؟ سجل دخولك" : "ليس لديك حساب؟ أنشئ حساباً جديداً"}
        </button>

        <p className="mt-8 text-neutral-600 text-xs">
          بتسجيلك، أنت توافق على شروط الخدمة وسياسة الخصوصية
        </p>
      </motion.div>
    </div>
  );
}
