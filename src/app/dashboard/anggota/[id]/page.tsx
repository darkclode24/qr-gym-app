"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import GymCard from "@/components/GymCard";


interface CheckInLog {
  id: string;
  checkedAt: string;
}

interface MemberDetail {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  userType: string;
  membershipType: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  profilePicture: string;
  qrCode: string;
  isExpired: boolean;
  createdAt: string;
  checkIns: CheckInLog[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [renewing, setRenewing] = useState(false);

  // Edit states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("");
  const [nim, setNim] = useState("");
  const [nip, setNip] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Renewal states
  const [renewType, setRenewType] = useState<"DAILY" | "MONTHLY" | "CUSTOM">("DAILY");
  const [customMonths, setCustomMonths] = useState<string>("1");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchMemberDetail = async () => {
    try {
      const res = await fetch(`/api/members/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil data.");
      
      setMember(data.member);
      
      // Initialize edit states
      setName(data.member.name);
      setPhone(data.member.phone);
      setUserType(data.member.userType);
      setPhotoPreview(data.member.profilePicture);
      if (data.member.userType === "STUDENT") setNim(data.member.memberId);
      if (data.member.userType === "STAFF") setNip(data.member.memberId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Anggota tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMemberDetail();
  }, [id]);

  const handleApprove = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyetujui.");
      
      setSuccessMsg("Keanggotaan berhasil disetujui!");
      fetchMemberDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Apakah Anda yakin ingin menolak pendaftaran ini?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menolak.");
      
      setSuccessMsg("Pendaftaran berhasil ditolak.");
      fetchMemberDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setRenewing(true);
    try {
      const res = await fetch(`/api/members/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: renewType,
          customMonths: renewType === "CUSTOM" ? parseInt(customMonths, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperpanjang.");
      
      setSuccessMsg("Keanggotaan berhasil diperpanjang!");
      fetchMemberDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setRenewing(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus keanggotaan ${member.name} secara permanen? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus anggota.");

      setSuccessMsg("Keanggotaan berhasil dihapus secara permanen!");
      setTimeout(() => {
        router.push("/dashboard/anggota");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("userType", userType);
      
      if (userType === "STUDENT") formData.append("nim", nim);
      if (userType === "STAFF") formData.append("nip", nip);
      if (photoFile) formData.append("profilePicture", photoFile);

      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan.");

      setSuccessMsg("Profil berhasil diperbarui!");
      setEditing(false);
      fetchMemberDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard/anggota"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Anggota
        </Link>
      </div>

      {loading && !member ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#f5b731]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : errorMsg && !member ? (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      ) : member ? (
        <div className="space-y-8">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-500 rounded-2xl text-xs font-semibold">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Col: Digital Gym Card Rendering */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 flex flex-col items-center">
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400 mb-6 w-full text-left">
                  Kartu Gym Digital
                </h3>
                
                <div className="overflow-x-auto w-full flex justify-center pb-2">
                  <GymCard
                    name={member.name}
                    memberId={member.memberId}
                    userType={member.userType}
                    membershipType={member.membershipType}
                    validUntil={member.validUntil}
                    qrCode={member.qrCode}
                    profilePicture={member.profilePicture}
                    status={member.status}
                  />
                </div>

                <div className="mt-6 w-full max-w-[600px]">
                  <a
                    href={`/api/members/${member.id}/card`}
                    download
                    className="w-full py-3 px-5 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition font-sans disabled:cursor-wait disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Kartu PNG
                  </a>
                </div>
                
                {/* Pending Actions bar */}
                {member.status === "PENDING" && (
                  <div className="w-full mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm font-extrabold text-white">Menunggu Persetujuan Pembayaran</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                        Pengguna memilih tipe membership {member.membershipType === "DAILY" ? "HARIAN" : "BULANAN"}. Harap tagih pembayaran manual sebelum menyetujui.
                      </p>
                    </div>
                    
                    <div className="flex gap-2.5 font-bold text-xs">
                      <button
                        onClick={handleReject}
                        className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-500 border border-red-900/30 rounded-xl transition duration-150"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl transition duration-150"
                      >
                        Approve & Aktifkan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Check-in Logs for this user */}
              <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 space-y-4">
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">Riwayat Check-in</h3>
                
                {member.checkIns.length > 0 ? (
                  <div className="bg-[#1f1f1f] rounded-2xl overflow-hidden border border-[#2b2b2b]">
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="border-b border-[#2b2b2b] bg-[#1a1a1a] text-gray-400 uppercase tracking-wider">
                          <th className="p-4">Tanggal Kehadiran</th>
                          <th className="p-4">Jam Masuk</th>
                          <th className="p-4">Status Check-in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2b2b2b] text-white font-medium">
                        {member.checkIns.map((log) => {
                          const date = new Date(log.checkedAt);
                          return (
                            <tr key={log.id}>
                              <td className="p-4">
                                {date.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                              </td>
                              <td className="p-4 font-mono text-zinc-400">
                                {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
                              </td>
                              <td className="p-4 text-emerald-500">Berhasil</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-zinc-650 text-xs font-semibold py-8 text-center bg-[#1c1c1c]/30 rounded-2xl border border-dashed border-[#222]">
                    Belum ada riwayat kehadiran check-in.
                  </p>
                )}
              </div>
            </div>

            {/* Right Col: Details / Edit Panel & Renewal Panel */}
            <div className="space-y-6">
              {/* Profile Details or Edit Form */}
              <div className="bg-[#161616] border border-[#222] rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">
                    {editing ? "Edit Profil Anggota" : "Profil Anggota"}
                  </h3>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs font-bold text-[#f5b731] hover:underline"
                    >
                      Ubah Profil
                    </button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
                    {/* Editable profile picture preview */}
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative w-28 h-32 rounded-xl overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-zinc-800 text-white font-extrabold text-[10px] rounded-lg border border-zinc-700 hover:bg-zinc-700"
                      >
                        Pilih Foto Baru
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#f5b731]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider mb-2">Kategori Akses</label>
                      <select
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white focus:outline-none focus:border-[#f5b731] cursor-pointer"
                      >
                        <option value="STUDENT">Mahasiswa</option>
                        <option value="STAFF">Pegawai</option>
                        <option value="PUBLIC">Umum</option>
                      </select>
                    </div>

                    {userType === "STUDENT" && (
                      <div>
                        <label className="block text-gray-400 uppercase tracking-wider mb-2">NIM</label>
                        <input
                          type="text"
                          required
                          value={nim}
                          onChange={(e) => setNim(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731]"
                        />
                      </div>
                    )}

                    {userType === "STAFF" && (
                      <div>
                        <label className="block text-gray-400 uppercase tracking-wider mb-2">NIP</label>
                        <input
                          type="text"
                          required
                          value={nip}
                          onChange={(e) => setNip(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider mb-2">Nomor Telepon (WhatsApp)</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731]"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          // Reset edits
                          setName(member.name);
                          setPhone(member.phone);
                          setUserType(member.userType);
                          setPhotoPreview(member.profilePicture);
                        }}
                        className="w-1/2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 py-3 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold rounded-xl"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs font-semibold text-white">
                    <div className="flex justify-between border-b border-[#222] pb-3">
                      <span className="text-gray-400">Nomor Telepon</span>
                      <a href={`https://wa.me/${member.phone}`} target="_blank" rel="noreferrer" className="text-[#f5b731] hover:underline font-bold">
                        {member.phone}
                      </a>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-3">
                      <span className="text-gray-400">Tanggal Daftar</span>
                      <span className="font-medium text-zinc-400">{formatDate(member.createdAt as any)}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-3">
                      <span className="text-gray-400">Valid Mulai</span>
                      <span className="font-medium text-zinc-400">{formatDate(member.validFrom)}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-3">
                      <span className="text-gray-400">Valid Sampai</span>
                      <span className="font-medium text-zinc-400">{formatDate(member.validUntil)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status Database</span>
                      <span className="font-mono text-zinc-400">{member.status}</span>
                    </div>
                    {!editing && (
                      <div className="border-t border-[#222] pt-4 mt-4">
                        <button
                          onClick={handleDelete}
                          disabled={loading}
                          className="w-full py-3 bg-red-950/20 hover:bg-red-950/40 text-red-500 border border-red-900/30 rounded-xl transition duration-150 font-bold"
                        >
                          Hapus Anggota
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Renewal Panel */}
              {member.status === "APPROVED" && (
                <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 space-y-4">
                  <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">
                    Perpanjang Keanggotaan
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                    Perpanjang masa aktif keanggotaan mulai hari ini. Harap tagih biaya manual terlebih dahulu sesuai tarif kategori.
                  </p>

                  <div className="flex bg-[#1f1f1f] border border-[#2b2b2b] p-1 rounded-2xl font-bold text-xs">
                    <button
                      onClick={() => setRenewType("DAILY")}
                      className={`flex-1 py-2.5 text-center rounded-xl transition ${
                        renewType === "DAILY" ? "bg-[#f5b731] text-black" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Harian
                    </button>
                    <button
                      onClick={() => setRenewType("MONTHLY")}
                      className={`flex-1 py-2.5 text-center rounded-xl transition ${
                        renewType === "MONTHLY" ? "bg-[#f5b731] text-black" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Bulanan
                    </button>
                    <button
                      onClick={() => setRenewType("CUSTOM")}
                      className={`flex-1 py-2.5 text-center rounded-xl transition ${
                        renewType === "CUSTOM" ? "bg-[#f5b731] text-black" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Kustom
                    </button>
                  </div>

                  {renewType === "CUSTOM" && (
                    <div className="space-y-1.5">
                      <label className="block text-gray-400 uppercase tracking-wider text-[10px]">
                        Jumlah Bulan
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customMonths}
                        onChange={(e) => setCustomMonths(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731]"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleRenew}
                    disabled={renewing}
                    className="w-full py-4 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-xs rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-2"
                  >
                    {renewing ? (
                      <>
                        <svg className="animate-spin h-4.5 w-4.5 text-black" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      "Perpanjang & Konfirmasi Bayar"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
