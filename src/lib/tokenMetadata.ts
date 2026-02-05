import { Buffer } from 'buffer';
import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
  Metadata,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import type { Connection, Keypair } from '@solana/web3.js';

export function findMetadataPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

export async function createTokenMetadataImmutable(params: {
  connection: Connection;
  payer: Keypair;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}) {
  const metadataPda = findMetadataPda(params.mint);

  const createIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPda,
      mint: params.mint,
      mintAuthority: params.payer.publicKey,
      payer: params.payer.publicKey,
      updateAuthority: params.payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: params.name,
          symbol: params.symbol,
          uri: params.uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        // We set mutable=true initially, then in the next instruction we set
        // isMutable=false and set updateAuthority to SystemProgram (effectively revoked).
        isMutable: true,
        collectionDetails: null,
      },
    },
  );

  const revokeIx = createUpdateMetadataAccountV2Instruction(
    {
      metadata: metadataPda,
      updateAuthority: params.payer.publicKey,
    },
    {
      updateMetadataAccountArgsV2: {
        data: null,
        // No one can sign for SystemProgram, so this effectively revokes updates.
        updateAuthority: SystemProgram.programId,
        primarySaleHappened: null,
        isMutable: false,
      },
    } as unknown as Parameters<typeof createUpdateMetadataAccountV2Instruction>[0]["data"],
  );

  const tx = new Transaction().add(createIx, revokeIx);
  const signature = await sendAndConfirmTransaction(
    params.connection,
    tx,
    [params.payer],
    { commitment: 'confirmed' },
  );

  return {
    metadataPda: metadataPda.toBase58(),
    signature,
  };
}

export async function fetchTokenMetadata(params: {
  connection: Connection;
  mint: string;
}) {
  const mintPk = new PublicKey(params.mint);
  const metadataPda = findMetadataPda(mintPk);

  try {
    const md = await Metadata.fromAccountAddress(params.connection, metadataPda);
    const name = (md.data.name ?? '').replace(/\0/g, '').trim();
    const symbol = (md.data.symbol ?? '').replace(/\0/g, '').trim();
    const uri = (md.data.uri ?? '').replace(/\0/g, '').trim();

    return { name, symbol, uri, metadataPda: metadataPda.toBase58() };
  } catch {
    // No metadata account found (or parse error)
    return null;
  }
}
