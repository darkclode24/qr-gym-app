"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Pricing configuration
  const pricing = {
    STUDENT: { DAILY: "Rp 10.000", MONTHLY: "Rp 100.000" },
    STAFF: { DAILY: "Rp 15.000", MONTHLY: "Rp 150.000" },
    PUBLIC: { DAILY: "Rp 20.000", MONTHLY: "Rp 200.000" },
  };

  // Camera integration
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

  // Navigations
  const nextStep = () => {
    setErrorMsg("");
    
    if (step === 2) {
      if (!name.trim()) {
        setErrorMsg("Nama Lengkap wajib diisi.");
        return;
      }
      if (!phone.trim()) {
        setErrorMsg("Nomor WhatsApp wajib diisi.");
        return;
      }
      if (userType === "STUDENT" && !nim.trim()) {
        setErrorMsg("NIM wajib diisi.");
        return;
      }
      if (userType === "STAFF" && !nip.trim()) {
        setErrorMsg("NIP wajib diisi.");
        return;
      }
    }

    if (step === 3) {
      if (!photoFile) {
        setErrorMsg("Foto profil wajib diunggah atau diambil.");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    stopCamera();
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

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

      // Success -> Redirect to card view page using QR UUID
      router.push(`/kartu/${data.member.qrCode}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Terjadi kesalahan internal server.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#161616] border border-[#262626] rounded-3xl p-8 shadow-2xl">
      {/* Step Progress Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#262626]">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === s
                  ? "bg-[#f5b731] text-black ring-4 ring-[#f5b731]/20"
                  : step > s
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {s}
            </div>
            {s < 5 && <div className={`w-8 h-0.5 mx-2 ${step > s ? "bg-emerald-500/40" : "bg-zinc-800"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: SELECT ACCESS TYPE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Pilih Kategori Akses</h2>
              <p className="text-xs text-gray-400 mt-1">Pilih tipe keanggotaan Anda di Universitas Sriwijaya.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {[
                { type: "STUDENT", title: "Mahasiswa", desc: "Aktif berkuliah di UNSRI (Membutuhkan NIM)" },
                { type: "STAFF", title: "Dosen / Pegawai", desc: "Tenaga pendidik/kependidikan UNSRI (Membutuhkan NIP)" },
                { type: "PUBLIC", title: "Umum (Masyarakat Publik)", desc: "Masyarakat umum di luar sivitas akademika UNSRI" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setUserType(item.type as any)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
                    userType === item.type
                      ? "bg-[#f5b731]/5 border-[#f5b731] ring-1 ring-[#f5b731]"
                      : "bg-[#1f1f1f]/50 border-[#2b2b2b] hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-base font-extrabold ${userType === item.type ? "text-[#f5b731]" : "text-white"}`}>
                      {item.title}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        userType === item.type ? "border-[#f5b731] bg-[#f5b731]" : "border-zinc-600"
                      }`}
                    >
                      {userType === item.type && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={nextStep}
                className="w-full py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200 shadow-lg shadow-[#f5b731]/10"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE DETAILS */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Lengkapi Data Diri</h2>
              <p className="text-xs text-gray-400 mt-1">Masukkan informasi pendaftaran yang valid.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bintang Ramadhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731] focus:ring-1 focus:ring-[#f5b731]"
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
                    className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731] focus:ring-1 focus:ring-[#f5b731]"
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
                    className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731] focus:ring-1 focus:ring-[#f5b731]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nomor Telepon (WhatsApp Aktif)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731] focus:ring-1 focus:ring-[#f5b731]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-sm rounded-2xl transition duration-200"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="w-2/3 py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: UPLOAD PROFILE PIC */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Unggah Foto Profil</h2>
              <p className="text-xs text-gray-400 mt-1">
                Foto akan ditampilkan pada kartu gym dan digunakan resepsionis untuk verifikasi wajah. Pengguna tidak dapat mengubah foto setelah submit.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-4">
              {cameraActive ? (
                <div className="w-full relative aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-700">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
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
                    <p className="text-sm font-semibold text-white">Pilih metode pengambilan foto</p>
                    <p className="text-xs text-zinc-500 mt-1">Ukuran foto maksimal 5MB (JPG/PNG).</p>
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

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-sm rounded-2xl transition duration-200"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="w-2/3 py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SELECT MEMBERSHIP TYPE */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Pilih Durasi Keanggotaan</h2>
              <p className="text-xs text-gray-400 mt-1">
                Pilih jenis langganan. Tarif disesuaikan berdasarkan kategori akses ({userType}).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  type: "DAILY",
                  title: "HARIAN",
                  price: pricing[userType].DAILY,
                  desc: "Akses gym sepuasnya khusus pada hari kedatangan check-in.",
                },
                {
                  type: "MONTHLY",
                  title: "BULANAN",
                  price: pricing[userType].MONTHLY,
                  desc: "Masa aktif 30 hari penuh sejak pendaftaran disetujui.",
                },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setMembershipType(item.type as any)}
                  className={`text-left p-5 rounded-2xl border flex flex-col justify-between h-48 transition-all duration-200 ${
                    membershipType === item.type
                      ? "bg-[#f5b731]/5 border-[#f5b731] ring-1 ring-[#f5b731]"
                      : "bg-[#1f1f1f]/50 border-[#2b2b2b] hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-widest text-zinc-500">
                        MEMBERSHIP
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          membershipType === item.type ? "border-[#f5b731] bg-[#f5b731]" : "border-zinc-600"
                        }`}
                      >
                        {membershipType === item.type && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                    </div>
                    <span className="text-lg font-black text-white mt-1 block">
                      {item.title}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="text-[#f5b731] font-black text-lg">
                    {item.price}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-sm rounded-2xl transition duration-200"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="w-2/3 py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRM & SUBMIT */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Konfirmasi Data</h2>
              <p className="text-xs text-gray-400 mt-1">Periksa kembali data Anda sebelum mengirim pendaftaran.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="bg-[#1f1f1f] rounded-2xl border border-[#2b2b2b] p-6 space-y-4 text-sm">
              <div className="flex gap-4 items-center border-b border-[#2b2b2b] pb-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-zinc-800 relative shadow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white uppercase">{name}</h3>
                  <span className="text-xs font-bold text-[#f5b731] tracking-wider uppercase bg-[#f5b731]/10 px-2.5 py-1 rounded-md border border-[#f5b731]/10 mt-1.5 inline-block">
                    {userType === "STUDENT" ? "MAHASISWA" : userType === "STAFF" ? "PEGAWAI" : "UMUM"}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nomor Telepon</span>
                  <span className="text-white font-bold">{phone}</span>
                </div>
                {userType === "STUDENT" && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">NIM</span>
                    <span className="text-white font-bold">{nim}</span>
                  </div>
                )}
                {userType === "STAFF" && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">NIP</span>
                    <span className="text-white font-bold">{nip}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipe Membership</span>
                  <span className="text-[#f5b731] font-bold">
                    {membershipType === "DAILY" ? "HARIAN" : "BULANAN"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#2b2b2b] pt-3 text-base">
                  <span className="text-white font-bold">Biaya Langganan</span>
                  <span className="text-[#f5b731] font-black">{pricing[userType][membershipType]}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed text-amber-300">
              <svg className="w-6 h-6 flex-shrink-0 text-[#f5b731]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Catatan:</strong> Selesaikan pembayaran secara manual kepada resepsionis di lokasi gym agar status kartu Anda diaktifkan (APPROVED).
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={prevStep}
                className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-sm rounded-2xl transition duration-200 disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-2xl transition duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Ajukan Pendaftaran"
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
