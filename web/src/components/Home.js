import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Link } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  program,
  programId,
  pollSeed,
  globalAccountPDAAddress,
} from '../config';

const Home = () => {
  const [polls, setPolls] = useState([]); // Holds the list of polls
  const [loading, setLoading] = useState(false); // Indicates loading state
  const [pollsCounter, setPollsCounter] = useState(0); // Stores the current number of polls
  const { connected } = useWallet(); // Wallet connection state

  /**
   * Fetch the global polls_counter from the program.
   * Updates only if the counter value has changed.
   */
  const fetchPollsCounter = async () => {
    try {
      const votingProgram = program({ publicKey: null });
      const globalAccountPDA = await votingProgram.account.globalAccount.fetch(globalAccountPDAAddress);
      const fetchedCounter = Number(globalAccountPDA.pollsCounter.toString());

      // Update pollsCounter only if it has changed
      if (fetchedCounter !== pollsCounter) {
        setPollsCounter(fetchedCounter);
      }
    } catch (error) {
      console.error('Error fetching polls_counter:', error);
    }
  };

  /**
   * Fetches the details of all polls up to the current pollsCounter.
   * Compares the current polls state with the fetched data and updates
   * the state only if there are changes.
   */
  const fetchPolls = async () => {
    if (pollsCounter === 0) return; // Skip if no polls exist

    try {
      const votingProgram = program({ publicKey: null });
      const foundPolls = [];

      // Fetch poll data for each poll
      for (let counter = 1; counter <= pollsCounter; counter++) {
        const [pollPDAAddress] = await PublicKey.findProgramAddress(
          [Buffer.from(pollSeed), Buffer.from(toLittleEndian8Bytes(counter))],
          programId
        );

        try {
          const pollAccount = await votingProgram.account.pollAccount.fetch(pollPDAAddress);
          if (pollAccount) {
            const pollData = {
              number: counter,
              question: pollAccount.question.toString(),
              totalVotes: Number(pollAccount.yes.toString()) + Number(pollAccount.no.toString()),
              pda: pollPDAAddress.toBase58(),
            };
            foundPolls.push(pollData);
          }
        } catch (pollFetchError) {
          console.warn(`Failed to fetch poll at counter ${counter}`, pollFetchError);
        }
      }

      // Update polls state only if there are changes
      if (JSON.stringify(foundPolls) !== JSON.stringify(polls)) {
        setPolls(foundPolls);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  /**
   * Converts a number to a Little Endian byte array (8 bytes).
   */
  function toLittleEndian8Bytes(num) {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32LE(num, 0);
    return buffer;
  }

  /**
   * Initial data fetch and periodic updates every 30 seconds.
   * Calls fetchPollsCounter and fetchPolls only if changes are detected.
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchPollsCounter();
      await fetchPolls();
      setLoading(false);
    };

    fetchData();

    const interval = setInterval(async () => {
      await fetchPollsCounter(); // Fetch counter first to determine if polls have changed
      await fetchPolls(); // Fetch updated polls if counter changes
    }, 30000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [pollsCounter]);

  return (
    <>
      {/* AppBar: Header with title and wallet connection */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Voting App
          </Typography>
          <WalletMultiButton />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container sx={{ marginTop: 4 }}>
        {/* Button to create a new poll (visible if connected) */}
        {connected && (
          <Link to="/create-poll" style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              color="primary"
              sx={{ marginBottom: 4 }}
            >
              Create New Poll
            </Button>
          </Link>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <Grid container justifyContent="center" alignItems="center" style={{ height: '50vh' }}>
            <CircularProgress />
          </Grid>
        ) : polls.length === 0 ? (
          <Typography variant="h6" align="center">
            No polls available.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {polls.map((poll, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      Poll #{poll.number}
                    </Typography>
                    <Typography color="text.secondary">
                      {poll.question}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Votes: {poll.totalVotes}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Link to={`/poll/${poll.pda}`} style={{ textDecoration: 'none' }}>
                      <Button size="small" variant="outlined" color="primary">
                        View Poll
                      </Button>
                    </Link>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

export default Home;
