'use client'

import type { ReactNode } from 'react'

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      {props.children}
    </div>
  )
}

export function Warn(props: { children: ReactNode }) {
  return <div className="tools-warn">{props.children}</div>
}

export function Result(props: { children: ReactNode }) {
  return <div className="tools-result">{props.children}</div>
}

export function NumInput(props: {
  value: string
  onChange: (v: string) => void
  id?: string
}) {
  return (
    <input
      id={props.id}
      className="input"
      inputMode="decimal"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  )
}
