"use client";

import React, { useRef, useState } from "react";
import GymCard from "@/components/GymCard";


export default function DaftarBaruPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [createdMember, setCreatedMember] = useState<any>(null);

  // Form states
  const [userType, setUserType] = useState<"STUDENT" | "STAFF" | "PUBLIC">("STUDENT");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nim, setNim] = useState("");
  const [nip, setNip] = useState("");
  const [membershipType, setMembershipType] = useState<"DAILY" | "MONTHLY">("DAILY");

  // Photo states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const [isUpsideDown, setIsUpsideDown] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Pricing configuration
  const pricing = {
    STUDENT: { DAILY: "Rp 10.000", MONTHLY: "Rp 100.000" },
    STAFF: { DAILY: "Rp 15.000", MONTHLY: "Rp 150.000" },
    PUBLIC: { DAILY: "Rp 20.000", MONTHLY: "Rp 200.000" },
  };

  const startCamera = async () => {
    setErrorMsg("");
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraActive(false);
      setErrorMsg("Gagal mengakses kamera. Silakan unggah file foto secara manual.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror effect for front camera selfie
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        if (isUpsideDown) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(Math.PI);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Ukuran file foto terlalu besar. Maksimal 5MB.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!photoFile) {
      setErrorMsg("Foto profil wajib diambil atau diunggah.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("userType", userType);
      formData.append("membershipType", membershipType);
      
      if (userType === "STUDENT") formData.append("nim", nim);
      if (userType === "STAFF") formData.append("nip", nip);
      if (photoFile) formData.append("profilePicture", photoFile);

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan pendaftaran.");
      }

      setSuccessMsg("Keanggotaan berhasil didaftarkan dan diaktifkan!");
      
      // Fetch the newly created member details to show full card metadata (validUntil, etc.)
      const detailRes = await fetch(`/api/members/${data.member.id}`);
      const detailData = await detailRes.json();
      if (!detailRes.ok) throw new Error(detailData.error || "Gagal mengambil data lengkap.");
      
      setCreatedMember(detailData.member);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan internal server.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setPhone("");
    setNim("");
    setNip("");
    setPhotoFile(null);
    setPhotoPreview("");
    setCreatedMember(null);
    setSuccessMsg("");
    setErrorMsg("");
    setUserType("STUDENT");
    setMembershipType("DAILY");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-white">Daftarkan Anggota Baru</h2>
        <p className="text-xs text-gray-400 mt-1">
          Form pendaftaran keanggotaan gym khusus resepsionis. Pendaftaran akan otomatis disetujui (APPROVED) segera setelah dikirim.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-500 rounded-2xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {createdMember ? (
        // SUCCESS STATE: Show gym card inline + print / download / register new member
        <div className="bg-[#161616] border border-[#222] rounded-3xl p-8 flex flex-col items-center max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <span className="text-xs font-black tracking-[0.2em] text-[#f5b731] bg-[#f5b731]/10 px-3.5 py-1.5 rounded-full border border-[#f5b731]/10">
              KARTU ANGGOTA AKTIF
            </span>
            <p className="text-xs text-gray-400 mt-3">Unduh kartu dalam format PNG di bawah ini.</p>
          </div>

          <div className="overflow-x-auto w-full flex justify-center py-2">
            <GymCard
              name={createdMember.name}
              memberId={createdMember.memberId}
              userType={createdMember.userType}
              membershipType={createdMember.membershipType}
              validUntil={createdMember.validUntil}
              qrCode={createdMember.qrCode}
              profilePicture={createdMember.profilePicture}
              status={createdMember.status}
            />
          </div>

          <div className="w-full max-w-[600px] pt-4">
            <a
              href={`/api/members/${createdMember.id}/card`}
              download
              className="w-full py-4 px-5 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Kartu PNG
            </a>
          </div>

          <button
            onClick={handleReset}
            className="w-full max-w-[600px] py-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-extrabold text-xs rounded-2xl transition"
          >
            Daftarkan Anggota Baru Lainnya
          </button>
        </div>
      ) : (
        // FORM STATE: Two column layout for form and camera capture
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Input Fields */}
          <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 space-y-6">
            <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400 border-b border-[#222] pb-4">
              Data Keanggotaan
            </h3>

            {/* Access Category selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Kategori Akses
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "STUDENT", title: "Mahasiswa" },
                  { type: "STAFF", title: "Pegawai" },
                  { type: "PUBLIC", title: "Umum" },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setUserType(item.type as any);
                      setErrorMsg("");
                    }}
                    className={`py-3 px-2 text-center text-xs font-extrabold rounded-xl border transition ${
                      userType === item.type
                        ? "bg-[#f5b731]/10 border-[#f5b731] text-[#f5b731]"
                        : "bg-[#1f1f1f] border-[#2b2b2b] text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic details form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nama Lengkap Anggota
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731]"
                />
              </div>

              {userType === "STUDENT" && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    NIM (Nomor Induk Mahasiswa)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 09021282126042"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731]"
                  />
                </div>
              )}

              {userType === "STAFF" && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 198910242019031002"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731]"
                />
              </div>
            </div>

            {/* Membership Duration select */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Durasi Membership
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "DAILY", title: "Harian" },
                  { type: "MONTHLY", title: "Bulanan" },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setMembershipType(item.type as any)}
                    className={`py-3 text-center text-xs font-extrabold rounded-xl border transition ${
                      membershipType === item.type
                        ? "bg-[#f5b731]/10 border-[#f5b731] text-[#f5b731]"
                        : "bg-[#1f1f1f] border-[#2b2b2b] text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.title} ({item.type === "DAILY" ? "1 Hari" : "30 Hari"})
                  </button>
                ))}
              </div>
            </div>

            {/* Billing details info box */}
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block">TOTAL BIAYA MANUAL</span>
                <span className="text-[#f5b731] font-black text-xl leading-none mt-1 block">
                  {pricing[userType][membershipType]}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-medium text-right max-w-[200px]">
                Silakan tagih nominal pembayaran manual di atas sebelum mengonfirmasi pendaftaran.
              </div>
            </div>
          </div>

          {/* Right Column: Photo Capture and Camera */}
          <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 space-y-6">
            <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400 border-b border-[#222] pb-4">
              Foto Wajah Anggota
            </h3>

            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              {cameraActive ? (
                <div className="w-full relative aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-700">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transform scale-x-[-1] transition duration-300 ${isUpsideDown ? "rotate-180" : ""}`}
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUpsideDown(!isUpsideDown)}
                      className="px-4 py-2.5 bg-zinc-800/90 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-xl border border-zinc-600 transition duration-200"
                      title="Putar Balik Kamera"
                    >
                      <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl transition duration-200"
                    >
                      Ambil Foto
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition duration-200"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="relative w-44 h-48 rounded-2xl border-2 border-[#f5b731] overflow-hidden group shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview("");
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg"
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full p-8 border-2 border-dashed border-[#2b2b2b] rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-zinc-700 transition">
                  <svg className="w-12 h-12 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-white">Ambil Foto Wajah Anggota</p>
                    <p className="text-xs text-zinc-500 mt-1">Harap arahkan kamera AIO PC ke wajah anggota, atau pilih file.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-bold text-xs rounded-xl transition"
                    >
                      Gunakan Kamera
                    </button>
                    <label className="px-4 py-2.5 bg-[#f5b731]/10 hover:bg-[#f5b731]/20 text-[#f5b731] border border-[#f5b731]/30 font-bold text-xs rounded-xl cursor-pointer text-center transition">
                      Pilih dari File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#222] pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mendaftarkan...
                  </>
                ) : (
                  "Simpan & Aktifkan Keanggotaan"
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
