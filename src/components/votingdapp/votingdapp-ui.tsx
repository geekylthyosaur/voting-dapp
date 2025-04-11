'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingdappProgram, useVotingdappProgramAccount } from './votingdapp-data-access'
import BN from 'bn.js'

export function VotingdappCreate() {
  const { createPollMutation } = useVotingdappProgram()

  const { name, description, candidates } = { name: 'My poll', description: 'This is my poll', candidates: ['A', 'B'] }

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => createPollMutation.mutateAsync({ name, description, candidates })}
      disabled={createPollMutation.isPending}
    >
      Create Poll {createPollMutation.isPending && '...'}
    </button>
  )
}

export function VotingdappList() {
  const { accounts, getProgramAccount } = useVotingdappProgram()

  if (getProgramAccount.isLoading) {
    return <div className="flex justify-center items-center h-full">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <div className="flex justify-center items-center h-full">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <VotingdappCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No polls</h2>
          No polls found. Create one to get started.
        </div>
      )}
    </div>
  )
}

function VotingdappCard({ account }: { account: PublicKey }) {
  const { accountQuery } = useVotingdappProgramAccount({ account })

  const name = useMemo(() => accountQuery.data?.name, [accountQuery.data?.name])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2 className="card-title justify-center text-3xl cursor-pointer" onClick={openModal}>
            {name}
          </h2>
        </div>
      </div>
      {isModalOpen && (
        <VotingdappCardPopup
          account={account}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

function VotingdappCardPopup({ account, onClose }: { account: PublicKey, onClose: () => void }) {
  const { voteMutation } = useVotingdappProgram()
  const { accountQuery } = useVotingdappProgramAccount({ account })

  type LoadingState = { [key: string]: boolean };
  const [loadingState, setLoadingState] = useState<LoadingState>({});

  const name = useMemo(() => accountQuery.data?.name, [accountQuery.data?.name])
  const description = useMemo(() => accountQuery.data?.description, [accountQuery.data?.description])
  const candidates = useMemo(() => accountQuery.data?.candidates, [accountQuery.data?.candidates])

  const handleVoteClick = async (candidate: { name: string; votesCount: BN }) => {
    setLoadingState((prevState) => ({
      ...prevState,
      [candidate.name]: true,
    }));

    try {
      await voteMutation.mutateAsync({ name: name, candidate: candidate.name });
      await accountQuery.refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingState((prevState) => ({
        ...prevState,
        [candidate.name]: false,
      }));
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md shadow-lg w-[75vw] max-w-screen-lg">
        <h2 className="text-2xl font-bold">{name}</h2>
        <p>{description}</p>
        <div className="space-y-4 mt-4">
          <h3 className="text-xl font-semibold">Candidates:</h3>
          {candidates?.map((candidate: { name: string; votesCount: BN }) => (
            <div key={candidate.name} className='grid md:grid-cols-3'>
              {candidate.name}: {candidate.votesCount.toString()} votes
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleVoteClick(candidate)}
                disabled={loadingState[candidate.name]}
              >
                {loadingState[candidate.name] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Vote"
                )}
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md" onClick={onClose}>
          Close
        </button>
      </div>
    </div >
  )
}
