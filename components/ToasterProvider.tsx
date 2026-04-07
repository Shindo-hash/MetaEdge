'use client'

import { Toaster } from 'sonner'

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: 'rgba(10, 15, 30, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: '13px',
        },
      }}
    />
  )
}
