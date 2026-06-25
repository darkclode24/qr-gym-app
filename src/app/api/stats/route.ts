import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // End of today
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Expiring soon threshold (+7 days)
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // 1. Total members (active or approved, actually all records in database)
    const totalMembers = await prisma.member.count();

    // 2. Active members (approved and not expired yet)
    const activeMembers = await prisma.member.count({
      where: {
        status: "APPROVED",
        OR: [
          { validUntil: { gte: now } },
          { validUntil: null },
        ],
      },
    });

    // 3. Check-ins today
    const checkInsToday = await prisma.checkIn.count({
      where: {
        checkedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 4. Expiring soon (approved, not expired yet, but expiring in next 7 days)
    const expiringSoon = await prisma.member.count({
      where: {
        status: "APPROVED",
        validUntil: {
          gt: now,
          lte: sevenDaysLater,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers,
        checkInsToday,
        expiringSoon,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik." },
      { status: 500 }
    );
  }
});
