'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { startCheckout } from './start-checkout'

/** Card buy control. Creates the invoice and opens the ZiniPay page. */
export function CheckoutButton(props: { packageCode: string }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Button
        type="button"
        className="font-bengali w-full"
        disabled={loading}
        onClick={() => {
          setLoading(true)
          setMsg('')
          startCheckout(props.packageCode, 'MONTH')
            .catch((e: unknown) => {
              setMsg(e instanceof Error ? e.message : 'চেকআউট ব্যর্থ হয়েছে')
            })
            .finally(() => setLoading(false))
        }}
      >
        {loading ? 'অপেক্ষা করুন…' : 'কিনুন'}
      </Button>
      {msg ? <p className="font-bengali text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  )
}
