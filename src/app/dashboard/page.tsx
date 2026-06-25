"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  checkInsToday: number;
  expiringSoon: number;
}

interface RecentCheckIn {
  id: string;
  checkedAt: string;
  member: {
    name: string;
    memberId: string;
    userType: string;
    profilePicture: string;
  };
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, checkInsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/checkin/recent?limit=5"),
      ]);

      const statsData = await statsRes.json();
      const checkInsData = await checkInsRes.json();

      if (statsRes.ok) setStats(statsData.stats);
      if (checkInsRes.ok) setRecentCheckIns(checkInsData.checkIns || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  };

  const getBadgeText = (type: string) => {
    if (type === "STUDENT") return "STUDENT";
    if (type === "STAFF") return "STAFF";
    return "PUBLIC";
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Ringkasan Ring</h2>
          <p className="text-xs text-gray-400 mt-1">Selamat datang kembali! Berikut status aktivitas gym hari ini.</p>
        </div>

        <Link
          href="/dashboard/scan"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-xs rounded-2xl transition duration-200 shadow-lg shadow-[#f5b731]/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h2M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
          </svg>
          Mulai Scan Check-in
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#f5b731]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Anggota"
              value={stats?.totalMembers || 0}
              description="Jumlah pendaftar terdaftar"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <Link href="/dashboard/anggota">
              <StatsCard
                title="Anggota Aktif"
                value={stats?.activeMembers || 0}
                description="Masa berlaku kartu aktif"
                iconBgColor="bg-emerald-500/10"
                icon={
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </Link>
            <StatsCard
              title="Check-in Hari Ini"
              value={stats?.checkInsToday || 0}
              description="Anggota datang berlatih hari ini"
              iconBgColor="bg-emerald-500/10"
              icon={
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Segera Berakhir"
              value={stats?.expiringSoon || 0}
              description="Keanggotaan habis dalam 7 hari"
              iconBgColor="bg-red-500/10"
              icon={
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions Panel */}
            <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">Aksi Cepat</h3>
              <div className="grid grid-cols-1 gap-3 font-semibold text-sm">
                <Link
                  href="/dashboard/scan"
                  className="flex items-center gap-3 p-4 bg-[#1f1f1f] border border-[#2b2b2b] rounded-2xl hover:border-[#f5b731]/40 transition text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f5b731]/10 text-[#f5b731] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h2M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                    </svg>
                  </div>
                  <span>Scan Check-in Pengunjung</span>
                </Link>
                <Link
                  href="/dashboard/daftar-baru"
                  className="flex items-center gap-3 p-4 bg-[#1f1f1f] border border-[#2b2b2b] rounded-2xl hover:border-[#f5b731]/40 transition text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f5b731]/10 text-[#f5b731] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span>Daftarkan Anggota Baru</span>
                </Link>
                <Link
                  href="/dashboard/anggota"
                  className="flex items-center gap-3 p-4 bg-[#1f1f1f] border border-[#2b2b2b] rounded-2xl hover:border-emerald-500/40 transition text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span>Kelola Daftar Anggota</span>
                </Link>
              </div>
            </div>

            {/* Recent Check-ins Panel */}
            <div className="bg-[#161616] border border-[#222] rounded-3xl p-6 lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-gray-400">Kehadiran Terbaru</h3>
                <Link href="/dashboard/riwayat" className="text-xs text-[#f5b731] hover:underline font-bold">
                  Lihat Semua
                </Link>
              </div>

              <div className="space-y-3">
                {recentCheckIns.length > 0 ? (
                  recentCheckIns.map((ci) => (
                    <div
                      key={ci.id}
                      className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#262626] rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-11 bg-zinc-800 rounded-lg overflow-hidden relative border border-zinc-700 shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ci.member.profilePicture} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white uppercase leading-snug">{ci.member.name}</h4>
                          <span className="text-[10px] text-gray-500 font-bold block">ID: {ci.member.memberId}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#f5b731] block">
                          {formatTime(ci.checkedAt)}
                        </span>
                        <span className="text-[9px] font-extrabold text-zinc-500 tracking-wider">
                          {getBadgeText(ci.member.userType)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-650 text-center py-12 text-xs font-semibold">Belum ada check-in hari ini.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
