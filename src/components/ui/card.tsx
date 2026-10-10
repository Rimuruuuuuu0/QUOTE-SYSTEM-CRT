import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-white/50 bg-white/45 backdrop-blur-[12px] shadow-[0_8px_30px_-12px_rgba(46,26,18,0.35)] dark:bg-slate-900/60 dark:border-white/10', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-medium', className)} {...props} />
)
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props} />
)
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('font-semibold', className)} {...props} />
)

export { Card, CardHeader, CardContent, CardTitle }
