import { NextResponse } from 'next/server';
import { createSplMintAndMintToOwner, keypairFromSecretKeyJson, makeConnection } from '@/lib/web3-compat';
import { createTokenMetadataImmutable } from '@/lib/tokenMetadata';
import { PublicKey } from '@solana/web3.js';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeTokenParams() {
  const adjectives = ['Arctic', 'Spicy', 'Turbo', 'Icy', 'Feral', 'Cosmic', 'Neon'];
  const nouns = ['Pingwin', 'Penguin', 'Waddle', 'Ice', 'Flipper', 'Yeti', 'Snow'];
  const adj = adjectives[randInt(0, adjectives.length - 1)];
  const noun = nouns[randInt(0, nouns.length - 1)];
  const suffix = randInt(10, 99);

  const name = `${adj} ${noun} ${suffix}`;
  const symbol = (`PW${adj[0]}${noun[0]}${suffix}`).toUpperCase().slice(0, 10);

  const decimals = [6, 9][randInt(0, 1)];
  // Human supply (not raw units)
  const supply = [1_000_000, 10_000_000, 100_000_000, 1_000_000_000][randInt(0, 3)];

  return { name, symbol, decimals, supply };
}

function getBaseUrl(req: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');

  // Best-effort for local/dev and self-hosted deployments.
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return 'http://localhost:3000';
  return `${proto}://${host}`;
}

function makeLogoSvg(params: { name: string; symbol: string }) {
  const safeSymbol = params.symbol.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'PINGWIN';
  const title = `${params.name} (${params.symbol})`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="96" fill="#0b0f1a"/>
  <circle cx="256" cy="220" r="138" fill="url(#g)" opacity="0.85"/>
  <circle cx="210" cy="206" r="22" fill="#0b0f1a"/>
  <circle cx="302" cy="206" r="22" fill="#0b0f1a"/>
  <path d="M256 238c-22 0-40 12-40 28s18 28 40 28 40-12 40-28-18-28-40-28z" fill="#0b0f1a"/>
  <text x="256" y="420" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="64" font-weight="800" fill="#e6f6ff">${safeSymbol}</text>
</svg>`;
}

export async function POST(req: Request) {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? DEFAULT_RPC;
  const secretKeyJson = process.env.SOLANA_ADMIN_SECRET_KEY;

  if (!secretKeyJson) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Missing SOLANA_ADMIN_SECRET_KEY. Set it in .env.local as a JSON array (the Keypair secretKey).',
      },
      { status: 500 }
    );
  }

  const { name, symbol, decimals, supply } = makeTokenParams();

  // Raw mint units
  const rawSupply = BigInt(supply) * 10n ** BigInt(decimals);

  try {
    const baseUrl = getBaseUrl(req);

    // NOTE: Writing to /public at runtime works for self-hosted Node deployments.
    // If deploying to a serverless platform with read-only FS, move this to real storage.

    // 1) Create mint + mint supply
    const res = await createSplMintAndMintToOwner({
      rpcUrl,
      secretKeyJson,
      decimals,
      supply: rawSupply,
    });

    // 2) Write metadata assets now that we know the mint address.
    const metadataDir = path.join(process.cwd(), 'public', 'metadata');
    await fs.mkdir(metadataDir, { recursive: true });

    const svgPath = path.join(metadataDir, `${res.mint}.svg`);
    const jsonPath = path.join(metadataDir, `${res.mint}.json`);

    await fs.writeFile(svgPath, makeLogoSvg({ name, symbol }), 'utf8');

    const uri = `${baseUrl}/metadata/${res.mint}.json`;
    const json = {
      name,
      symbol,
      description: `${name} — launched on pingwin.fun`,
      image: `${baseUrl}/metadata/${res.mint}.svg`,
      external_url: baseUrl,
      attributes: [{ trait_type: 'origin', value: 'pingwin.fun' }],
    };

    await fs.writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf8');

    // 3) Create on-chain Metaplex metadata + revoke updates (immutable)
    const connection = makeConnection(rpcUrl);
    const payer = keypairFromSecretKeyJson(secretKeyJson);
    const md = await createTokenMetadataImmutable({
      connection,
      payer,
      mint: new PublicKey(res.mint),
      name,
      symbol,
      uri,
    });

    return NextResponse.json({
      ok: true,
      ...res,
      metadata: md,
      name,
      symbol,
      decimals,
      supply,
      rpcUrl,
      uri,
      explorer: {
        mint: `https://solscan.io/token/${res.mint}`,
        tx: `https://solscan.io/tx/${res.signature}`,
        metadataTx: `https://solscan.io/tx/${md.signature}`,
      },
      note:
        'This creates an SPL mint, mints initial supply, and creates an immutable Metaplex metadata account (update authority revoked).',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
