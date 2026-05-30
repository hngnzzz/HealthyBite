import type { ReactNode } from 'react'

interface MealLogHeaderProps {
  children: ReactNode
}

function MealLogHeader({ children }: MealLogHeaderProps) {
  return <div className="meal-journal__top-actions">{children}</div>
}

export default MealLogHeader
