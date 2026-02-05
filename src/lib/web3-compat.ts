import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { createTokenMetadataImmutable } from '@/lib/tokenMetadata';

export function makeConnection(rpcUrl: string) {
  return new Connection(rpcUrl, { commitment: 'confirmed' });
}

export function toPubkey(address: string) {
  return new PublicKey(address);
}

export function keypairFromSecretKeyJson(secretKeyJson: string) {
  const secret = JSON.parse(secretKeyJson) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export async function getSplTokenBalances(params: {
  rpcUrl: string;
  owner: string;
}) {
  const connection = makeConnection(params.rpcUrl);
  const owner = toPubkey(params.owner);

  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const balances = res.value
    .map((a) => {
      const parsed = (a.account.data as unknown as { parsed?: unknown }).parsed;
      const info = (parsed as { info?: unknown } | undefined)?.info as
        | Record<string, unknown>
        | undefined;

      const mint = info?.mint as string | undefined;
      const tokenAmount = info?.tokenAmount as
        | {
            uiAmount?: number | null;
            decimals?: number;
            amount?: string;
          }
        | undefined;

      const uiAmount = tokenAmount?.uiAmount ?? 0;
      const decimals = tokenAmount?.decimals;
      const amount = tokenAmount?.amount;

      if (!mint || !amount || decimals === undefined) return null;
      return {
        mint,
        amount,
        decimals,
        uiAmount,
      };
    })
    .filter((b): b is { mint: string; amount: string; decimals: number; uiAmount: number } =>
      Boolean(b),
    )
    // Only show non-zero balances (parsed accounts include empty ATAs sometimes).
    .filter((b) => Number(b.uiAmount) > 0)
    // Sort descending
    .sort((a, b) => Number(b.uiAmount) - Number(a.uiAmount));

  return balances as Array<{
    mint: string;
    amount: string;
    decimals: number;
    uiAmount: number;
  }>;
}

export async function createSplMintAndMintToOwner(params: {
  rpcUrl: string;
  secretKeyJson: string;
  decimals: number;
  supply: bigint;
  owner?: string; // defaults to payer
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
  };
}) {
  const connection = makeConnection(params.rpcUrl);
  const payer = keypairFromSecretKeyJson(params.secretKeyJson);

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    params.decimals
  );

  const owner = params.owner ? toPubkey(params.owner) : payer.publicKey;

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  );

  const signature = await mintTo(
    connection,
    payer,
    mint,
    ata.address,
    payer.publicKey,
    params.supply
  );

  let metadata: { metadataPda: string; signature: string } | undefined;
  if (params.metadata) {
    metadata = await createTokenMetadataImmutable({
      connection,
      payer,
      mint,
      name: params.metadata.name,
      symbol: params.metadata.symbol,
      uri: params.metadata.uri,
    });
  }

  return {
    mint: mint.toBase58(),
    owner: owner.toBase58(),
    ata: ata.address.toBase58(),
    signature,
    metadata,
  };
}
