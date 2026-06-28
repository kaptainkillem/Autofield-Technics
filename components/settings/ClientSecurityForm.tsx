'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, AlertTriangle, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientSecurityFormProps {
  userId: string
  email: string
}

export function ClientSecurityForm({ userId, email }: ClientSecurityFormProps) {
  const router = useRouter()
  const [resetLoading, setResetLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  async function handlePasswordReset() {
    setResetLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setResetLoading(false)

    if (error) {
      toast.error('Failed to send reset email. Please try again.')
      return
    }

    toast.success('Password reset link sent to your email!')
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account removal.')
      return
    }

    setDeleteLoading(true)

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete account.')
        setDeleteLoading(false)
        return
      }

      toast.success('Your account has been deleted.')
      router.push('/')
    } catch {
      toast.error('An unexpected error occurred. Please contact support.')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Password Reset */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-base">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-grey-dark">Change Password</h3>
            <p className="text-xs text-grey">
              We will send a secure reset link to your registered email.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 bg-grey-lightest rounded-base p-4">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-grey-medium" />
            <span className="text-sm text-grey-dark">{email}</span>
          </div>
          <Button
            size="sm"
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            {resetLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            <span>{resetLoading ? 'Sending...' : 'Send Reset Link'}</span>
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-error/20 rounded-base p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-error/10 text-error rounded-base">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-grey-dark">Danger Zone</h3>
            <p className="text-xs text-grey">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto flex items-center gap-2 border-error text-error hover:bg-error/5"
          >
            <Trash2 size={14} />
            Delete My Account
          </Button>
        ) : (
          <div className="flex flex-col gap-4 border border-error/20 rounded-base p-4 bg-error/5">
            <p className="text-sm text-grey-dark font-semibold">
              Are you absolutely sure?
            </p>
            <p className="text-xs text-grey">
              This will permanently delete your profile, vehicles, and all personal data from our system. Any past quotes will be anonymized. Type <strong>DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full rounded-base border border-error/30 bg-white py-2.5 px-3 text-sm focus:border-error focus:outline-none focus:ring-2 focus:ring-error/10 transition-colors text-grey-dark"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="px-4 py-2.5 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-base bg-error text-white text-sm font-bold hover:bg-error/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
