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

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        status: "REJECTED",
      },
    });

    return NextResponse.json({
      message: "Pendaftaran anggota berhasil ditolak.",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Error rejecting member:", error);
    return NextResponse.json(
      { error: "Gagal menolak pendaftaran anggota." },
      { status: 500 }
    );
  }
});
