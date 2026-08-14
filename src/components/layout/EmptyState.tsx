import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/40 px-4 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Icon className="text-primary size-6" />
      </div>
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground max-w-xs text-sm">{description}</p>
      )}
    </div>
  )
}
