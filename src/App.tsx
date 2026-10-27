import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { AuditPanel } from './components/AuditPanel'
import { MonetizationPanel } from './components/MonetizationPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { fetchLicense } from './services/license'
import type { Tab } from './components/types'

export default function App() {
  const [active, setActive] = useState<Tab>('dashboard')
  const [brandName, setBrandName] = useState('VRAV Tube Engine')

  useEffect(() => {
    fetchLicense().then(info => {
      if (info?.whiteLabel?.appName) setBrandName(info.whiteLabel.appName)
    })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={active} setActive={setActive} brandName={brandName} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {active === 'dashboard' && <Dashboard onStartAudit={() => setActive('audit')} />}
          {active === 'audit' && <AuditPanel />}
          {active === 'monetization' && <MonetizationPanel />}
          {active === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  )
}
