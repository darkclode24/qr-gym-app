"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface GymCardProps {
  name: string;
  memberId: string;
  userType: string; // STUDENT | STAFF | PUBLIC
  membershipType: string; // DAILY | MONTHLY
  validUntil?: string | Date | null;
  qrCode: string; // UUID
  profilePicture: string;
  status?: string; // PENDING | APPROVED | REJECTED
  compact?: boolean;
}

export default function GymCard({
  name,
  memberId,
  userType,
  membershipType,
  validUntil,
  qrCode,
  profilePicture,
  status = "APPROVED",
  compact = false,
}: GymCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [qrCode]);

  const formatDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    const months = [
      "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
      "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getMembershipText = (type: string) => {
    return type === "DAILY" ? "HARIAN" : "BULANAN";
  };

  const getBadgeText = (type: string) => {
    if (type === "STUDENT") return "STUDENT";
    if (type === "STAFF") return "STAFF";
    return "PUBLIC";
  };

  return (
    <div className={`relative select-none ${compact ? "scale-90 origin-top" : ""}`}>
      {/* Card Wrapper */}
      <div
        id={`gym-card-${qrCode}`}
        className="w-[600px] h-[360px] rounded-3xl overflow-hidden relative shadow-2xl flex font-sans text-white border border-[#2d2d2d] bg-[#0c0d0e]"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Background Decorative Shapes */}
        <div className="absolute inset-0 bg-[#0c0d0e]"></div>

        {/* Diagonal Yellow Section on Right */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[42%] bg-[#f5b731]"
          style={{
            clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        >
          {/* Subtle yellow pattern/diamonds (reproducing card.png background) */}
          <div className="absolute inset-0 opacity-15 flex flex-wrap content-around justify-around p-8 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 border border-black rotate-45 transform"
              ></div>
            ))}
          </div>
        </div>

        {/* Diagonal Gold/Black stripe separator */}
        <div
          className="absolute right-[41.5%] top-0 bottom-0 w-[1.5%] bg-black opacity-40"
          style={{
            clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>
        <div
          className="absolute right-[42%] top-0 bottom-0 w-[2%] bg-[#f5b731] opacity-70"
          style={{
            clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>

        {/* LEFT SIDE CONTENT: Black Background */}
        <div className="absolute left-0 top-0 bottom-0 w-[58%] p-7 flex flex-col justify-between z-10">
          {/* Header Branding */}
          <div className="flex items-center gap-3">
            {/* Unsri Logo SVG representation */}
            <div className="w-12 h-12 rounded-full bg-[#f5b731] p-1 flex items-center justify-center relative overflow-hidden border border-yellow-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="w-full h-full text-black fill-current"
              >
                {/* Outer concentric shapes simulating UNSRI flower logo */}
                <path d="M 50,5 A 45,45 0 0,0 12,28 L 50,50 Z" opacity="0.8" />
                <path d="M 12,28 A 45,45 0 0,0 12,72 L 50,50 Z" />
                <path d="M 12,72 A 45,45 0 0,0 50,95 L 50,50 Z" opacity="0.8" />
                <path d="M 50,95 A 45,45 0 0,0 88,72 L 50,50 Z" />
                <path d="M 88,72 A 45,45 0 0,0 88,28 L 50,50 Z" opacity="0.8" />
                <path d="M 88,28 A 45,45 0 0,0 50,5 L 50,50 Z" />
                
                {/* Inner emblem */}
                <circle cx="50" cy="50" r="28" fill="#f5b731" stroke="black" strokeWidth="3" />
                {/* Dumbbell/Barbell inside logo */}
                <rect x="35" y="47" width="30" height="6" rx="2" fill="black" />
                <rect x="30" y="40" width="6" height="20" rx="2" fill="black" />
                <rect x="64" y="40" width="6" height="20" rx="2" fill="black" />
                <circle cx="50" cy="50" r="14" fill="none" stroke="black" strokeWidth="2" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] tracking-[0.2em] text-gray-400 font-bold leading-none">
                UNIVERSITAS SRIWIJAYA
              </span>
              <span className="text-sm font-extrabold tracking-[0.05em] text-[#f5b731] mt-0.5 leading-none">
                FITNESS CENTER
              </span>
            </div>
          </div>

          {/* Profile Photo Area */}
          <div className="flex gap-4 items-end mt-2">
            <div className="w-24 h-28 bg-[#2d2d2d] rounded-2xl overflow-hidden border-2 border-gray-600 relative flex items-center justify-center shadow-lg">
              {profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0 1 12.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                </svg>
              )}
            </div>

            {/* Member Details */}
            <div className="flex flex-col pb-1">
              <span className="text-[9px] tracking-wider text-gray-400 font-semibold">
                MEMBER NAME
              </span>
              <h2 className="text-xl font-black tracking-wide text-white uppercase truncate max-w-[210px]">
                {name || "NAMA LENGKAP"}
              </h2>
              <div className="w-12 h-[2px] bg-[#f5b731] my-1"></div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex justify-between items-end border-t border-[#1a1c1e] pt-3 mt-1">
            <div>
              <span className="text-[8px] tracking-wider text-gray-400 block leading-tight font-semibold">
                MEMBERSHIP
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {getMembershipText(membershipType)}
              </span>
            </div>
            <div>
              <span className="text-[8px] tracking-wider text-gray-400 block leading-tight font-semibold">
                VALID UNTIL
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {formatDate(validUntil)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 font-bold block">
                ID: {memberId || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE CONTENT: Yellow Background */}
        <div className="absolute right-0 top-0 bottom-0 w-[42%] flex flex-col items-center justify-center p-7 z-10">
          <span className="text-[8px] tracking-[0.2em] font-black text-black mb-1.5">
            QR CODE
          </span>

          {/* QR Code Container */}
          <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center w-36 h-36 border border-yellow-600">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Gym QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg"></div>
            )}
          </div>

          {/* Access Type Badge */}
          <div className="mt-4 bg-[#0c0d0e] px-7 py-2 rounded-xl border border-yellow-500/20 shadow-md">
            <span className="text-xs font-black tracking-[0.2em] text-[#f5b731]">
              {getBadgeText(userType)}
            </span>
          </div>
        </div>

        {/* Pending Watermark Overlay */}
        {status === "PENDING" && (
          <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <div className="border-4 border-[#f5b731] text-[#f5b731] font-black text-2xl tracking-[0.25em] px-6 py-3 rounded-2xl rotate-[-8deg] shadow-2xl animate-pulse">
              PENDING
            </div>
            <p className="text-xs text-gray-400 mt-4 tracking-wide font-medium">
              Menunggu Persetujuan Resepsionis
            </p>
          </div>
        )}

        {/* Rejected Watermark Overlay */}
        {status === "REJECTED" && (
          <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <div className="border-4 border-red-500 text-red-500 font-black text-2xl tracking-[0.25em] px-6 py-3 rounded-2xl rotate-[-8deg] shadow-2xl">
              REJECTED
            </div>
            <p className="text-xs text-gray-400 mt-4 tracking-wide font-medium">
              Pendaftaran Ditolak
            </p>
          </div>
        )}

        {/* Expired Watermark Overlay */}
        {status === "APPROVED" && validUntil && new Date(validUntil) < new Date() && (
          <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <div className="border-4 border-red-500 text-red-500 font-black text-2xl tracking-[0.25em] px-6 py-3 rounded-2xl rotate-[-8deg] shadow-2xl">
              EXPIRED
            </div>
            <p className="text-xs text-gray-400 mt-4 tracking-wide font-medium">
              Keanggotaan Telah Habis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
