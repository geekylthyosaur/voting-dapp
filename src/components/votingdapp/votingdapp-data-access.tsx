'use client'

import { getVotingdappProgram, getVotingdappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import BN from 'bn.js'

export function useVotingdappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getVotingdappProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVotingdappProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['votingdapp', 'all', { cluster }],
    queryFn: () => {
      return program.account.poll.all()
    },
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createPollMutation = useMutation({
    mutationKey: ['votingdapp', 'createPoll', { cluster }],
    mutationFn: ({ name, description, timestamp, candidates }: { name: string, description: string, timestamp: BN, candidates: string[] }) => {
      return program.methods
        .createPoll(name, description, timestamp, candidates)
        .accounts({ signer: provider.wallet.publicKey })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error: any) => {
      console.log({ error })
      if (error.error.errorCode.code != null) {
        if (error.error.errorCode.code === "InvalidPollName") {
          toast.error("Poll name is invalid")
          return;
        }
        if (error.error.errorCode.code === "PollAlreadyExists") {
          toast.error("This poll already exists")
          return;
        }
      }
    }
  })

  const editPollMutation = useMutation({
    mutationKey: ['votingdapp', 'editPoll', { cluster }],
    mutationFn: ({ name, timestamp }: { name: string; timestamp: BN }) => {
      return program.methods
        .editPoll(name, timestamp)
        .accounts({
          signer: provider.wallet.publicKey,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error: any) => {
      console.error(error)
      if (error.error?.errorCode?.code === 'VotingEnded') {
        toast.error('Voting has ended')
      }
    },
  })

  const voteMutation = useMutation({
    mutationKey: ['votingdapp', 'vote', { cluster }],
    mutationFn: ({ name, candidate }: { name: string, candidate: string }) => program.methods
      .vote(name, candidate)
      .accounts({
        signer: provider.wallet.publicKey,
      })
      .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error: any) => {
      console.log({ error })
      if (error.error.errorCode.code != null) {
        if (error.error.errorCode.code === "AlreadyVoted") {
          toast.error("You already voted in this poll")
          return;
        }
        if (error.error.errorCode.code === "VotingEnded") {
          toast.error("Voting has ended")
          return;
        }
      }
    }
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createPollMutation,
    editPollMutation,
    voteMutation,
  }
}

export function useVotingdappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const { program } = useVotingdappProgram()

  const accountQuery = useQuery({
    queryKey: ['votingdapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.poll.fetch(account),
  })

  return {
    accountQuery,
  }
}
