import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { qrCode, memberId } = body;

    if (!qrCode && !memberId) {
      return NextResponse.json(
        { error: "QR Code atau ID Anggota wajib disediakan." },
        { status: 400 }
      );
    }

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          qrCode ? { qrCode } : undefined,
          memberId ? { memberId } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    const now = new Date();
    
    if (member.status === "PENDING") {
      return NextResponse.json({
        allowed: false,
        reason: "PENDING_APPROVAL",
        message: "Pendaftaran belum disetujui oleh resepsionis.",
        member,
      });
    }

    if (member.status === "REJECTED") {
      return NextResponse.json({
        allowed: false,
        reason: "REJECTED",
        message: "Pendaftaran ditolak oleh resepsionis.",
        member,
      });
    }

    const isExpired =
      member.validUntil && new Date(member.validUntil) < now;

    if (isExpired) {
      return NextResponse.json({
        allowed: false,
        reason: "EXPIRED",
        message: "Masa aktif keanggotaan telah habis.",
        member: {
          ...member,
          isExpired: true,
        },
      });
    }

    return NextResponse.json({
      allowed: true,
      message: "Verifikasi berhasil. Silakan konfirmasi check-in.",
      member: {
        ...member,
        isExpired: false,
      },
    });
  } catch (error) {
    console.error("Error in checkin verify:", error);
    return NextResponse.json(
      { error: "Gagal melakukan verifikasi check-in." },
      { status: 500 }
    );
  }
});
