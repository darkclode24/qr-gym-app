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

    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    const now = new Date();
    let validUntil = new Date(now);

    if (member.membershipType === "DAILY") {
      // 1 calendar day (24 hours from approval)
      validUntil.setDate(validUntil.getDate() + 1);
    } else {
      // 30 calendar days from approval
      validUntil.setDate(validUntil.getDate() + 30);
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        status: "APPROVED",
        validFrom: now,
        validUntil: validUntil,
      },
    });

    return NextResponse.json({
      message: "Pendaftaran anggota berhasil disetujui.",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Error approving member:", error);
    return NextResponse.json(
      { error: "Gagal menyetujui pendaftaran anggota." },
      { status: 500 }
    );
  }
});
