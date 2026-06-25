import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const POST = auth(async (req, ctx) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await (ctx as RouteParams).params;
    const body = await req.json().catch(() => ({}));
    const newMembershipType = body.membershipType; // Optional, DAILY | MONTHLY

    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    const membershipType = newMembershipType === "CUSTOM"
      ? "MONTHLY"
      : (newMembershipType || member.membershipType);
    const now = new Date();
    let validUntil = new Date(now);

    if (newMembershipType === "CUSTOM") {
      const customMonths = parseInt(body.customMonths, 10);
      if (isNaN(customMonths) || customMonths <= 0) {
        return NextResponse.json(
          { error: "Jumlah bulan kustom harus berupa angka lebih dari 0." },
          { status: 400 }
        );
      }
      validUntil.setDate(validUntil.getDate() + (customMonths * 30));
    } else if (membershipType === "DAILY") {
      validUntil.setDate(validUntil.getDate() + 1);
    } else {
      validUntil.setDate(validUntil.getDate() + 30);
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        membershipType,
        status: "APPROVED",
        validFrom: now,
        validUntil: validUntil,
      },
    });

    return NextResponse.json({
      message: "Keanggotaan berhasil diperpanjang.",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Error renewing membership:", error);
    return NextResponse.json(
      { error: "Gagal memperpanjang keanggotaan." },
      { status: 500 }
    );
  }
});
