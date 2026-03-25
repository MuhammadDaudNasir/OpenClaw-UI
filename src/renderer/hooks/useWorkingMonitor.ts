import { useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'

const WORKING_STALE_MS = 5000
const TIMER_INTERVAL_MS = 1000

export function useWorkingMonitor() {
  useEffect(() => {
    const timer = setInterval(() => {
      const { tabs } = useSessionStore.getState()
      const now = Date.now()
      let mutated = false
      const freshTabs = tabs.map((tab) => {
        if (tab.status === 'running' || tab.status === 'connecting') {
          const lastEventAge = now - (tab.lastEventAt || 0)
          const hasRunningTool = tab.messages.some((m) => m.role === 'tool' && m.toolStatus === 'running')
          const isStale = lastEventAge > WORKING_STALE_MS && !hasRunningTool

          if (isStale) {
            mutated = true
            return {
              ...tab,
              status: 'completed' as const,
              activeRequestId: null,
              currentActivity: '',
              permissionQueue: [],
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
