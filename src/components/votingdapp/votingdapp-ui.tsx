'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo, useState, useEffect } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingdappProgram, useVotingdappProgramAccount } from './votingdapp-data-access'
import BN from 'bn.js'

function useCountdown(targetTimestamp: number | undefined) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (!targetTimestamp) return

    const update = () => {
      const now = Math.floor(Date.now() / 1000)
      setTimeLeft(Math.max(0, targetTimestamp - now))
    }

    update()
    const interval = setInterval(update, 1000)

    return () => clearInterval(interval)
  }, [targetTimestamp])

  return timeLeft
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function useEditPoll() {
  const [error, setError] = useState("")
  const [duration, setDuration] = useState("")
  const [durationUnit, setDurationUnit] = useState("min")

  const isValid = () => {
    const durationValue = parseInt(duration)
    if (isNaN(durationValue) || durationValue < 1) return "Duration must be greater than 0"
    return ""
  }

  const handleEdit = async () => {
    const validationError = isValid()
    if (validationError) {
      setError(validationError)
      return false
    } else {
      setError("")
    }

    const durationValue = parseInt(duration)
    let durationInSeconds = durationValue * 60
    if (durationUnit === "hour") durationInSeconds *= 60
    if (durationUnit === "day") durationInSeconds *= 60 * 60 * 24

    const timestamp = new BN(Math.floor(Date.now() / 1000) + durationInSeconds)
    return timestamp
  }

  return {
    error,
    duration,
    setDuration,
    durationUnit,
    setDurationUnit,
    handleEdit
  }
}

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
        Створити
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
  const [duration, setDuration] = useState("")
  const [durationUnit, setDurationUnit] = useState("min")

  const isValid = () => {
    if (!name.trim()) return "Назва голосування є обов'язковою"
    if (new TextEncoder().encode(name).length > 64) return "Назва голосування задовга"
    if (!description.trim()) return "Опис голосування є обов'язковим"
    if (new TextEncoder().encode(description).length > 64) return "Опис голосування задовгий"
    const durationValue = parseInt(duration)
    if (isNaN(durationValue) || durationValue < 1) return "Тривалість голосування має бути більше за 0"
    if (candidates.length === 0) return "Необхідний щонайменше 1 кандидат"
    if (candidates.length > 8) return "Дозволено максимум 8 кандидатів"
    for (const c of candidates) {
      if (!c.trim()) return "Назва кандидата є обов'язковою"
      if (new TextEncoder().encode(c).length > 32) return "Назва кандидата задовга"
    }
    return ""
  }

  const handleCreate = async () => {
    const validationError = isValid()
    if (validationError) {
      setError(validationError)
      return
    }

    const durationValue = parseInt(duration)
    let durationInSeconds = durationValue * 60
    if (durationUnit === "hour") durationInSeconds *= 60
    if (durationUnit === "day") durationInSeconds *= 60 * 60 * 24

    const timestamp = new BN(Math.floor(Date.now() / 1000) + durationInSeconds)

    await createPollMutation.mutateAsync({ name, description, timestamp, candidates })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Назва"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Опис"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="number"
            className="w-full border p-2 rounded"
            placeholder="Тривалість"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
          />
          <select
            className="border p-2 rounded"
            value={durationUnit}
            onChange={e => setDurationUnit(e.target.value)}
          >
            <option value="min">Хвилини</option>
            <option value="hour">Години</option>
            <option value="day">Дні</option>
          </select>
        </div>

        {candidates.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 border p-2 rounded"
              placeholder={`Кандидат ${i + 1}`}
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
              Додати кандидата
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
            Створити {createPollMutation.isPending && '...'}
          </button>
          <button
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
            onClick={onClose}
          >
            Закрити
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
          <h2 className={'text-2xl'}>Немає голосувань</h2>
          Голосувань не знайдено. Створіть голосування щоб розпочати.
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
  const { voteMutation, editPollMutation } = useVotingdappProgram()
  const { accountQuery } = useVotingdappProgramAccount({ account })

  type LoadingState = { [key: string]: boolean }
  const [loadingState, setLoadingState] = useState<LoadingState>({})
  const [viewMode, setViewMode] = useState<'main' | 'edit' | 'results'>('main')
  const { publicKey } = useWallet()

  const isCreator = useMemo(() => {
    const creator = accountQuery.data?.creator?.toString()
    return creator && publicKey ? creator === publicKey.toBase58() : false
  }, [accountQuery.data?.creator, publicKey])

  const name = useMemo(() => accountQuery.data?.name ?? '', [accountQuery.data?.name])
  const description = useMemo(() => accountQuery.data?.description, [accountQuery.data?.description])
  const timestamp = accountQuery.data?.timestamp?.toNumber()!
  const [targetTimestamp, setTargetTimestamp] = useState<number>(timestamp)
  const timeLeft = useCountdown(targetTimestamp)
  const candidates = useMemo(() => accountQuery.data?.candidates, [accountQuery.data?.candidates])
  const [isSaving, setIsSaving] = useState(false)
  const {
    error,
    duration,
    setDuration,
    durationUnit,
    setDurationUnit,
    handleEdit
  } = useEditPoll()

  const handleVoteClick = async (candidate: { name: string; votesCount: BN }) => {
    setLoadingState((prevState) => ({
      ...prevState,
      [candidate.name]: true,
    }))

    try {
      await voteMutation.mutateAsync({ name: name, candidate: candidate.name })
      await accountQuery.refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingState((prevState) => ({
        ...prevState,
        [candidate.name]: false,
      }))
      localStorage.setItem(name, candidate.name)
    }
  }

  const onSaveEdit = async () => {
    setIsSaving(true)
    const timestamp = await handleEdit()
    if (timestamp) {
      await editPollMutation.mutateAsync({ name, timestamp })
      setTargetTimestamp(timestamp.toNumber())
      setIsSaving(false)
      setViewMode('main')
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg relative overflow-hidden">
        <div
          className="flex w-[300%] transition-transform duration-500 ease-in-out"
          style={{
            transform: viewMode === 'edit' ? 'translateX(0)' :
              viewMode === 'main' ? 'translateX(-33.33%)' :
                'translateX(-66.66%)'
          }}
        >
          <PollEditView
            onSave={onSaveEdit}
            onBack={() => setViewMode('main')}
            error={error}
            duration={duration}
            setDuration={setDuration}
            durationUnit={durationUnit}
            setDurationUnit={setDurationUnit}
            isSaving={isSaving}
          />

          <div className="w-full p-6" style={{ flex: '0 0 33.33%' }}>
            <h2 className="text-2xl font-bold text-center">{name}</h2>
            <p className="text-gray-700 text-center mt-2">
              {description}
              <div className="text-gray-600 text-sm">
                {timeLeft === 0 ? 'Голосування завершено' : `Time left: ${formatTime(timeLeft)}`}
              </div>
            </p>
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Кандидати</h3>
              {candidates?.map((candidate: { name: string; votesCount: BN }) => (
                <div
                  key={candidate.name}
                  className="flex items-center justify-between border p-3 rounded-md"
                >
                  <div>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-gray-500">{candidate.votesCount.toString()} голосів</p>
                  </div>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleVoteClick(candidate)}
                    disabled={loadingState[candidate.name] || timeLeft === 0 || localStorage.getItem(name) !== null}
                  >
                    {loadingState[candidate.name] ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Проголосувати"
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              {isCreator && (
                <button
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  onClick={() => setViewMode('edit')}
                >
                  Редагувати
                </button>
              )}
              {timeLeft === 0 && (
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  onClick={() => setViewMode('results')}
                >
                  Результати
                </button>
              )}
            </div>
          </div>

          <PollResultsView
            candidates={candidates || []}
            onBack={() => setViewMode('main')}
          />
        </div>

        <div className="p-6">
          <button
            className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
            onClick={onClose}
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  )
}

function PollEditView({
  onSave,
  onBack,
  error,
  duration,
  setDuration,
  durationUnit,
  setDurationUnit,
  isSaving,
}: {
  onSave: () => void,
  onBack: () => void,
  error: string,
  duration: string,
  setDuration: (value: string) => void,
  durationUnit: string,
  setDurationUnit: (value: string) => void,
  isSaving: boolean,
}) {
  return (
    <div className="w-full p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-lg bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full px-3 py-1"
        >
          ←
        </button>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Змінити тривалість</h3>
        <div className="flex gap-2">
          <input
            type="number"
            className="w-full border p-2 rounded"
            placeholder="Poll Duration"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
          />
          <select
            className="border p-2 rounded"
            value={durationUnit}
            onChange={e => setDurationUnit(e.target.value)}
          >
            <option value="min">Хвилини</option>
            <option value="hour">Години</option>
            <option value="day">Дні</option>
          </select>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Зберегти'
          )}
        </button>
      </div>
    </div>
  )
}

function PollResultsView({
  candidates,
  onBack
}: {
  candidates: { name: string; votesCount: BN }[],
  onBack: () => void
}) {
  const totalVotes = useMemo(() => {
    return candidates.reduce((sum, candidate) => sum + candidate.votesCount.toNumber(), 0)
  }, [candidates])

  return (
    <div className="w-full p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-lg bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full px-3 py-1"
        >
          ←
        </button>
      </div>

      <h3 className="text-xl font-bold mb-4">Результати</h3>

      <div className="space-y-4 mb-6">
        {candidates.map((candidate) => {
          const votes = candidate.votesCount.toNumber()
          const percentage = totalVotes > 0 ? (votes / totalVotes * 100) : 0

          return (
            <div key={candidate.name} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{candidate.name}</span>
                <span>{votes} голосів ({percentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Підсумок</h4>
        <p>Всього голосів: {totalVotes}</p>
        {totalVotes > 0 && (
          <p>
            Перемагає: {candidates.reduce((prev, current) =>
              prev.votesCount.gt(current.votesCount) ? prev : current
            ).name}
          </p>
        )}
      </div>
    </div>
  )
}
