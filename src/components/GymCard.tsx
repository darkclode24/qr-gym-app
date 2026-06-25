"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import cardTemplate from "../../asset/card.png";

interface GymCardProps {
  name: string;
  memberId: string;
  userType: string;
  membershipType: string;
  validUntil?: string | Date | null;
  qrCode: string;
  profilePicture: string;
  status?: string;
  compact?: boolean;
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
];

function formatDate(dateValue?: string | Date | null) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getMembershipText(type: string) {
  return type === "DAILY" ? "HARIAN" : "BULANAN";
}

function getBadgeText(type: string) {
  if (type === "STUDENT") return "STUDENT";
  if (type === "STAFF") return "STAFF";
  return "PUBLIC";
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
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    if (!qrCode) return;

    QRCode.toDataURL(qrCode, {
      margin: 1,
      width: 600,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch((error) => console.error("Error generating QR code:", error));
  }, [qrCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const displayName = (name || "NAMA LENGKAP").toUpperCase().slice(0, 30);
  const nameFontSize =
    displayName.length <= 12
      ? 42
      : displayName.length <= 18
        ? 34
        : displayName.length <= 24
          ? 29
          : 25;
  const expired =
    status === "APPROVED" &&
    Boolean(validUntil) &&
    currentTime !== null &&
    new Date(validUntil as string | Date).getTime() < currentTime;
  const overlayLabel =
    status === "PENDING"
      ? "PENDING"
      : status === "REJECTED"
        ? "REJECTED"
        : expired
          ? "EXPIRED"
          : null;
  const overlayColor = overlayLabel === "PENDING" ? "#f5b731" : "#ef4444";
  const overlayDetail =
    overlayLabel === "PENDING"
      ? "Menunggu Persetujuan Resepsionis"
      : overlayLabel === "REJECTED"
        ? "Pendaftaran Ditolak"
        : "Keanggotaan Telah Habis";

  return (
    <div
      className={`relative select-none ${
        compact ? "scale-90 origin-top" : ""
      }`}
    >
      <div
        id={`gym-card-${qrCode}`}
        className="relative w-[600px] overflow-hidden rounded-[20px] shadow-2xl"
        style={{
          aspectRatio: "1001 / 631",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <svg
          aria-label={`Kartu gym digital ${displayName}`}
          className="block h-full w-full"
          role="img"
          viewBox="0 0 1001 631"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id={`card-clip-${qrCode}`}>
              <rect width="1001" height="631" rx="32" />
            </clipPath>
            <clipPath id={`photo-clip-${qrCode}`}>
              <rect x="62" y="189" width="156" height="155" rx="20" />
            </clipPath>
          </defs>

          <g
            clipPath={`url(#card-clip-${qrCode})`}
            fontFamily="var(--font-outfit), var(--font-inter), Arial, sans-serif"
          >
            <image
              href={cardTemplate.src}
              x="-14"
              y="-7"
              width="1319"
              height="853"
            />

            {profilePicture && (
              <image
                href={profilePicture}
                x="62"
                y="189"
                width="156"
                height="155"
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#photo-clip-${qrCode})`}
              />
            )}

            <rect x="49" y="405" width="405" height="54" fill="#0d0f10" />
            <text
              x="50"
              y="447"
              fill="#fff"
              fontSize={nameFontSize}
              fontWeight="900"
              letterSpacing="1"
            >
              {displayName}
            </text>

            <rect x="49" y="522" width="260" height="43" fill="#0d0f10" />
            <text x="50" y="552" fill="#fff" fontSize="27" fontWeight="700">
              {getMembershipText(membershipType)}
            </text>

            <rect x="360" y="522" width="169" height="43" fill="#0d0f10" />
            <path d="M482 522H513L504 565H473Z" fill="#e4c333" />
            <path d="M513 522H524L515 565H504Z" fill="#0d0f10" />
            <path d="M524 522H529V565H515Z" fill="#ffc30b" />
            <text x="361" y="552" fill="#fff" fontSize="21" fontWeight="700">
              {formatDate(validUntil)}
            </text>

            <rect x="49" y="582" width="345" height="37" fill="#0d0f10" />
            <text
              x="50"
              y="607"
              fill="#b9bac0"
              fontSize="22"
              fontWeight="500"
              letterSpacing="1"
            >
              ID&nbsp;&nbsp;{memberId || "-"}
            </text>

            <rect x="733" y="229" width="184" height="184" fill="#fff" />
            {qrDataUrl && (
              <image
                href={qrDataUrl}
                x="733"
                y="229"
                width="184"
                height="184"
              />
            )}

            <rect
              x="705"
              y="488"
              width="239"
              height="62"
              rx="18"
              fill="#0d0f10"
            />
            <text
              x="824.5"
              y="531"
              textAnchor="middle"
              fill="#ffc30b"
              fontSize="30"
              fontWeight="900"
              letterSpacing="2"
            >
              {getBadgeText(userType)}
            </text>

            {overlayLabel && (
              <>
                <rect
                  width="1001"
                  height="631"
                  rx="32"
                  fill="#000"
                  opacity="0.78"
                />
                <g transform="translate(500.5 315.5) rotate(-8)">
                  <rect
                    x="-175"
                    y="-52"
                    width="350"
                    height="104"
                    rx="18"
                    fill="none"
                    stroke={overlayColor}
                    strokeWidth="7"
                  />
                  <text
                    x="0"
                    y="15"
                    textAnchor="middle"
                    fill={overlayColor}
                    fontSize="40"
                    fontWeight="900"
                    letterSpacing="8"
                  >
                    {overlayLabel}
                  </text>
                </g>
                <text
                  x="500.5"
                  y="414"
                  textAnchor="middle"
                  fill="#d4d4d8"
                  fontSize="20"
                  fontWeight="700"
                >
                  {overlayDetail}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
