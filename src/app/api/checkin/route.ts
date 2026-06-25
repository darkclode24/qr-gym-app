import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const userType = searchParams.get("userType") || "ALL";
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "50";

    const page = parseInt(pageParam, 10);
    const limit = parseInt(limitParam, 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    const memberConditions: any = {};

    if (userType !== "ALL") {
      memberConditions.userType = userType;
    }
    if (search.trim()) {
      const query = search.trim();
      memberConditions.OR = [
        { name: { contains: query } },
        { memberId: { contains: query } },
      ];
    }

    if (Object.keys(memberConditions).length > 0) {
      where.member = memberConditions;
    }

    const [total, checkIns] = await prisma.$transaction([
      prisma.checkIn.count({ where }),
      prisma.checkIn.findMany({
        where,
        orderBy: {
          checkedAt: "desc",
        },
        skip,
        take: limit,
        include: {
          member: {
            select: {
              name: true,
              memberId: true,
              userType: true,
              profilePicture: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      checkIns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching check-in logs:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat check-in." },
      { status: 500 }
    );
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id } = body; // Member database ID

    if (!id) {
      return NextResponse.json(
        { error: "ID Anggota wajib disediakan." },
        { status: 400 }
      );
    }

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

    if (member.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Check-in ditolak: Anggota belum disetujui atau telah ditolak." },
        { status: 400 }
      );
    }

    const isExpired =
      member.validUntil && new Date(member.validUntil) < now;

    if (isExpired) {
      return NextResponse.json(
        { error: "Check-in ditolak: Masa aktif keanggotaan telah habis." },
        { status: 400 }
      );
    }

    // Record check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        memberId: member.id,
      },
    });

    return NextResponse.json({
      message: `Check-in berhasil untuk ${member.name}.`,
      checkIn,
    });
  } catch (error) {
    console.error("Error confirming checkin:", error);
    return NextResponse.json(
      { error: "Gagal mencatat check-in." },
      { status: 500 }
    );
  }
});

