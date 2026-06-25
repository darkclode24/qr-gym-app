"use client";

import React, { useEffect, useState } from "react";

interface CheckInLog {
  id: string;
  checkedAt: string;
  member: {
    name: string;
    memberId: string;
    userType: string;
    profilePicture: string;
  };
}

export default function RiwayatPage() {
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userType, setUserType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 on userType change
  useEffect(() => {
    setPage(1);
  }, [userType]);

  // Fetch check-in logs when filters or page changes
  useEffect(() => {
    const fetchCheckInLogs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search: debouncedSearch,
          userType,
          page: page.toString(),
          limit: "50",
        });
        const res = await fetch(`/api/checkin?${params.toString()}`);
        const data = await res.json();
        
        if (res.ok) {
          setLogs(data.checkIns || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error("Error loading check-in logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckInLogs();
  }, [page, userType, debouncedSearch]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " WIB";
  };

  const getBadgeText = (type: string) => {
    if (type === "STUDENT") return "STUDENT";
    if (type === "STAFF") return "STAFF";
    return "PUBLIC";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Riwayat Kehadiran</h2>
        <p className="text-xs text-gray-400 mt-1">Daftar lengkap log kehadiran check-in harian di gym.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari nama atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#f5b731]"
          />
          <svg
            className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto font-bold text-xs">
          <span className="text-gray-500 whitespace-nowrap">Kategori:</span>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5b731] cursor-pointer"
          >
            <option value="ALL">Semua</option>
            <option value="STUDENT">Mahasiswa</option>
            <option value="STAFF">Pegawai</option>
            <option value="PUBLIC">Umum</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#f5b731]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-[#161616] border border-[#222] rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-[#222] bg-[#1a1a1a] text-gray-400 uppercase tracking-wider">
                  <th className="p-5">Foto</th>
                  <th className="p-5">Nama Anggota</th>
                  <th className="p-5">ID Anggota</th>
                  <th className="p-5">Kategori</th>
                  <th className="p-5">Tanggal Hadir</th>
                  <th className="p-5">Jam Masuk</th>
                  <th className="p-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222] text-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a1a1a]/55 transition">
                    <td className="p-5">
                      <div className="w-10 h-12 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden relative shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={log.member.profilePicture} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-5 uppercase font-extrabold">{log.member.name}</td>
                    <td className="p-5 font-mono text-zinc-400">{log.member.memberId}</td>
                    <td className="p-5">
                      <span className="text-[10px] font-black tracking-widest text-[#f5b731] bg-[#f5b731]/10 px-2.5 py-1 rounded-md border border-[#f5b731]/10">
                        {getBadgeText(log.member.userType)}
                      </span>
                    </td>
                    <td className="p-5 font-medium text-zinc-300">{formatDate(log.checkedAt)}</td>
                    <td className="p-5 font-mono text-[#f5b731]">{formatTime(log.checkedAt)}</td>
                    <td className="p-5 text-center">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-extrabold rounded-lg">
                        SUKSES
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#161616]/40 border-2 border-dashed border-[#222] rounded-3xl h-[280px] flex flex-col items-center justify-center text-center p-6">
          <p className="text-zinc-650 text-xs font-semibold">Belum ada riwayat check-in yang tercatat.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-[#161616] border border-[#222] rounded-2xl p-4 text-xs font-semibold text-white mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition font-bold"
          >
            Sebelumnya
          </button>
          <span className="text-gray-400">
            Halaman {page} dari {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition font-bold"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
