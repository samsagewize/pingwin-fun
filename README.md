# PINGWIN.FUN

Meme-casino launchpad (UI-first scaffold).

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first theme tokens in `src/app/globals.css`)

## Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes
- Current pages: `/`, `/explore`, `/create`, `/profile`, `/launch/[id]`
- Wallet connect: Wallet Standard (Phantom / Solflare)
- Platform fee treasury (mainnet): `B59jW3oFwJzC2wu8T4EgwNmk6icGeMC4uQ7KgNKFKaTg`

## Admin mint (server wallet)

`/create` calls a server endpoint that creates an SPL mint on **mainnet-beta** using an admin keypair from env.

Create `.env.local`:

```bash
# optional
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# required: JSON array for Keypair.secretKey
SOLANA_ADMIN_SECRET_KEY=[1,2,3,...]
```
