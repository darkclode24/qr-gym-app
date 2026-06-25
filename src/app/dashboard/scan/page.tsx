"use client";

import React, { useState, useEffect, useRef } from "react";
import QRScanner from "@/components/QRScanner";
import GymCard from "@/components/GymCard";

interface VerifiedMember {
  id: string;
  name: string;
  memberId: string;
  userType: string;
  membershipType: string;
  validUntil: string | null;
  qrCode: string;
  profilePicture: string;
  status: string;
  isExpired?: boolean;
}

export default function ScanPage() {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    allowed: boolean;
    message: string;
    reason?: string;
    member: VerifiedMember;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Focus on mount and after verification status changes
  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    if (!verificationResult && !loading) {
      focusInput();
    }
  }, [verificationResult, loading]);

  // Global keydown event to capture scanner input if focus is lost
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If we are focused on input, do nothing
      if (document.activeElement === inputRef.current) return;

      // Ignore standard key combos or modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Ignore function keys, escape, etc.
      if (e.key.length > 1 && e.key !== "Enter" && e.key !== "Backspace") return;

      // Refocus input
      focusInput();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleScanSuccess = async (scannedValue: string) => {
    if (loading) return;
    setInputValue(scannedValue);
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setVerificationResult(null);

    try {
      const res = await fetch("/api/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: scannedValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memverifikasi QR Code.");

      setVerificationResult(data);
      setInputValue("");
      setShowCamera(false); // Collapse camera on success
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memproses kode QR.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setVerificationResult(null);

    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(value);

      const payload = isUUID ? { qrCode: value } : { memberId: value };

      const res = await fetch("/api/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Data tidak ditemukan / tidak valid.");

      setVerificationResult(data);
      setInputValue("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!verificationResult || !verificationResult.allowed) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: verificationResult.member.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan check-in.");

      setSuccessMsg(data.message);
      setVerificationResult(null);
      setInputValue("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan saat check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVerificationResult(null);
    setErrorMsg("");
    setSuccessMsg("");
    setInputValue("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Scan QR Check-in</h2>
        <p className="text-xs text-gray-400 mt-1">Sistem check-in otomatis menggunakan barcode scanner BP-OM200 USB atau kamera PC.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left column: Hardware Scanner Input & Camera toggle */}
        <div className="space-y-6">
          {!verificationResult && (
            <div className="space-y-6">
              {/* Primary Scanner Zone */}
              <div 
                onClick={focusInput}
                className={`relative bg-[#161616] border rounded-3xl p-6 transition duration-200 cursor-pointer ${
                  isFocused 
                    ? "border-[#f5b731] shadow-[0_0_15px_rgba(245,183,49,0.05)]" 
                    : "border-[#222] hover:border-[#333]"
                }`}
              >
                {/* Visual Status Indicator */}
                <div className="flex justify-between items-center mb-6">
                  <span className="font-extrabold text-[10px] tracking-wider uppercase text-zinc-500">
                    SISTEM SCANNER UTAMA (USB HID)
                  </span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                    <span className={`w-2 h-2 rounded-full ${isFocused ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`}></span>
                    <span className="text-[10px] font-bold text-gray-300">
                      {isFocused ? "Scanner Siap" : "Scanner Tidak Fokus"}
                    </span>
                  </div>
                </div>

                {/* Pulse Scanner Icon */}
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    {/* Pulsing ring */}
                    {isFocused && (
                      <span className="absolute inset-0 rounded-full bg-[#f5b731]/10 border border-[#f5b731]/20 animate-ping"></span>
                    )}
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center relative">
                      <svg className={`w-6 h-6 ${isFocused ? "text-[#f5b731]" : "text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5.01 16H5a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1h-.01z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-white mb-1">Arahkan Scanner ke QR Code</h3>
                  <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed mb-6">
                    Letakkan kursor di bawah atau cukup scan langsung menggunakan Blueprint BP-OM200.
                  </p>
                </div>

                {/* Form to submit scanning values */}
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Pindai QR Code atau ketik ID..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full px-5 py-4 pl-12 bg-[#1b1b1b] border border-[#2b2b2b] rounded-2xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731] font-mono tracking-wider transition duration-200"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className={`w-4 h-4 ${isFocused ? "text-[#f5b731]" : "text-zinc-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5.01 16H5a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1h-.01z" />
                    </svg>
                  </div>
                  {inputValue && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#f5b731] text-black font-extrabold text-[10px] rounded-lg hover:bg-[#c9941f] transition duration-200 disabled:opacity-50"
                    >
                      ENTER
                    </button>
                  )}
                </form>

                {/* Not Focused Warning Banner */}
                {!isFocused && (
                  <div className="mt-4 p-3 bg-yellow-950/20 border border-yellow-900/30 text-[#f5b731] rounded-2xl text-[10px] font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Fokus hilang! Klik di area box ini sebelum men-scan.</span>
                  </div>
                )}
              </div>

              {/* Camera Fallback Section */}
              <div className="bg-[#161616] border border-[#222] rounded-3xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setShowCamera(!showCamera)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-zinc-900/50 transition duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-[#f5b731]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-extrabold text-xs text-white">Gunakan Kamera PC / Webcam</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${showCamera ? "rotate-180" : ""}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCamera && (
                  <div className="p-6 border-t border-[#222] bg-zinc-950/20 space-y-4">
                    <QRScanner onScanSuccess={handleScanSuccess} autoStart={showCamera} />
                    <p className="text-[10px] text-center text-zinc-500 font-bold leading-relaxed px-4">
                      Gunakan ini sebagai fallback jika hardware scanner USB tidak berfungsi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-4.5 bg-red-950/20 border border-red-900/30 text-red-500 rounded-3xl text-sm font-semibold flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-500 rounded-3xl text-sm font-semibold flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {loading && !verificationResult && (
            <div className="flex items-center justify-center py-6">
              <svg className="animate-spin h-5 w-5 text-[#f5b731]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="ml-3 text-xs font-bold text-zinc-500">Sedang memverifikasi...</span>
            </div>
          )}
        </div>

        {/* Right column: Verification Results Card Panel */}
        <div>
          {verificationResult ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-[#222]">
                  <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">Hasil Verifikasi</h3>
                  
                  {verificationResult.allowed ? (
                    <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-black rounded-lg tracking-widest uppercase">
                      APPROVED
                    </span>
                  ) : (
                    <span className="px-3.5 py-1 bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-black rounded-lg tracking-widest uppercase">
                      DENIED
                    </span>
                  )}
                </div>

                {/* Gym Card Preview */}
                <div className="flex justify-center scale-90 sm:scale-100 origin-top overflow-x-auto">
                  <GymCard
                    name={verificationResult.member.name}
                    memberId={verificationResult.member.memberId}
                    userType={verificationResult.member.userType}
                    membershipType={verificationResult.member.membershipType}
                    validUntil={verificationResult.member.validUntil}
                    qrCode={verificationResult.member.qrCode}
                    profilePicture={verificationResult.member.profilePicture}
                    status={verificationResult.member.status}
                  />
                </div>

                {/* Reason detail for Denied status */}
                {!verificationResult.allowed && (
                  <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold leading-relaxed">
                    <strong>Alasan Ditolak:</strong> {verificationResult.message}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 font-bold text-sm">
                  <button
                    onClick={handleCancel}
                    className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl transition duration-200"
                  >
                    Batal
                  </button>
                  
                  {verificationResult.allowed && (
                    <button
                      onClick={handleConfirmCheckin}
                      disabled={loading}
                      className="w-2/3 py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold rounded-2xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Konfirmasi Check-in
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#161616]/40 border-2 border-dashed border-[#222] rounded-3xl h-[450px] flex flex-col items-center justify-center text-center p-6">
              <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <h3 className="font-extrabold text-sm text-zinc-500 uppercase tracking-wider">Menunggu Input Pindai</h3>
              <p className="text-xs text-zinc-650 max-w-xs mt-1 leading-relaxed">
                Arahkan scanner ke QR Code kartu pengunjung, atau ketik ID secara manual untuk memicu hasil verifikasi detail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
