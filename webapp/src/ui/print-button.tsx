'use client'

export function PrintButton() {
  return (
    <button className="btn ghost" type="button" onClick={() => window.print()}>
      প্রিন্ট
    </button>
  )
}
