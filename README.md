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

## RPC (important)
If you see `403 {"message":"Access forbidden"}` from JSON-RPC, your environment is being blocked by the public Solana RPC.

Set a dedicated RPC in Vercel (recommended):
- `NEXT_PUBLIC_SOLANA_RPC_URL` (browser)
- `SOLANA_RPC_URL` (server)

Examples:
- Helius: `https://mainnet.helius-rpc.com/?api-key=...`
- Ankr: `https://rpc.ankr.com/solana`

## Admin mint (server wallet)

`/create` calls a server endpoint that creates an SPL mint on **mainnet-beta** using an admin keypair from env.

Create `.env.local`:

```bash
# optional
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# required: JSON array for Keypair.secretKey
SOLANA_ADMIN_SECRET_KEY=[1,2,3,...]
```
