import { NextResponse } from 'next/server';
import { createSplMintAndMintToOwner } from '@/lib/web3-compat';

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

export async function POST() {
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
    const res = await createSplMintAndMintToOwner({
      rpcUrl,
      secretKeyJson,
      decimals,
      supply: rawSupply,
    });

    return NextResponse.json({
      ok: true,
      ...res,
      name,
      symbol,
      decimals,
      supply,
      rpcUrl,
      explorer: {
        mint: `https://solscan.io/token/${res.mint}`,
        tx: `https://solscan.io/tx/${res.signature}`,
      },
      note:
        'This creates an SPL mint + mints initial supply to the admin wallet ATA. Name/symbol are generated but NOT written on-chain (no token metadata).',
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
