import type { MealLog, MealType } from '../../types/mealLog'

interface GroupedMealSection {
  key: MealType
  label: string
  icon: string
  emptyText: string
  logs: MealLog[]
  totalCalories: number
}

interface MealLogSectionsProps {
  groupedMeals: GroupedMealSection[]
  onAddMeal: (mealType: MealType) => void
  onEditMeal: (mealLog: MealLog) => void
  onCopyMeal: (mealLog: MealLog) => void
  onDeleteMeal: (mealLogId: number) => void
  getMealLabel: (mealType: MealType) => string
}

function MealLogSections({
  groupedMeals,
  onAddMeal,
  onEditMeal,
  onCopyMeal,
  onDeleteMeal,
  getMealLabel,
}: MealLogSectionsProps) {
  return (
    <section className="meal-journal__sections">
      {groupedMeals.map((section) => (
        <article className="meal-journal__section-card" key={section.key}>
          <header className="meal-journal__section-header">
            <div className="meal-journal__section-title">
              <div className={`meal-journal__section-icon meal-journal__section-icon--${section.key.replace(':', '-')}`}>{section.icon}</div>
              <div>
                <h3>{section.label}</h3>
                <p>{section.logs.length} items | {Math.round(section.totalCalories)} kcal</p>
              </div>
            </div>

            <button className="meal-journal__add-button" type="button" onClick={() => onAddMeal(section.key)}>
              + Add
            </button>
          </header>

          {section.logs.length > 0 ? (
            <div className="meal-journal__entries">
              {section.logs.map((mealLog) => (
                <article className="meal-journal__entry" key={mealLog.id}>
                  <div className="meal-journal__entry-copy">
                    <strong>{mealLog.items.map((item) => item.itemName).slice(0, 2).join(', ') || getMealLabel(mealLog.mealType)}</strong>
                    <p>
                      x{mealLog.items.length} | P:{Math.round(mealLog.totalProtein)}g | C:{Math.round(mealLog.totalCarbs)}g | F:{Math.round(mealLog.totalFat)}g
                    </p>
                  </div>

                  <div className="meal-journal__entry-calories">
                    <strong>{Math.round(mealLog.totalCalories)}</strong>
                    <span>kcal</span>
                  </div>

                  <div className="meal-journal__entry-actions">
                    <button type="button" onClick={() => onEditMeal(mealLog)}>Change Quantity</button>
                    <button type="button" onClick={() => onCopyMeal(mealLog)}>Copy To...</button>
                    <button type="button" onClick={() => onDeleteMeal(mealLog.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="meal-journal__empty">{section.emptyText}</p>
          )}
        </article>
      ))}
    </section>
  )
}

export default MealLogSections
