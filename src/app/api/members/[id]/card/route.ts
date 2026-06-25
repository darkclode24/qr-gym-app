import { readFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

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

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function formatDate(value: Date | null) {
  if (!value) return "-";
  return `${value.getDate()} ${MONTHS[value.getMonth()]} ${value.getFullYear()}`;
}

function imageMimeType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

async function loadProfileDataUrl(profilePicture: string) {
  if (!profilePicture.startsWith("/uploads/")) return null;

  const fileName = path.basename(profilePicture);
  const candidates = [
    path.join(process.cwd(), "uploads", fileName),
    path.join(process.cwd(), "public", "uploads", fileName),
  ];

  for (const filePath of candidates) {
    try {
      const file = await readFile(filePath);
      return `data:${imageMimeType(fileName)};base64,${file.toString("base64")}`;
    } catch {
      // Try the next supported upload location.
    }
  }

  return null;
}

function statusOverlay(status: string, validUntil: Date | null) {
  const expired =
    status === "APPROVED" && validUntil && validUntil.getTime() < Date.now();
  const label =
    status === "PENDING"
      ? "PENDING"
      : status === "REJECTED"
        ? "REJECTED"
        : expired
          ? "EXPIRED"
          : null;

  if (!label) return "";

  const color = label === "PENDING" ? "#f5b731" : "#ef4444";
  const detail =
    label === "PENDING"
      ? "Menunggu Persetujuan Resepsionis"
      : label === "REJECTED"
        ? "Pendaftaran Ditolak"
        : "Keanggotaan Telah Habis";

  return `
    <rect width="600" height="360" rx="24" fill="#000" opacity="0.78"/>
    <g transform="translate(300 180) rotate(-8)">
      <rect x="-105" y="-31" width="210" height="62" rx="12" fill="none" stroke="${color}" stroke-width="4"/>
      <text x="0" y="9" text-anchor="middle" fill="${color}" font-size="24" font-weight="900" letter-spacing="5">${label}</text>
    </g>
    <text x="300" y="239" text-anchor="middle" fill="#a1a1aa" font-size="12">${detail}</text>
  `;
}

export const GET = auth(async (req, ctx) => {
  if (!req.auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await (ctx as RouteParams).params;
  const member = await prisma.member.findUnique({ where: { id } });

  if (!member) {
    return Response.json(
      { error: "Anggota tidak ditemukan." },
      { status: 404 },
    );
  }

  const [qrDataUrl, profileDataUrl] = await Promise.all([
    QRCode.toDataURL(member.qrCode, {
      color: { dark: "#000000", light: "#ffffff" },
      margin: 1,
      width: 300,
    }),
    loadProfileDataUrl(member.profilePicture),
  ]);

  const displayName = escapeXml(member.name.toUpperCase().slice(0, 25));
  const memberId = escapeXml(member.memberId);
  const membership = member.membershipType === "DAILY" ? "HARIAN" : "BULANAN";
  const userType = escapeXml(member.userType);
  const profile = profileDataUrl
    ? `<image href="${profileDataUrl}" x="28" y="146" width="96" height="112" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)"/>`
    : `
      <rect x="28" y="146" width="96" height="112" rx="16" fill="#2d2d2d"/>
      <circle cx="76" cy="184" r="22" fill="#71717a"/>
      <path d="M42 246c5-25 20-37 34-37s29 12 34 37" fill="#71717a"/>
    `;

  const pattern = Array.from({ length: 12 }, (_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    return `<rect x="${397 + column * 64}" y="${42 + row * 82}" width="25" height="25" fill="none" stroke="#111" opacity="0.16" transform="rotate(45 ${409 + column * 64} ${54 + row * 82})"/>`;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
      <defs>
        <clipPath id="card-clip"><rect width="600" height="360" rx="24"/></clipPath>
        <clipPath id="photo-clip"><rect x="28" y="146" width="96" height="112" rx="16"/></clipPath>
      </defs>
      <g clip-path="url(#card-clip)" font-family="Arial, Helvetica, sans-serif">
        <rect width="600" height="360" fill="#0c0d0e"/>
        <path d="M370 0H600V360H345Z" fill="#f5b731"/>
        <path d="M361 0H374L349 360H336Z" fill="#f5b731" opacity="0.7"/>
        <path d="M371 0H380L355 360H346Z" fill="#000" opacity="0.35"/>
        ${pattern}

        <circle cx="52" cy="52" r="24" fill="#f5b731" stroke="#fde68a"/>
        <path d="M35 49h34v6H35zM30 42h6v20h-6zM68 42h6v20h-6z" fill="#111"/>
        <circle cx="52" cy="52" r="12" fill="none" stroke="#111" stroke-width="2"/>
        <text x="90" y="47" fill="#9ca3af" font-size="10" font-weight="700" letter-spacing="2">UNIVERSITAS SRIWIJAYA</text>
        <text x="90" y="66" fill="#f5b731" font-size="15" font-weight="900" letter-spacing="1">FITNESS CENTER</text>

        <rect x="26" y="144" width="100" height="116" rx="18" fill="#2d2d2d" stroke="#52525b" stroke-width="2"/>
        ${profile}
        <text x="142" y="190" fill="#9ca3af" font-size="9" font-weight="700" letter-spacing="1">MEMBER NAME</text>
        <text x="142" y="217" fill="#fff" font-size="20" font-weight="900">${displayName}</text>
        <rect x="142" y="229" width="48" height="2" fill="#f5b731"/>

        <line x1="28" y1="288" x2="335" y2="288" stroke="#27272a"/>
        <text x="28" y="307" fill="#9ca3af" font-size="8" font-weight="700" letter-spacing="1">MEMBERSHIP</text>
        <text x="28" y="326" fill="#fff" font-size="12" font-weight="700">${membership}</text>
        <text x="132" y="307" fill="#9ca3af" font-size="8" font-weight="700" letter-spacing="1">VALID UNTIL</text>
        <text x="132" y="326" fill="#fff" font-size="12" font-weight="700">${formatDate(member.validUntil)}</text>
        <text x="335" y="326" text-anchor="end" fill="#9ca3af" font-size="10" font-weight="700">ID: ${memberId}</text>

        <text x="485" y="72" text-anchor="middle" fill="#111" font-size="8" font-weight="900" letter-spacing="2">QR CODE</text>
        <rect x="411" y="82" width="148" height="148" rx="16" fill="#fff" stroke="#ca8a04"/>
        <image href="${qrDataUrl}" x="419" y="90" width="132" height="132"/>
        <rect x="424" y="251" width="122" height="42" rx="12" fill="#0c0d0e"/>
        <text x="485" y="277" text-anchor="middle" fill="#f5b731" font-size="12" font-weight="900" letter-spacing="2">${userType}</text>

        ${statusOverlay(member.status, member.validUntil)}
      </g>
      <rect x="0.5" y="0.5" width="599" height="359" rx="23.5" fill="none" stroke="#2d2d2d"/>
    </svg>
  `;

  const png = await sharp(Buffer.from(svg))
    .resize(1200, 720)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const safeName =
    member.name.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "Member";

  return new Response(new Uint8Array(png), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="GymCard-${safeName}.png"`,
      "Content-Length": String(png.length),
      "Content-Type": "image/png",
    },
  });
});
