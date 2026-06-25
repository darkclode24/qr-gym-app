# QR Gym

## Receptionist deployment

Production releases are published as a prebuilt Docker image:

```text
ghcr.io/darkclode24/qr-gym-app:stable
```

Create a GitHub Release to build and publish a tested image and attach
`QR-Gym-Receptionist.zip`. Give that ZIP to the receptionist.

The receptionist installs Docker Desktop and double-clicks:

```text
Install QR Gym.bat
```

Updates always create a stopped, consistent backup before replacing the
application container. Database and uploads are stored in external volumes
using the legacy-compatible names:

```text
qr-gym_qr-gym-data
qr-gym_qr-gym-uploads
```

The deployment scripts contain no volume deletion or prune commands. Backups
are stored under `Documents\QR-Gym-Backups`.

Before distribution, make the repository's GHCR package public. Otherwise the
receptionist computer must authenticate to `ghcr.io`.

Do not use `prisma db push` in production. Add and review a Prisma migration,
then publish a release. Existing databases made by the old Docker entrypoint
are schema-checked and safely baselined on their first upgraded start.

## Local development

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
