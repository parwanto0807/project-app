import React from 'react'
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-sky-400 to-blue-900 p-4 overflow-x-hidden">
      {children}
    </div>

  )
}

export default AuthLayout
