'use client'

import { useEffect, useRef, useState } from 'react'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useLanguage } from '@/app/i18n/LanguageContext'

interface Props {
  subscribed: boolean
  onManageBilling: () => void
}

export default function AuthButton({ subscribed, onManageBilling }: Props) {
  const { t } = useLanguage()
  const { isSignedIn, user } = useUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (isSignedIn) {
    const initial = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? '?').toUpperCase()
    return (
      <div className="flex items-center gap-2">
        {subscribed && (
          <button
            onClick={onManageBilling}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-teal-500/15 border border-teal-500/20 text-teal-400 hover:bg-teal-500/25 transition-colors hidden sm:block"
          >
            {t('auth.pro')}
          </button>
        )}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[10px] font-bold text-sky-300 shrink-0">
              {initial}
            </span>
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 shadow-xl py-1 z-50" style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)' }}>
              {subscribed && (
                <button
                  onClick={() => { setOpen(false); onManageBilling() }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {t('auth.manageBilling')}
                </button>
              )}
              <SignOutButton>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {t('auth.signOut')}
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <SignInButton mode="modal">
      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 transition-colors whitespace-nowrap">
        {t('auth.signIn')}
      </button>
    </SignInButton>
  )
}
