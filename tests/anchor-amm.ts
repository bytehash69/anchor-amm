import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorAmm } from "../target/types/anchor_amm";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("anchor-amm-q4-25", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorAmm as Program<AnchorAmm>;

  const user = provider.wallet.publicKey;

 
  let mintX: anchor.web3.PublicKey;
  let mintY: anchor.web3.PublicKey;
  let mintLp: anchor.web3.PublicKey;
  let configPDA: anchor.web3.PublicKey;
  let vaultX: anchor.web3.PublicKey;
  let vaultY: anchor.web3.PublicKey;
  let userX: anchor.web3.PublicKey;
  let userY: anchor.web3.PublicKey;
  let userLP: anchor.web3.PublicKey;

  const SIX_DECIMAL = BigInt(1_000_000);

  const seed = new anchor.BN(9876);
  const fee = 10;
  const initialAmount = 10_000_000_000;

  before(async () => {
    await provider.connection.requestAirdrop(
      user,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );

   
    mintX = await createMint(
      provider.connection,
      provider.wallet.payer,
      user,
      null,
      6
    );
    mintY = await createMint(
      provider.connection,
      provider.wallet.payer,
      user,
      null,
      6
    );

   
    const userXInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintX,
      user
    );
    userX = userXInfo.address;
    const userYInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintY,
      user
    );
    userY = userYInfo.address;

   
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintX,
      userX,
      user,
      initialAmount
    );
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintY,
      userY,
      user,
      initialAmount
    );

   
    [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [mintLp] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), configPDA.toBuffer()],
      program.programId
    );

    [vaultX] = anchor.web3.PublicKey.findProgramAddressSync(
      [configPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintX.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    [vaultY] = anchor.web3.PublicKey.findProgramAddressSync(
      [configPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintY.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    [userLP] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        provider.wallet.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintLp.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  });

  it("Initialize AMM pool", async () => {
    const tx = await program.methods
      .initialize(seed, fee, user)
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        config: configPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("AMM pool initialised, tx is: ", tx);

    const configAccount = await program.account.config.fetch(configPDA);
    assert.equal(configAccount.seed.toString(), seed.toString());
    assert.equal(configAccount.fee, fee);
    assert.equal(configAccount.mintX.toString(), mintX.toString());
    assert.equal(configAccount.mintY.toString(), mintY.toString());
    assert.equal(configAccount.locked, false);
  });

  it("Initial Deposit to Liquidity", async () => {
    const depositMaxX = new anchor.BN(1_000_000_000);
    const depositMaxY = new anchor.BN(2_000_000_000);

    console.log(
      `In this case depositMaxX is: ${
        BigInt(depositMaxX.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case depositMaxY is: ${
        BigInt(depositMaxY.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case amount to be deposit is: ${
        BigInt(1_000_000_000) / SIX_DECIMAL
      }`
    );
    const tx = await program.methods
      .deposit(new anchor.BN(1_000_000_000), depositMaxX, depositMaxY)
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit successful, tx is: ", tx);

    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    const userLpAccountInfo = await getAccount(provider.connection, userLP);

    console.log(
      `Vault X balance: ${
        BigInt(vaultXAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `Vault Y balance: ${
        BigInt(vaultYAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User LP balance: ${
        BigInt(userLpAccountInfo.amount.toString()) / SIX_DECIMAL
      } LP tokens`
    );

    assert.equal(
      userLpAccountInfo.amount.toString(),
      new anchor.BN(1_000_000_000).toString()
    );
    assert.ok(
      vaultXAccount.amount <= depositMaxX.toNumber(),
      "Slippage exceed"
    );
    assert.ok(
      vaultYAccount.amount <= depositMaxY.toNumber(),
      "Slippage exceed"
    );
  });
  it("Second deposit to Liquidity", async () => {
    const depositMaxX = new anchor.BN(100_000_000);
    const depositMaxY = new anchor.BN(200_000_000);

    console.log(
      `In this case depositMaxX is: ${
        BigInt(depositMaxX.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case depositMaxY is: ${
        BigInt(depositMaxY.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case amount to be deposit is: ${
        BigInt(100_000_000) / SIX_DECIMAL
      }`
    );

    const tx = await program.methods
      .deposit(new anchor.BN(100_000_000), depositMaxX, depositMaxY)
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
       
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Second Deposit successful, tx is: ", tx);

    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    const userLpAccountInfo = await getAccount(provider.connection, userLP);

    console.log(
      `Vault X balance: ${
        BigInt(vaultXAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `Vault Y balance: ${
        BigInt(vaultYAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User LP balance: ${
        BigInt(userLpAccountInfo.amount.toString()) / SIX_DECIMAL
      } LP tokens`
    );

    assert.equal(
      userLpAccountInfo.amount.toString(),
      new anchor.BN(1_100_000_000).toString()
    );
  });

  it("Swap 100 token X for token Y", async () => {
    const swapAmount = new anchor.BN(100_000_000);
    const min = new anchor.BN(1);

    const userXAmountBefore = await getAccount(provider.connection, userX);
    const userYAmountBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .swap(true, swapAmount, min)
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
       
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Swap successful, tx is: ", tx);

    const userXAmountAfter = await getAccount(provider.connection, userX);
    const userYAmountAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userXAmountAfter.amount < userXAmountBefore.amount,
      "User X balance should decrease"
    );
    assert.ok(
      userYAmountAfter.amount > userYAmountBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `User have Initial X token: ${
        BigInt(userXAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have Initial Y token: ${
        BigInt(userYAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After X token: ${
        BigInt(userXAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After Y token: ${
        BigInt(userYAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );

    console.log(
      `X balance change: ${
        BigInt(
          (userXAmountBefore.amount - userXAmountAfter.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
    console.log(
      `Y balance change: ${
        BigInt(
          (userYAmountAfter.amount - userYAmountBefore.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
  });

  it("now Swap 150 token X for token Y", async () => {
    const swapAmount = new anchor.BN(150_000_000);
    const min = new anchor.BN(1);

    const userXAmountBefore = await getAccount(provider.connection, userX);
    const userYAmountBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .swap(true, swapAmount, min)
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
       
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Swap successful, tx is: ", tx);

    const userXAmountAfter = await getAccount(provider.connection, userX);
    const userYAmountAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userXAmountAfter.amount < userXAmountBefore.amount,
      "User X balance should decrease"
    );
    assert.ok(
      userYAmountAfter.amount > userYAmountBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `User have Initial X token: ${
        BigInt(userXAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have Initial Y token: ${
        BigInt(userYAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After X token: ${
        BigInt(userXAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After Y token: ${
        BigInt(userYAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );

    console.log(
      `X balance change: ${
        BigInt(
          (userXAmountBefore.amount - userXAmountAfter.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
    console.log(
      `Y balance change: ${
        BigInt(
          (userYAmountAfter.amount - userYAmountBefore.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
  });

  it("Swap 150 token Y for token X", async () => {
    const swapAmount = new anchor.BN(150_000_000);
    const min = new anchor.BN(1);

    const userXAmountBefore = await getAccount(provider.connection, userX);
    const userYAmountBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .swap(false, swapAmount, min)
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
       
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Swap successful, tx is: ", tx);

    const userXAmountAfter = await getAccount(provider.connection, userX);
    const userYAmountAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userXAmountAfter.amount > userXAmountBefore.amount,
      "User X balance should increase"
    );
    assert.ok(
      userYAmountAfter.amount < userYAmountBefore.amount,
      "User Y balance should decrease"
    );

    console.log(
      `User have Initial X token: ${
        BigInt(userXAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have Initial Y token: ${
        BigInt(userYAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After X token: ${
        BigInt(userXAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After Y token: ${
        BigInt(userYAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );

    console.log(
      `X balance change: ${
        BigInt(
          (userXAmountAfter.amount - userXAmountBefore.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
    console.log(
      `Y balance change: ${
        BigInt(
          (userYAmountBefore.amount - userYAmountAfter.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
  });

  it("Withdraws liquidity from the pool", async () => {
    const userLpBefore = await getAccount(provider.connection, userLP);
    const withdrawAmount = Number(userLpBefore.amount.toString()) / 2;

    const userXBefore = await getAccount(provider.connection, userX);
    const userYBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .withdraw(
        new anchor.BN(withdrawAmount.toString()),
        new anchor.BN(0),
        new anchor.BN(0)
      )
      .accountsStrict({
        signer: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
       
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Withdraw transaction signature:", tx);

    const userLpAfter = await getAccount(provider.connection, userLP);
    const userXAfter = await getAccount(provider.connection, userX);
    const userYAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userLpAfter.amount < userLpBefore.amount,
      "LP balance should decrease"
    );
    assert.ok(
      userXAfter.amount > userXBefore.amount,
      "User X balance should increase"
    );
    assert.ok(
      userYAfter.amount > userYBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `LP tokens burned: ${
        BigInt((userLpBefore.amount - userLpAfter.amount).toString()) /
        SIX_DECIMAL
      }`
    );
    console.log(
      `X received: ${
        BigInt((userXAfter.amount - userXBefore.amount).toString()) /
        SIX_DECIMAL
      }`
    );
    console.log(
      `Y received:", ${
        BigInt((userYAfter.amount - userYBefore.amount).toString()) /
        SIX_DECIMAL
      }`
    );
  });
});