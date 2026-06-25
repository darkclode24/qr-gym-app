import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const userType = formData.get("userType") as string; // STUDENT | STAFF | PUBLIC
    const nim = formData.get("nim") as string;
    const nip = formData.get("nip") as string;
    const membershipType = formData.get("membershipType") as string; // DAILY | MONTHLY
    const file = formData.get("profilePicture") as File | null;

    // Validation
    if (!name || !phone || !userType || !membershipType) {
      return NextResponse.json(
        { error: "Mohon lengkapi semua field yang wajib diisi." },
        { status: 400 }
      );
    }

    if (userType === "STUDENT" && !nim) {
      return NextResponse.json(
        { error: "NIM wajib diisi untuk kategori Mahasiswa." },
        { status: 400 }
      );
    }

    if (userType === "STAFF" && !nip) {
      return NextResponse.json(
        { error: "NIP wajib diisi untuk kategori Pegawai." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Foto profil wajib diunggah." },
        { status: 400 }
      );
    }

    // Determine memberId
    let memberId = "";
    if (userType === "STUDENT") {
      memberId = nim;
    } else if (userType === "STAFF") {
      memberId = nip;
    } else {
      // Kategori PUBLIC: Generate sequential ID YYYY-NNNNNN
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

      memberId = `${currentYear}-${String(counterResult.counter).padStart(6, "0")}`;
    }

    // Check duplicate memberId
    const existingMember = await prisma.member.findUnique({
      where: { memberId },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: `Nomor ID/NIM/NIP (${memberId}) sudah terdaftar.` },
        { status: 400 }
      );
    }

    // Save profile picture
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });
    
    const fileExt = path.extname(file.name) || ".jpg";
    const fileName = `${crypto.randomUUID()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    
    const profilePictureUrl = `/uploads/${fileName}`;

    // Calculate dates for auto-approval
    const now = new Date();
    let validUntil = new Date(now);

    if (membershipType === "DAILY") {
      // 1 calendar day (24 hours from approval)
      validUntil.setDate(validUntil.getDate() + 1);
    } else {
      // 30 calendar days from approval
      validUntil.setDate(validUntil.getDate() + 30);
    }

    // Create member record (status: APPROVED)
    const newMember = await prisma.member.create({
      data: {
        name,
        phone,
        userType,
        memberId,
        membershipType,
        profilePicture: profilePictureUrl,
        status: "APPROVED",
        validFrom: now,
        validUntil: validUntil,
      },
    });

    return NextResponse.json(
      {
        message: "Pendaftaran anggota berhasil disetujui.",
        member: {
          id: newMember.id,
          qrCode: newMember.qrCode,
          memberId: newMember.memberId,
          name: newMember.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error in registration:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});

