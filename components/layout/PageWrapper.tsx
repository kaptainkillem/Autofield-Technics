import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`flex flex-col gap-8 p-4 md:p-6 max-w-[1600px] mx-auto w-full mt-4 ${className}`}>
      {children}
    </div>
  )
}
