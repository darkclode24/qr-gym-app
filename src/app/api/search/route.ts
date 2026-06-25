import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const qrCode = searchParams.get("qrCode") || "";

    if (!query && !qrCode) {
      return NextResponse.json(
        { error: "Mohon isi pencarian nama atau scan QR Code." },
        { status: 400 }
      );
    }

    const now = new Date();

    if (qrCode) {
      // Find exact match by QR Code UUID
      const member = await prisma.member.findUnique({
        where: { qrCode },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Anggota tidak ditemukan." },
          { status: 404 }
        );
      }

      // Check if expired
      const isExpired =
        member.status === "APPROVED" &&
        member.validUntil &&
        new Date(member.validUntil) < now;

      return NextResponse.json({
        member: {
          ...member,
          isExpired,
        },
      });
    }

    // Otherwise search by name
    const members = await prisma.member.findMany({
      where: {
        name: { contains: query },
        // We only allow searching public records of users (whether approved, pending or rejected, wait! 
        // In the flow, it says: "User can search their name at a simple public site to show their QR Code, or save it to their gallery."
        // Wait, if they just registered, they are PENDING. If they search their name, they should still be able to find and view their card (which will show the PENDING watermark).
        // Yes! So they can access their pending card and download it to show the receptionist.
        // Thus, we shouldn't filter by APPROVED, we should return all statuses, but clearly display their status.
      },
      orderBy: { name: "asc" },
      take: 10, // Limit results for privacy
    });

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

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("Error in public search:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mencari anggota." },
      { status: 500 }
    );
  }
}
