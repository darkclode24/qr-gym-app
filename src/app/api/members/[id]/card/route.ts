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

const CARD_TEMPLATE = {
  left: 14,
  top: 7,
  width: 1001,
  height: 631,
} as const;

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

let cardTemplatePromise: Promise<Buffer> | null = null;

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

function loadCardTemplate() {
  cardTemplatePromise ??= readFile(
    path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "asset",
      "card.png",
    ),
  ).then((file) =>
    sharp(file)
      .extract(CARD_TEMPLATE)
      .png()
      .toBuffer(),
  );

  return cardTemplatePromise;
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
    <rect width="${CARD_TEMPLATE.width}" height="${CARD_TEMPLATE.height}" rx="32" fill="#000" opacity="0.78"/>
    <g transform="translate(500.5 315.5) rotate(-8)">
      <rect x="-175" y="-52" width="350" height="104" rx="18" fill="none" stroke="${color}" stroke-width="7"/>
      <text x="0" y="15" text-anchor="middle" fill="${color}" font-size="40" font-weight="900" letter-spacing="8">${label}</text>
    </g>
    <text x="500.5" y="414" text-anchor="middle" fill="#d4d4d8" font-size="20" font-weight="700">${detail}</text>
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

  const [cardTemplate, qrDataUrl, profileDataUrl] = await Promise.all([
    loadCardTemplate(),
    QRCode.toDataURL(member.qrCode, {
      color: { dark: "#000000", light: "#ffffff" },
      margin: 1,
      width: 600,
    }),
    loadProfileDataUrl(member.profilePicture),
  ]);

  const rawDisplayName = member.name.toUpperCase().slice(0, 30);
  const displayName = escapeXml(rawDisplayName);
  const nameFontSize =
    rawDisplayName.length <= 12
      ? 42
      : rawDisplayName.length <= 18
        ? 34
        : rawDisplayName.length <= 24
          ? 29
          : 25;
  const memberId = escapeXml(member.memberId);
  const membership = member.membershipType === "DAILY" ? "HARIAN" : "BULANAN";
  const userType = escapeXml(member.userType);
  const profile = profileDataUrl
    ? `<image href="${profileDataUrl}" x="62" y="189" width="156" height="155" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)"/>`
    : "";

  const overlay = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_TEMPLATE.width}" height="${CARD_TEMPLATE.height}" viewBox="0 0 ${CARD_TEMPLATE.width} ${CARD_TEMPLATE.height}">
      <defs>
        <clipPath id="photo-clip"><rect x="62" y="189" width="156" height="155" rx="20"/></clipPath>
      </defs>
      <g font-family="DejaVu Sans, Arial, sans-serif">
        ${profile}

        <rect x="49" y="405" width="405" height="54" fill="#0d0f10"/>
        <text x="50" y="447" fill="#fff" font-size="${nameFontSize}" font-weight="900" letter-spacing="1">${displayName}</text>

        <rect x="49" y="522" width="260" height="43" fill="#0d0f10"/>
        <text x="50" y="552" fill="#fff" font-size="27" font-weight="700">${membership}</text>

        <rect x="360" y="522" width="169" height="43" fill="#0d0f10"/>
        <path d="M482 522H513L504 565H473Z" fill="#e4c333"/>
        <path d="M513 522H524L515 565H504Z" fill="#0d0f10"/>
        <path d="M524 522H529V565H515Z" fill="#ffc30b"/>
        <text x="361" y="552" fill="#fff" font-size="21" font-weight="700">${formatDate(member.validUntil)}</text>

        <rect x="49" y="582" width="345" height="37" fill="#0d0f10"/>
        <text x="50" y="607" fill="#b9bac0" font-size="22" font-weight="500" letter-spacing="1">ID  ${memberId}</text>

        <rect x="733" y="229" width="184" height="184" fill="#fff"/>
        <image href="${qrDataUrl}" x="733" y="229" width="184" height="184"/>

        <rect x="705" y="488" width="239" height="62" rx="18" fill="#0d0f10"/>
        <text x="824.5" y="531" text-anchor="middle" fill="#ffc30b" font-size="30" font-weight="900" letter-spacing="2">${userType}</text>

        ${statusOverlay(member.status, member.validUntil)}
      </g>
    </svg>
  `;

  const png = await sharp(cardTemplate)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
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
