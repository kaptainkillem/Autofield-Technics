'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, LogOut, Clock } from 'lucide-react'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000  // 30 minutes
const WARNING_BEFORE_MS = 60 * 1000      // 1 minute warning

interface SessionTimeoutProviderProps {
  children: React.ReactNode
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [loggingOut, setLoggingOut] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (showWarning) {
      setShowWarning(false)
      setCountdown(60)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(60)
      let remaining = 60
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }
          handleLogout()
        }
      }, 1000)
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)
  }, [showWarning])

  const handleLogout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {}
    try {
      await supabase.auth.signOut()
    } catch {}
    router.push('/signin')
    router.refresh()
  }, [loggingOut, router])

  const handleKeepAlive = useCallback(() => {
    resetIdle()
  }, [resetIdle])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const

    const onActivity = () => {
      resetIdle()
    }

    events.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true })
    })

    resetIdle()

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, onActivity)
      })
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [resetIdle])

  return (
    <>
      {children}

      {showWarning && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-label="Session timeout warning"
        >
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={28} className="text-amber-600" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-grey-dark">Session Expiring</h2>
              <p className="text-sm text-grey mt-1">
                You have been inactive. Your session will expire in{' '}
                <span className="font-bold text-error">{countdown}s</span>.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-grey-light text-grey font-semibold text-sm hover:bg-grey-light/10 transition-colors disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                Log out
              </button>
              <button
                onClick={handleKeepAlive}
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Keep me logged in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
