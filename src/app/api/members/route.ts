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
    const status = searchParams.get("status") || ""; // ALL, PENDING, APPROVED, REJECTED, EXPIRED
    const userType = searchParams.get("userType") || ""; // ALL, STUDENT, STAFF, PUBLIC

    const now = new Date();

    // Build Prisma query filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { memberId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (userType && userType !== "ALL") {
      whereClause.userType = userType;
    }

    if (status && status !== "ALL") {
      if (status === "EXPIRED") {
        whereClause.status = "APPROVED";
        whereClause.validUntil = { lt: now };
      } else if (status === "APPROVED") {
        whereClause.status = "APPROVED";
        whereClause.OR = [
          { validUntil: { gte: now } },
          { validUntil: null }, // shouldn't happen for approved but just in case
        ];
      } else {
        whereClause.status = status;
      }
    }

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const skip = (page - 1) * limit;

    const [total, members] = await prisma.$transaction([
      prisma.member.count({ where: whereClause }),
      prisma.member.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Add virtual expired status if necessary
    const formattedMembers = members.map((member) => {
      const isExpired =
        member.status === "APPROVED" &&
        member.validUntil &&
        new Date(member.validUntil) < now;
      
      return {
        ...member,
        isExpired,
      };
    });

    return NextResponse.json({
      members: formattedMembers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data anggota." },
      { status: 500 }
    );
  }
});
