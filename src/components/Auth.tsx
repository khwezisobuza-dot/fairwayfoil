import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";

export function AuthForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("flow", flow);
    try {
      // Using the Password provider for Email/Phone login
      await signIn("password", formData);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your tactical credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      console.log("Attempting guest entry...");
      await signIn("anonymous");
      console.log("Guest entry success!");
    } catch (err: any) {
      console.error("Guest entry error:", err);
      setError(err.message || "Guest entry failed. Tactically, the server might be resetting.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-block relative mb-4">
             <div className="absolute w-4 h-4 bg-lime-400 rounded-full animate-golf-ball shadow-[0_0_15px_rgba(163,230,53,0.8)] z-10" />
             <h1 className="text-4xl font-black italic text-lime-400 tracking-tighter">FAIRWAY FOIL</h1>
          </div>
          <p className="text-zinc-400 uppercase tracking-[0.3em] text-[10px] font-bold">Tactical Strategic Partner</p>
        </div>

        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <h2 className="text-2xl font-black italic uppercase text-white mb-6 tracking-tight">
            {flow === "signIn" ? "Tactical Login" : "Create Intel Link"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lime-400 transition-colors">
                <Mail size={18} />
              </div>
              <input
                name="email"
                type="text"
                placeholder="Email or Phone Number"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder-zinc-500 focus:border-lime-400/50 outline-none transition-all"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lime-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder-zinc-500 focus:border-lime-400/50 outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-black uppercase bg-red-500/10 border border-red-500/20 p-3 rounded-xl animate-in shake duration-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-lime-400 to-lime-600 text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-[0_4px_15px_rgba(163,230,53,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-50 pointer-events-none" />
               <span className="relative z-10">{isLoading ? "Verifying..." : flow === "signIn" ? "Secure Login" : "Initialize Link"}</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleAnonymousSignIn}
              className="w-full bg-zinc-800 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter border border-white/10 shadow-lg active:scale-[0.98] transition-all hover:bg-zinc-700"
            >
              Tactical Guest Entry
            </button>
          </form>

          <button
            type="button"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            className="w-full text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-lime-400 transition-colors"
          >
            {flow === "signIn" ? "Need tactical access? Register" : "Already registered? Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
