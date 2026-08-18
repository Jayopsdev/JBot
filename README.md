# SupportHub

Local customer-support SaaS demo for technical interviews. The app uses **Next.js App Router**, **Prisma**, and a **SQLite** database. No cloud database is required.

## Demo login

Password for every seeded agent:

```
Demo123!
```

| Agent | Email | Role |
| --- | --- | --- |
| Alex Johnson | alex@supporthub.local | Admin |
| Sarah Williams | sarah@supporthub.local | Agent |
| David Kumar | david@supporthub.local | Agent |

## Setup

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

## Useful scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run db:migrate
npm run db:seed
npm run db:reset
```

`npm run db:reset` drops the local SQLite database, reruns migrations, and reseeds demo data.

## Environment

Copy `.env.example` to `.env` if you are starting from a fresh checkout:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="supporthub-demo-session-secret"
```

The SQLite file is created at `prisma/dev.db`.

## Live chat demo

1. Open [http://localhost:3000/login](http://localhost:3000/login) and sign in as `alex@supporthub.local` / `Demo123!`.
2. Go to `/chat`.
3. In a second tab, open [http://localhost:3000/widget](http://localhost:3000/widget).
4. Click **Chat with us**, keep Name `Interview Customer` and Email `interview@example.com`, then start the chat.
5. Send `Hi, I need help with my payment.`
6. The conversation appears in the agent inbox without refreshing. Reply from `/chat`.
7. The reply appears in the widget. Use **Create Ticket** with subject `Payment issue` and priority `HIGH`.
8. Open `/tickets` to see the new ticket.

## Current milestone

Working now:

- Prisma schema and realistic seed data
- Agent login with protected routes
- Application shell (sidebar, header, notifications, logout)
- Dashboard with live SQLite metrics
- Agent live chat and customer chat widget on the same SQLite records
- Ticket creation from chat, listed on `/tickets`

CRM profiles and ticket workflow details are next.
