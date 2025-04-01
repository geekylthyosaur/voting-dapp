import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material';
import { connection, program, programId, voterSeed } from '../config';
import { SystemProgram } from '@solana/web3.js';

const Poll = () => {
  const { publicKey, sendTransaction } = useWallet(); // Access wallet's public key and transaction method
  const [loading, setLoading] = useState(false); // Indicates data fetching state
  const [confirming, setConfirming] = useState(false); // Indicates transaction confirmation state
  const [pollNumber, setPollNumber] = useState(0); // Stores poll number
  const [pollAuthor, setPollAuthor] = useState(''); // Stores poll author
  const [pollQuestion, setPollQuestion] = useState(''); // Stores poll question
  const [pollYes, setPollYes] = useState(0); // Stores "Yes" votes count
  const [pollNo, setPollNo] = useState(0); // Stores "No" votes count
  const [voterAccount, setVoterAccount] = useState(null); // Tracks user's voter account
  const { pollPDAAddress } = useParams(); // Gets the poll PDA from URL parameters

  /**
   * Fetches poll information from the Solana program and updates the state.
   */
  const fetchPollInfo = async () => {
    try {
      const votingProgram = program({ publicKey: null }); // Initialize program without wallet interaction
      const pollPDA = await votingProgram.account.pollAccount.fetch(pollPDAAddress);

      // Update state with poll data
      setPollNumber(Number(pollPDA.number.toString()));
      setPollAuthor(pollPDA.author.toString());
      setPollQuestion(pollPDA.question.toString());
      setPollYes(Number(pollPDA.yes.toString()));
      setPollNo(Number(pollPDA.no.toString()));
    } catch (error) {
      console.error('Error in fetchPollInfo:', error);
    }
  };

  /**
   * Fetches the voter's account to check voting status and vote preference.
   */
  const fetchVoterAccount = async () => {
    try {
      const pollPDAPublicKey = new PublicKey(pollPDAAddress); // Convert pollPDAAddress to PublicKey
      const votingProgram = program({ publicKey: null }); // Initialize program
      const [voterAccountPDAAddress] = await PublicKey.findProgramAddress(
        [Buffer.from(voterSeed), pollPDAPublicKey.toBuffer(), publicKey.toBuffer()],
        programId
      );

      // Fetch voter account data
      const voterAccountPDA = await votingProgram.account.voterAccount.fetch(voterAccountPDAAddress);
      setVoterAccount(voterAccountPDA);
    } catch (e) {
      setVoterAccount(null); // Reset voterAccount state if fetch fails
    }
  };

  /**
   * Handles the voting process for "Yes" or "No".
   * Sends a transaction to the Solana program and refreshes poll and voter data upon confirmation.
   */
  const vote = async (option) => {
    try {
      setConfirming(true); // Start spinner during confirmation
      const votingProgram = program({ publicKey }); // Initialize program with user's wallet
      const transaction = await votingProgram.methods
        .vote(option) // Specify vote option (true for "Yes", false for "No")
        .accounts({
          pollAccount: pollPDAAddress, // Poll account
          user: publicKey, // User's public key
          systemProgram: SystemProgram.programId, // System program
        })
        .transaction();

      const transactionSignature = await sendTransaction(transaction, connection);

      // Wait for transaction to be confirmed
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: transactionSignature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'finalized' // High commitment level
      );

      console.log('Transaction confirmed, refreshing data...');
      // Refresh poll and voter data after transaction confirmation
      await fetchPollInfo();
      await fetchVoterAccount();
    } catch (error) {
      console.error('Error during voting:', error);
    } finally {
      setConfirming(false); // Stop spinner
    }
  };

  /**
   * Initial fetch of poll and voter data when the component mounts.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading spinner
      await fetchPollInfo(); // Fetch poll data
      if (publicKey) {
        await fetchVoterAccount(); // Fetch voter data if wallet is connected
      }
      setLoading(false); // Stop loading spinner
    };

    fetchData();
  }, [publicKey, pollPDAAddress]);

  /**
   * Periodic fetch of poll and voter data every 30 seconds.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPollInfo(); // Update poll data
      if (publicKey) {
        fetchVoterAccount(); // Update voter data if wallet is connected
      }
    }, 30000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [publicKey, pollPDAAddress]);

  return (
    <>
      {/* Header with poll number and wallet connection button */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Poll #{pollNumber}
          </Typography>
          <WalletMultiButton />
        </Toolbar>
      </AppBar>
      <Container sx={{ marginTop: 4 }}>
        {loading ? (
          // Show spinner while loading data
          <Grid container justifyContent="center" alignItems="center" style={{ height: '50vh' }}>
            <CircularProgress />
          </Grid>
        ) : (
          // Show poll details
          <Card>
            <CardContent>
              <Typography variant="h5">{pollQuestion}</Typography>
              <Typography color="text.secondary" sx={{ marginTop: 2 }}>
                Author: {pollAuthor}
              </Typography>
              <Typography variant="body2" sx={{ marginTop: 2 }}>
                Yes: {pollYes} votes
              </Typography>
              <Typography variant="body2" sx={{ marginTop: 1 }}>
                No: {pollNo} votes
              </Typography>
            </CardContent>
            <CardActions>
              {confirming ? (
                <CircularProgress size={24} /> // Spinner during transaction confirmation
              ) : publicKey && voterAccount?.voted ? (
                <Typography sx={{ marginLeft: 2, color: 'green' }}>
                  ✅ You have voted for {voterAccount.vote ? 'Yes' : 'No'}
                </Typography>
              ) : (
                // Show voting buttons if not yet voted
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => vote(true)}
                    disabled={!publicKey || confirming}
                  >
                    Vote Yes
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => vote(false)}
                    disabled={!publicKey || confirming}
                  >
                    Vote No
                  </Button>
                </>
              )}
            </CardActions>
          </Card>
        )}
        {/* Back to Home button */}
        <Link to="/" style={{ textDecoration: 'none', marginTop: '20px', display: 'block' }}>
          <Button variant="outlined" color="primary">
            Back to Home
          </Button>
        </Link>
      </Container>
    </>
  );
};

export default Poll;
