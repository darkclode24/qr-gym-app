import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: "Parameter limit tidak valid." },
        { status: 400 }
      );
    }

    const checkIns = await prisma.checkIn.findMany({
      take: limit,
      orderBy: {
        checkedAt: "desc",
      },
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            name: true,
            userType: true,
            profilePicture: true,
          },
        },
      },
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error("Error fetching recent check-ins:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data check-in terbaru." },
      { status: 500 }
    );
  }
});
