'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingdappProgram, useVotingdappProgramAccount } from './votingdapp-data-access'
import BN from 'bn.js'

export function VotingdappCreate() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div>
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={openModal}
      >
        Create Poll
      </button>
      {isModalOpen && <VotingdappCreatePopup onClose={closeModal} />}
    </div>
  )
}

export function VotingdappCreatePopup({ onClose }: { onClose: () => void }) {
  const { createPollMutation } = useVotingdappProgram()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [candidates, setCandidates] = useState<string[]>([""])
  const [error, setError] = useState("")

  const isValid = () => {
    if (!name.trim()) return "Name is required"
    if (new TextEncoder().encode(name).length > 64) return "Name is too long"
    if (!description.trim()) return "Description is required"
    if (new TextEncoder().encode(description).length > 64) return "Description is too long"
    if (candidates.length === 0) return "At least one candidate is required"
    if (candidates.length > 8) return "Maximum 8 candidates allowed"
    for (const c of candidates) {
      if (!c.trim()) return "Candidate name can't be empty"
      if (new TextEncoder().encode(c).length > 32) return "Candidate name too long"
    }
    return ""
  }

  const handleCreate = async () => {
    const validationError = isValid()
    if (validationError) {
      setError(validationError)
      return
    }
    await createPollMutation.mutateAsync({ name, description, candidates })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Poll Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        {candidates.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 border p-2 rounded"
              placeholder={`Candidate ${i + 1}`}
              value={c}
              onChange={e => {
                const copy = [...candidates]
                copy[i] = e.target.value
                setCandidates(copy)
              }}
            />
            {candidates.length > 1 && (
              <button
                className="text-red-500 font-bold"
                onClick={() => setCandidates(candidates.filter((_, j) => j !== i))}
                title="Remove candidate"
              >
                ×
              </button>
            )}

          </div>
        ))}
        <div className="flex justify-between">
          {candidates.length < 8 && (
            <button
              className="px-2 py-1 bg-gray-300 rounded"
              onClick={() => setCandidates([...candidates, ""])}
            >
              Add Candidate
            </button>
          )}
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex justify-between mt-6 space-x-4">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            onClick={handleCreate}
            disabled={createPollMutation.isPending}
          >
            Create Poll {createPollMutation.isPending && '...'}
          </button>
          <button
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
    <div className="card border-2 border-gray-300 rounded-xl shadow-md p-4 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4 text-center">
        <h2
          className="text-2xl font-semibold text-blue-700 hover:underline cursor-pointer"
          onClick={openModal}
        >
          {name}
        </h2>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-center">{name}</h2>
        <p className="text-gray-700 text-center mt-2">{description}</p>
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Candidates</h3>
          {candidates?.map((candidate: { name: string; votesCount: BN }) => (
            <div
              key={candidate.name}
              className="flex items-center justify-between border p-3 rounded-md"
            >
              <div>
                <p className="font-medium">{candidate.name}</p>
                <p className="text-sm text-gray-500">{candidate.votesCount.toString()} votes</p>
              </div>
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
        <button
          className="mt-6 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
