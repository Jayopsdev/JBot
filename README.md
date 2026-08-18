# SupportStall

Customer-support interview demo. The app uses **Next.js App Router** and stores customers, chats, tickets, notes, and notifications in **browser localStorage**. There is no SQLite or Postgres dependency at runtime, so the same demo works on Vercel.

## Demo login

Password for every agent:

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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

Copy `.env.example` to `.env` if you are starting from a fresh checkout:

```
SESSION_SECRET="supporthub-demo-session-secret"
```

`DATABASE_URL` is unused. Login uses a signed cookie; all CRM, chat, and ticket data lives in this browser under `supportstall-db-v1`.

## Live chat demo

1. Open `/login` and sign in as `alex@supporthub.local` / `Demo123!`.
2. Go to `/chat`.
3. In a second tab on the **same origin**, open `/widget`.
4. Click **Chat with us**, keep Name `Interview Customer` and Email `interview@example.com`, then start the chat.
5. Send `Hi, I need help with my payment.`
6. The conversation appears in the agent inbox. Reply from `/chat`.
7. Use **Create Ticket** with subject `Payment issue` and priority `HIGH`.
8. Open `/tickets`, set the ticket to **In Progress**, and check the customer timeline.

Agent chat and the customer widget share data because they use the same origin's localStorage. Another device or another browser profile will have its own copy.

## Current milestone

Working now:

- Demo agent login with protected routes
- Dashboard, CRM, tickets, and live chat backed by localStorage
- Customer widget and agent inbox on the same browser database
- Ticket creation from chat, status changes, and CRM timeline
- Vercel-friendly deploy with no cloud database
