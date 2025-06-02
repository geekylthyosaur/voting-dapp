import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { Votingdapp } from '../target/types/votingdapp';
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';

describe('votingdapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Votingdapp as Program<Votingdapp>;

  // Test data
  const pollName = "Election2023";
  const pollDescription = "Presidential Election 2023";
  const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
  const candidates = ["Alice", "Bob", "Charlie"];

  // Generate PDAs
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), Buffer.from(pollName)],
    program.programId
  );

  const createTestPoll = async (
    name: string,
    description: string,
    timestamp: number,
    candidates: string[],
    signer: Keypair = payer.payer
  ) => {
    const [pollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(name)],
      program.programId
    );

    return {
      pollPda,
      tx: await program.methods
        .createPoll(name, description, new BN(timestamp), candidates)
        .accounts({
          signer: signer.publicKey,
          poll: pollPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc()
    };
  };
  /*
    it('should create a new poll', async () => {
      await program.methods
        .createPoll(pollName, pollDescription, new anchor.BN(futureTimestamp), candidates)
        .accounts({
          signer: payer.publicKey,
          poll: pollPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
  
      const pollAccount = await program.account.poll.fetch(pollPda);
  
      expect(pollAccount.name).toEqual(pollName);
      expect(pollAccount.description).toEqual(pollDescription);
      expect(pollAccount.timestamp.toString()).toEqual(futureTimestamp.toString());
      expect(pollAccount.candidates.length).toEqual(candidates.length);
      expect(pollAccount.candidates[0].name).toEqual("Alice");
      expect(pollAccount.candidates[0].votesCount.toString()).toEqual("0");
    });
  
    it('should fail to create duplicate poll', async () => {
      try {
        await program.methods
          .createPoll(pollName, pollDescription, new anchor.BN(futureTimestamp), candidates)
          .accounts({
            signer: payer.publicKey,
            poll: pollPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
  
        fail("Expected transaction to fail");
      } catch (err) {
        expect(err.error.errorMessage).toContain("Poll already exists");
      }
    });
  
    it('should vote for a candidate', async () => {
      const [voterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voter"), Buffer.from(pollName), payer.publicKey.toBuffer()],
        program.programId
      );
  
      await program.methods
        .vote(pollName, "Alice")
        .accounts({
          signer: payer.publicKey,
          poll: pollPda,
          voter: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
  
      const pollAccount = await program.account.poll.fetch(pollPda);
      const voterAccount = await program.account.voter.fetch(voterPda);
  
      expect(pollAccount.candidates[0].votesCount.toString()).toEqual("1");
      expect(voterAccount.id.toString()).toEqual(payer.publicKey.toString());
    });
  
    it('should fail to vote for non-existent candidate', async () => {
      const newVoter = Keypair.generate();
      const [voterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voter"), Buffer.from(pollName), newVoter.publicKey.toBuffer()],
        program.programId
      );
  
      // Fund the new voter
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(newVoter.publicKey, 1000000000),
        "confirmed"
      );
  
      try {
        await program.methods
          .vote(pollName, "NonExistent")
          .accounts({
            signer: newVoter.publicKey,
            poll: pollPda,
            voter: voterPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([newVoter])
          .rpc();
  
        fail("Expected transaction to fail");
      } catch (err) {
        expect(err.error.errorMessage).toContain("Candidate not found");
      }
    });
  
    it('should fail with invalid poll name', async () => {
      const invalidPollName = "a".repeat(33); // Exceeds 32 character limit
  
      try {
        const [invalidPollPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("poll"), Buffer.from(invalidPollName)],
          program.programId
        );
  
        fail("Expected transaction to fail");
      } catch (err) {
        expect(err.message).toContain("Max seed length exceeded");
      }
    });
  
    it('should fail with invalid poll description', async () => {
      const tooLongDescription = "c".repeat(65);
      try {
        await createTestPoll("LongDescPoll", tooLongDescription, futureTimestamp, ["Cand2"]);
        fail("Expected transaction to fail for too long description");
      } catch (err) {
        expect(err.error.errorMessage).toContain("Invalid poll description");
      }
    });
  
    it('should count vote sent in last moment', async () => {
      const duplicateNamePoll = "DupNamePoll";
      const [dupPollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), Buffer.from(duplicateNamePoll)],
        program.programId
      );
  
      await program.methods
        .createPoll(duplicateNamePoll, "Poll with duplicate names", new BN(futureTimestamp), ["A", "A"])
        .accounts({
          signer: payer.publicKey,
          poll: dupPollPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
  
      const [voterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voter"), Buffer.from(duplicateNamePoll), payer.publicKey.toBuffer()],
        program.programId
      );
  
      await program.methods
        .vote(duplicateNamePoll, "A")
        .accounts({
          signer: payer.publicKey,
          poll: dupPollPda,
          voter: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
  
      const pollAccount = await program.account.poll.fetch(dupPollPda);
      expect(pollAccount.candidates[0].votesCount.toNumber()).toEqual(0);
      expect(pollAccount.candidates[1].votesCount.toNumber()).toEqual(1);
    });
  
    it('should fail with invalid candidates count', async () => {
      const tooManyCandidates = Array.from({ length: 9 }, (_, i) => `ExtraCand${i + 1}`);
      try {
        await createTestPoll("TooManyCandPoll", "Too many candidates", futureTimestamp, tooManyCandidates);
        fail("Expected transaction to fail for too many candidates");
      } catch (err) {
        expect(err.error.errorMessage).toContain("Invalid candidates count");
      }
    });
  
    it('should fail with invalid candidate name', async () => {
      const tooLongCandidateName = "d".repeat(33); // Exceeds 32 character limit
      try {
        await createTestPoll("PollLongCandName", "Long candidate name test", futureTimestamp, [tooLongCandidateName]);
        fail("Expected transaction to fail for too long candidate name");
      } catch (err) {
        expect(err.error.errorMessage).toContain("Invalid candidate name");
      }
    });
  */




  it('should correctly count votes when candidate names are identical', async () => {
    const duplicateNamePoll = "DupNamePoll";
    const [dupPollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(duplicateNamePoll)],
      program.programId
    );

    await program.methods
      .createPoll(duplicateNamePoll, "Poll with duplicate names", new BN(futureTimestamp), ["A", "A"])
      .accounts({
        signer: payer.publicKey,
        poll: dupPollPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("voter"), Buffer.from(duplicateNamePoll), payer.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .vote(duplicateNamePoll, "A")
      .accounts({
        signer: payer.publicKey,
        poll: dupPollPda,
        voter: voterPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(dupPollPda);
    expect(pollAccount.candidates[0].votesCount.toNumber()).toEqual(1);
    expect(pollAccount.candidates[1].votesCount.toNumber()).toEqual(0);
  });

  it('should prevent voting with wrong PDA', async () => {
    const pollName = "PDA-Test-Poll";
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;
    const { pollPda } = await createTestPoll(
      pollName,
      "PDA Test",
      futureTimestamp,
      ["Alice"]
    );

    // Generate incorrect PDA
    const wrongVoterPda = PublicKey.findProgramAddressSync(
      [Buffer.from("wrong_seed"), Buffer.from(pollName), payer.publicKey.toBuffer()],
      program.programId
    )[0];

    await expect(program.methods
      .vote(pollName, "Alice")
      .accounts({
        signer: payer.publicKey,
        poll: pollPda,
        voter: wrongVoterPda, // Incorrect PDA
        systemProgram: SystemProgram.programId,
      })
      .rpc()
    ).rejects.toThrow();

    // Verify no vote was recorded
    const pollAccount = await program.account.poll.fetch(pollPda);
    expect(pollAccount.candidates[0].votesCount.toString()).toEqual("0");
  });

  it('should fail to vote after poll has ended', async () => {
    // Create a new poll that has already ended
    const expiredPollName = "ExpiredPoll";
    const [expiredPollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), Buffer.from(expiredPollName)],
      program.programId
    );

    const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // 1 day ago

    await program.methods
      .createPoll(expiredPollName, "Expired poll", new anchor.BN(pastTimestamp), ["Candidate"])
      .accounts({
        signer: payer.publicKey,
        poll: expiredPollPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Try to vote
    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("voter"), Buffer.from(expiredPollName), payer.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .vote(expiredPollName, "Candidate")
        .accounts({
          signer: payer.publicKey,
          poll: expiredPollPda,
          voter: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      fail("Expected transaction to fail");
    } catch (err) {
      expect(err.error.errorMessage).toContain("Voting ended");
    }
  });

  it('should fail to vote twice', async () => {
    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("voter"), Buffer.from(pollName), payer.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .createPoll(pollName, pollDescription, new anchor.BN(futureTimestamp), candidates)
        .accounts({
          signer: payer.publicKey,
          poll: pollPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .vote(pollName, "Alice")
        .accounts({
          signer: payer.publicKey,
          poll: pollPda,
          voter: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .vote(pollName, "Alice")
        .accounts({
          signer: payer.publicKey,
          poll: pollPda,
          voter: voterPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      fail("Expected transaction to fail");
    } catch (err) {
      expect(err.error.errorMessage).toContain("Already voted");
    }
  });
});