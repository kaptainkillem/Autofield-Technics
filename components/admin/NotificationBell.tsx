'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, Check, FileText, Calendar, MessageSquare, Star, X, Wrench } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: 'quote' | 'appointment' | 'lead' | 'review' | 'work_order'
  reference_id: string | null
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICONS = {
  quote: FileText,
  appointment: Calendar,
  lead: MessageSquare,
  review: Star,
  work_order: Wrench,
}

const TYPE_COLORS = {
  quote: 'text-primary bg-primary/10',
  appointment: 'text-green-600 bg-green-50',
  lead: 'text-amber-600 bg-amber-50',
  review: 'text-yellow-600 bg-yellow-50',
  work_order: 'text-blue-600 bg-blue-50',
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const bellRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
    }
    setLoading(false)
    return user
  }

  async function markAsRead(id: string) {
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  function getNotificationLink(n: Notification): string {
    switch (n.type) {
      case 'quote':
        return `/dashboard/admin/quotes`
      case 'appointment':
      case 'work_order':
        return `/dashboard/admin/jobs`
      case 'review':
        return `/dashboard/admin/reviews`
      default:
        return '/dashboard/admin'
    }
  }

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const user = await fetchNotifications()
      if (!user || cancelled) return

      if (cancelled) return

      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (cancelled) return
            const newNotif = payload.new as Notification
            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotif.id)
              if (exists) return prev
              return [newNotif, ...prev.slice(0, 9)]
            })
            if (!newNotif.is_read) {
              setUnreadCount((prev) => prev + 1)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (cancelled) return
            const updated = payload.new as Notification
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            )
            setUnreadCount((prev) => {
              if (updated.is_read) return Math.max(0, prev - 1)
              return prev
            })
          }
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-base hover:bg-grey-lightest transition-colors"
      >
        <Bell size={20} className="text-grey-dark" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-grey-medium/10 rounded-base shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-grey-light">
            <h3 className="text-sm font-bold text-grey-dark">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-grey">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-grey">
                <Bell size={24} className="mx-auto mb-2 text-grey-medium" />
                No notifications yet
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type]
                  return (
                    <Link
                      key={n.id}
                      href={getNotificationLink(n)}
                      onClick={() => {
                        markAsRead(n.id)
                        setOpen(false)
                      }}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-grey-lightest transition-colors border-b border-grey-light/50 ${
                        !n.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-base flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLORS[n.type]}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.is_read ? 'font-bold text-grey-dark' : 'text-grey-dark'}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-[11px] text-grey truncate">{n.message}</p>
                        )}
                        <p className="text-[10px] text-grey-medium mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
