# System Requirements

This document outlines the detailed functional and non-functional requirements for the QR Gym Check-in system.

## Functional Requirements

### 1. User Registration & Public Portal
- **FR-01**: Users must be able to self-register via a public page by inputting:
  - Full Name (Nama Lengkap)
  - User Type (Mahasiswa / Pegawai / Umum)
  - NIM (if Mahasiswa) or NIP (if Pegawai)
  - Phone Number (Active WhatsApp)
  - Profile Photo (Upload or Camera Capture)
  - Membership Type (Harian / Bulanan)
- **FR-02**: The application must enforce validation:
  - Student registrations require NIM; Staff registrations require NIP.
  - Public registrations require no ID; a sequential ID is automatically generated in `YYYY-NNNNNN` format.
  - Profile photos cannot be updated or replaced by the user once submitted.
- **FR-03**: After registration, users must immediately see their digital gym card containing a static, unique QR code containing a UUID.
- **FR-04**: The digital gym card must feature a visible status badge:
  - "Menunggu Persetujuan" (Pending Approval) for unapproved members.
  - "Keanggotaan Habis" (Expired) for approved members past their valid period.
- **FR-05**: Users must be able to search for their name on a public page to retrieve, view, or download (as PNG) their gym card.
- **FR-06**: Searching on the public portal must support searching by Name or scanning a card's QR Code.

### 2. Receptionist Dashboard & Authentication
- **FR-07**: The receptionist dashboard must be protected by authentication. Access requires logging in with credentials (single seeded receptionist account).
- **FR-08**: The dashboard must provide high-level statistics:
  - Total registered members.
  - Pending approval count.
  - Active checked-in members today.
  - Expiring memberships (within 7 days).
- **FR-09**: Receptionists must be able to view a queue of PENDING registrations and either:
  - **Approve**: Sets status to `APPROVED`, payment is marked complete (manual check), and membership validity dates are calculated.
  - **Reject**: Sets status to `REJECTED`.
- **FR-10**: On approval, the system must set membership validity:
  - **Harian (Daily)**: Valid for 1 calendar day from the exact time of approval.
  - **Bulanan (Monthly)**: Valid for 30 calendar days from the exact time of approval.
- **FR-11**: The receptionist must be able to view all members, search by name, and filter by status (Pending, Approved, Rejected, Expired) and user type.
- **FR-12**: Only the receptionist can edit a member's profile details (Name, NIM/NIP, Phone, Profile Photo) or force-update a card.
- **FR-13**: Receptionists must be able to manually renew an existing user's membership (Daily or Monthly), extending the validity dates from the time of renewal.

### 3. QR Check-in System
- **FR-14**: The receptionist check-in system must primarily support scanning member QR codes using the **Blueprint BP-OM200** USB hardware scanner.
- **FR-15**: The check-in screen must feature a dedicated, auto-focused input zone to capture scanner output (UUID from QR code) and support manual input typing.
- **FR-15b**: The system must provide a collapsible HTML5-based camera scanner (webcam) as a fallback mechanism.
- **FR-16**: Scanning or entering a valid UUID must pull up a check-in verification modal:
  - Displays the user's name, type, membership validity, status, and profile photo.
  - Displays a prominent status message (e.g., "APPROVED" in green or "EXPIRED / PENDING" in red).
- **FR-17**: The receptionist must manually click a "Konfirmasi Check-in" button on the verification modal to record the check-in event.
- **FR-18**: The system must reject check-in requests for members who are `PENDING`, `REJECTED`, or `EXPIRED`.
- **FR-19**: The dashboard must display a historical log of all check-in events (name, type, timestamp) with filtering capabilities.

## Hardware & Environment Requirements

- **HR-01 (Barcode Scanner)**: The system must work seamlessly with the **Blueprint BP-OM200** omnidirectional 2D scanner configured in USB HID keyboard emulation mode (plug and play).
- **HR-02 (Receptionist Terminal)**: The receptionist terminal is an All-in-One (AIO) PC running Windows. The application must support automatic page focusing and global key listeners to capture scanner keystrokes.

## Non-Functional Requirements

- **NFR-01 (Usability)**: The user-facing pages must be optimized for mobile devices (mobile-first design). The receptionist dashboard must be optimized for desktop and tablet screens.
- **NFR-02 (Aesthetics)**: The UI must employ a premium dark theme accented with yellow/gold, reflecting the visual identity of the Universitas Sriwijaya Fitness Center card design.
- **NFR-03 (Performance)**: The app must render gym cards swiftly and compile static assets locally. Image uploads should be compressed prior to disk storage.
- **NFR-04 (Security)**: Password hashes for admin/receptionist accounts must be secured with bcrypt. API routes inside `/api/members/*`, `/api/checkin/*`, and `/api/stats` must reject unauthorized requests.
- **NFR-05 (Portability)**: The database must use SQLite via Prisma to ensure local execution requires zero external infrastructure dependencies.
