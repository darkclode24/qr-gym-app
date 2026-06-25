# Project Brief - Universitas Sriwijaya Fitness Center Gym App

A digital gym check-in and membership management system tailored for the **Universitas Sriwijaya Fitness Center**. It enables students, staff, and the public to self-register for digital gym cards, generating static, unique QR codes for verification. A receptionist-facing dashboard allows scanning, manual check-in verification, new registration approval, and profile management.

## Target Audience

1. **Mahasiswa (Student)**: Requires a valid NIM (Nomor Induk Mahasiswa).
2. **Pegawai (Staff)**: Requires a valid NIP (Nomor Induk Pegawai).
3. **Umum (Public)**: Does not require a university identifier. An ID is auto-generated using sequential format.

## Core Features

- **Self-Registration Portal**: Public page where users can input details, upload a profile photo, choose membership type (Harian/Bulanan), and select manual payment. Profile photos cannot be altered by the user after submission to preserve integrity.
- **Manual Verification & Approval Flow**: Newly registered users are marked as `PENDING`. They receive their digital gym card immediately with a "Menunggu Persetujuan" overlay. They cannot check-in until a receptionist approves their profile and confirms payment receipt.
- **Digital Gym Card**: Rendered in a black and yellow/gold theme matching `card.png`. It displays the member's photo, name, member ID, type (Student/Staff/Public), validity period, and a static UUID-based QR Code. Includes a canvas-based PNG download button to save to local gallery.
- **QR Check-in System**: Browser-based camera scanner (with manual UUID fallback) inside the receptionist dashboard. Scanning queries the user profile. The receptionist visually verifies the user's face matches the profile picture and clicks "Confirm Check-in" to log the visit.
- **Receptionist Dashboard**:
  - Stats overview (Active members, pending queue size, daily check-in counts).
  - Searchable/filterable member directory.
  - Profile modification page (Only the receptionist can edit profiles or update photos post-registration).
  - Approval queue for pending registrations.
  - Detailed check-in history logs.
  - Membership renewal button to extend subscriptions (Harian/Bulanan).

## Pricing Model

| User Type | Harian (Daily) | Bulanan (Monthly) |
|---|---|---|
| Student (Mahasiswa) | Rp 10.000 | Rp 100.000 |
| Staff (Pegawai) | Rp 15.000 | Rp 150.000 |
| Public (Umum) | Rp 20.000 | Rp 200.000 |

## Technology Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Database**: SQLite (via Prisma ORM)
- **Auth**: NextAuth.js (receptionist credentials provider)
- **Image Processing**: Canvas API via `html2canvas` for PNG download
- **QR Code**: `qrcode` (generation) & `html5-qrcode` (camera scanning)
- **Styling**: Tailwind CSS & custom variables (`src/app/globals.css`) in a dark theme matching `card.png`
- **Hosting**: Target domain is `fitnesshub.unsri.ac.id` (Standard Node.js server deployment)
