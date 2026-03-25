import { useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'

const WORKING_STALE_MS = 4500
const TIMER_INTERVAL_MS = 1200

export function useWorkingMonitor() {
  useEffect(() => {
    const timer = setInterval(() => {
      const { tabs } = useSessionStore.getState()
      const now = Date.now()
      let mutated = false
      const freshTabs = tabs.map((tab) => {
        if ((tab.status === 'running' || tab.status === 'connecting') && !tab.activeRequestId) {
          if (now - (tab.lastEventAt || 0) > WORKING_STALE_MS) {
            mutated = true
            return {
              ...tab,
              status: 'completed' as const,
              currentActivity: '',
            }
          }
        }
        return tab
      })

      if (mutated) {
        useSessionStore.setState({ tabs: freshTabs })
      }
    }, TIMER_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])
}
