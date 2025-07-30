# Pdf order form creator

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/chris-germons-projects/vrg-print-ordering)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/tvDKTf6Vu7u)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/chris-germons-projects/vrg-print-ordering](https://vercel.com/chris-germons-projects/vrg-print-ordering)**

### Admin password

All pages under `/admin` are password protected. When you visit an admin route you'll be redirected to `/admin/login` where you only enter the password. The default password is `crowdit`, which can be changed by setting the `ADMIN_PASSWORD` environment variable.

### Environment variables

Create a `.env` file (or configure these variables in your deployment platform):

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
MAILGUN_SMTP_USERNAME=<mailgun-smtp-username>
MAILGUN_SMTP_PASSWORD=<mailgun-smtp-password>
FROM_EMAIL=<from@example.com>
# Optional
ADMIN_PASSWORD=crowdit
OPENAI_API_KEY=<openai-api-key>
```

`MAILGUN_SMTP_USERNAME`, `MAILGUN_SMTP_PASSWORD`, and `FROM_EMAIL` are required to send order emails. `ADMIN_PASSWORD` defaults to `crowdit` if not set, and `OPENAI_API_KEY` enables optional AI features.

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/tvDKTf6Vu7u](https://v0.dev/chat/projects/tvDKTf6Vu7u)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
