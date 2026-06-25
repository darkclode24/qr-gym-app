"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error("Username atau password salah.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan sistem.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between py-12 px-4 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-[#f5b731]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="flex-1 w-full max-w-sm mx-auto flex items-center justify-center">
        <div className="w-full bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#f5b731] flex items-center justify-center text-black font-black text-base mx-auto shadow-lg shadow-[#f5b731]/10">
              UG
            </div>
            <h2 className="text-xl font-extrabold text-white">Login Resepsionis</h2>
            <p className="text-xs text-gray-400">Masuk untuk mengelola keanggotaan gym.</p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731] focus:ring-1 focus:ring-[#f5b731]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731] focus:ring-1 focus:ring-[#f5b731]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200 shadow-lg shadow-[#f5b731]/10 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="text-center text-[10px] text-zinc-700 font-semibold">
        &copy; {new Date().getFullYear()} Universitas Sriwijaya Fitness Center.
      </footer>
    </div>
  );
}
