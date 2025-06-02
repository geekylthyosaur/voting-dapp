'use client'

import { useState } from 'react'
import { AppHero } from '../ui/ui-layout'
import { ClusterUiModal } from './cluster-ui'
import { ClusterUiTable } from './cluster-ui'

export default function ClusterFeature() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <AppHero title="Кластери" subtitle="Редагувати та вибрати кластери Solana">
        <ClusterUiModal show={showModal} hideModal={() => setShowModal(false)} />
        <button className="btn btn-xs lg:btn-md btn-primary" onClick={() => setShowModal(true)}>
          Додати Кластер
        </button>
      </AppHero>
      <ClusterUiTable />
    </div>
  )
}
