import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = auth(async (req, ctx) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await (ctx as RouteParams).params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        checkIns: {
          orderBy: { checkedAt: "desc" },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    const now = new Date();
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
  } catch (error) {
    console.error("Error fetching member details:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data detail anggota." },
      { status: 500 }
    );
  }
});

export const PUT = auth(async (req, ctx) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await (ctx as RouteParams).params;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const userType = formData.get("userType") as string; // STUDENT | STAFF | PUBLIC
    const nim = formData.get("nim") as string;
    const nip = formData.get("nip") as string;
    const file = formData.get("profilePicture") as File | null;

    if (!name || !phone || !userType) {
      return NextResponse.json(
        { error: "Mohon lengkapi field nama, telepon, dan tipe user." },
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

    // Determine new memberId if type changes
    let newMemberId = member.memberId;
    if (userType !== member.userType) {
      if (userType === "STUDENT") {
        if (!nim) return NextResponse.json({ error: "NIM wajib diisi." }, { status: 400 });
        newMemberId = nim;
      } else if (userType === "STAFF") {
        if (!nip) return NextResponse.json({ error: "NIP wajib diisi." }, { status: 400 });
        newMemberId = nip;
      } else {
        // Switch to public, we need to generate a new sequential ID
        const currentYear = new Date().getFullYear();
        const counterResult = await prisma.$transaction(async (tx) => {
          let record = await tx.publicIdCounter.findUnique({
            where: { id: "counter" },
          });

          if (!record || record.year !== currentYear) {
            record = await tx.publicIdCounter.upsert({
              where: { id: "counter" },
              update: { year: currentYear, counter: 1 },
              create: { id: "counter", year: currentYear, counter: 1 },
            });
          } else {
            record = await tx.publicIdCounter.update({
              where: { id: "counter" },
              data: { counter: { increment: 1 } },
            });
          }
          return record;
        });
        newMemberId = `${currentYear}-${String(counterResult.counter).padStart(6, "0")}`;
      }
    } else {
      // Type is same, but NIM/NIP might have been corrected
      if (userType === "STUDENT" && nim && nim !== member.memberId) {
        newMemberId = nim;
      } else if (userType === "STAFF" && nip && nip !== member.memberId) {
        newMemberId = nip;
      }
    }

    // Verify uniqueness of new memberId if it changed
    if (newMemberId !== member.memberId) {
      const duplicate = await prisma.member.findUnique({
        where: { memberId: newMemberId },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `ID/NIM/NIP (${newMemberId}) sudah digunakan anggota lain.` },
          { status: 400 }
        );
      }
    }

    // Process new file if uploaded
    let profilePictureUrl = member.profilePicture;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), "uploads");
      await mkdir(uploadDir, { recursive: true });
      
      const fileExt = path.extname(file.name) || ".jpg";
      const fileName = `${crypto.randomUUID()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      profilePictureUrl = `/uploads/${fileName}`;
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name,
        phone,
        userType,
        memberId: newMemberId,
        profilePicture: profilePictureUrl,
      },
    });

    return NextResponse.json({
      message: "Profil anggota berhasil diperbarui.",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil anggota." },
      { status: 500 }
    );
  }
});

export const DELETE = auth(async (req, ctx) => {
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

    // Delete profile picture file if it exists under /uploads/
    if (member.profilePicture && member.profilePicture.startsWith("/uploads/")) {
      const filename = member.profilePicture.replace("/uploads/", "");
      const filePath = path.join(process.cwd(), "uploads", filename);
      await unlink(filePath).catch((err) => {
        console.error("Failed to delete profile picture file:", err);
      });
    }

    // Delete member record (associated check-ins are deleted cascade)
    await prisma.member.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Anggota berhasil dihapus secara permanen.",
    });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data anggota." },
      { status: 500 }
    );
  }
});
