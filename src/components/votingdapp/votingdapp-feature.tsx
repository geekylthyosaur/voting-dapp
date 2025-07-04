'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useVotingdappProgram } from './votingdapp-data-access'
import { VotingdappCreate, VotingdappList } from './votingdapp-ui'

export default function VotingdappFeature() {
  const { publicKey } = useWallet()
  const { programId } = useVotingdappProgram()

  return publicKey ? (
    <div>
      <AppHero
        title="Голосування"
        subtitle={
          'Створіть нове голосування натиснувши на кнопку "Створити". Стан усіх голосувань зберігається у блокчейні.'
        }
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <div className="mb-6">
          <VotingdappCreate />
        </div>
        <VotingdappList />
      </AppHero>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
