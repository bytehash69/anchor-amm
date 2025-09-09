import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorAmm } from "../target/types/anchor_amm";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

describe("anchor-amm", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorAmm as Program<AnchorAmm>;
  const connection = provider.connection;
  const admin = provider.wallet;

  let mintX: anchor.web3.PublicKey;
  let mintY: anchor.web3.PublicKey;
  let mintLp: anchor.web3.PublicKey;

  let amm: anchor.web3.PublicKey;
  let vaultX: anchor.web3.PublicKey;
  let vaultY: anchor.web3.PublicKey;

  let userAtaX: anchor.web3.PublicKey;
  let userAtaY: anchor.web3.PublicKey;
  let userLpAta: anchor.web3.PublicKey;

  const seed = new anchor.BN(8);
  const fee = 30;

  it("Initialize amm", async () => {

    mintX = await createMint(connection, admin.payer, admin.publicKey, null, 6);
    mintY = await createMint(connection, admin.payer, admin.publicKey, null, 6);

    [amm] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("amm")],
      program.programId
    );

    [mintLp] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), amm.toBuffer()],
      program.programId
    )

    vaultX = await getAssociatedTokenAddress(mintX, admin.publicKey, true);
    vaultY = await getAssociatedTokenAddress(mintY, admin.publicKey, true);

    // Console log all the variables
    console.log("mintX:", mintX.toString());
    console.log("mintY:", mintY.toString());
    console.log("mintLp:", mintLp.toString());
    console.log("amm:", amm.toString());
    console.log("vaultX:", vaultX.toString());
    console.log("vaultY:", vaultY.toString());

    const tx = await program.methods.initialize(
      fee,
      null
    ).accounts({      
      admin: admin.publicKey,
      mintX: mintX,
      mintY: mintY,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();

    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  });
});
