import { useEffect, useMemo, useState } from 'react'
import MealLogHeader from '../components/meal-log/MealLogHeader'
import { MealLogDateBar, MealLogHero } from '../components/meal-log/MealLogOverview'
import MealLogSections from '../components/meal-log/MealLogSections'
import DashboardShell from '../components/dashboard/DashboardShell'
import { foodService } from '../services/foodService'
import { mealLogAssistService } from '../services/mealLogAssistService'
import { mealLogService } from '../services/mealLogService'
import { sessionService } from '../services/sessionService'
import { waterLogService } from '../services/waterLogService'
import { useMealLogJournal } from '../hooks/useMealLogJournal'
import type { DashboardSummary } from '../types/health'
import type { MealLog, MealLogItem, MealType } from '../types/mealLog'
import type { UsdaFoodItem } from '../types/food'
import { shiftDateInputValue, toLocalDateInputValue } from '../utils/date'
import {
  normalizeQuery,
  searchLocalCurated,
  rankAndFilterFoods,
} from '../services/foodSearchEngine'

type MealSection = {
  key: MealType
  label: string
  icon: string
  emptyText: string
}

type DraftMealItem = Omit<MealLogItem, 'id'> & {
  id: string
  baseQuantity?: number
  baseCalories?: number
  baseProtein?: number
  baseFat?: number
  baseCarbs?: number
  baseFiber?: number
  baseSugar?: number
  baseSodium?: number
}
type MealModalMode = 'create' | 'edit' | 'copy'

const BASE_MEAL_SECTIONS: MealSection[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'B', emptyText: 'No breakfast items yet.' },
  { key: 'lunch', label: 'Lunch', icon: 'L', emptyText: 'No lunch items yet.' },
  { key: 'dinner', label: 'Dinner', icon: 'D', emptyText: 'No dinner items yet.' },
  { key: 'snack', label: 'Snack', icon: 'S', emptyText: 'No snacks yet.' },
] as const

const MEAL_TYPE_OPTIONS: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
] as const

function formatDateInputValue(date: Date) {
  return toLocalDateInputValue(date)
}

function formatDateLabel(dateValue: string) {
  const date = new Date(dateValue)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatGoalLabel(goalLabel: string | null | undefined) {
  switch (goalLabel) {
    case 'lose_weight':
      return 'Lose weight'
    case 'gain_weight':
      return 'Gain weight'
    case 'build_muscle':
      return 'Build muscle'
    case 'maintain':
      return 'Maintain'
    default:
      return goalLabel || '--'
  }
}

function getMealLabel(mealType: MealType) {
  if (mealType.startsWith('custom:')) {
    return mealType.slice('custom:'.length) || 'Custom'
  }

  return MEAL_TYPE_OPTIONS.find((item) => item.value === mealType)?.label ?? mealType
}

function buildDraftItem(item?: Partial<DraftMealItem>): DraftMealItem {
  return {
    id: item?.id ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    foodItemId: item?.foodItemId ?? null,
    quantity: item?.quantity ?? 1,
    unit: item?.unit ?? 'serving',
    calories: item?.calories ?? 0,
    protein: item?.protein ?? 0,
    fat: item?.fat ?? 0,
    carbs: item?.carbs ?? 0,
    fiber: item?.fiber ?? 0,
    sugar: item?.sugar ?? 0,
    sodium: item?.sodium ?? 0,
    itemType: item?.itemType ?? 'manual',
    itemName: item?.itemName ?? '',
    baseQuantity: item?.baseQuantity,
    baseCalories: item?.baseCalories,
    baseProtein: item?.baseProtein,
    baseFat: item?.baseFat,
    baseCarbs: item?.baseCarbs,
    baseFiber: item?.baseFiber,
    baseSugar: item?.baseSugar,
    baseSodium: item?.baseSodium,
  }
}

function scaleDraftItemQuantity(item: DraftMealItem, quantity: number): DraftMealItem {
  const baseQuantity = item.baseQuantity && item.baseQuantity > 0 ? item.baseQuantity : item.quantity || 1
  const ratio = quantity / baseQuantity

  return {
    ...item,
    quantity,
    calories: Number(((item.baseCalories ?? item.calories) * ratio).toFixed(2)),
    protein: Number(((item.baseProtein ?? item.protein) * ratio).toFixed(2)),
    fat: Number(((item.baseFat ?? item.fat) * ratio).toFixed(2)),
    carbs: Number(((item.baseCarbs ?? item.carbs) * ratio).toFixed(2)),
    fiber: Number(((item.baseFiber ?? item.fiber ?? 0) * ratio).toFixed(2)),
    sugar: Number(((item.baseSugar ?? item.sugar ?? 0) * ratio).toFixed(2)),
    sodium: Number(((item.baseSodium ?? item.sodium ?? 0) * ratio).toFixed(2)),
  }
}

function getSectionMealLogs(mealLogs: MealLog[], sectionKey: MealType) {
  return mealLogs.filter((mealLog) => mealLog.mealType === sectionKey)
}

function sumItems(items: Array<Pick<MealLogItem, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium'>>) {
  return items.reduce<{
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }>(
    (total, item) => ({
      calories: total.calories + (item.calories || 0),
      protein: total.protein + (item.protein || 0),
      carbs: total.carbs + (item.carbs || 0),
      fat: total.fat + (item.fat || 0),
      fiber: total.fiber + (item.fiber || 0),
      sugar: total.sugar + (item.sugar || 0),
      sodium: total.sodium + (item.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  )
}

function buildWarnings(summary: DashboardSummary | null, totals: ReturnType<typeof sumItems>) {
  const warnings: string[] = []

  if (summary) {
    if (summary.caloriesConsumed > summary.caloriesTarget) {
      warnings.push('Calories exceed today’s target.')
    }
    if (totals.protein < (summary.macroProgress.find((item) => item.label === 'Protein')?.target ?? 0) * 0.4) {
      warnings.push('Protein intake is still low for the day.')
    }
  }

  if (totals.sugar > 50) {
    warnings.push('Sugar is running high.')
  }
  if (totals.sodium > 2300) {
    warnings.push('Sodium exceeds the common daily limit.')
  }
  if (totals.fat > 80) {
    warnings.push('Fat intake is getting high.')
  }

  return warnings
}

function mapSearchFoodToDraftItem(food: UsdaFoodItem): DraftMealItem {
  return buildDraftItem({
    foodItemId: null,
    quantity: 1,
    unit: 'serving',
    itemType: 'food-search',
    itemName: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  })
}

function MealLogPage() {
  const [selectedDate, setSelectedDate] = useState(() => formatDateInputValue(new Date()))
  const { summary, mealLogs, allMealLogs, isLoading, errorMessage, setErrorMessage, refreshMealLogs } = useMealLogJournal(selectedDate)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMealId, setEditingMealId] = useState<number | null>(null)
  const [modalMode, setModalMode] = useState<MealModalMode>('create')
  const [draftMealType, setDraftMealType] = useState<MealType>('breakfast')
  const [customMealName, setCustomMealName] = useState('')
  const [draftItems, setDraftItems] = useState<DraftMealItem[]>([buildDraftItem()])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<UsdaFoodItem[]>([])
  const [saveMessage, setSaveMessage] = useState('')
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false)
  const [waterAmountMl, setWaterAmountMl] = useState('250')

  useEffect(() => {
    let cancelled = false

    async function searchFoods() {
      if (!searchKeyword.trim()) {
        setSearchResults([])
        return
      }

      try {
        const apiQuery = normalizeQuery(searchKeyword)
        const localResults = searchLocalCurated(searchKeyword)
        const response = await foodService.searchSmartFoods({ keyword: apiQuery })
        
        if (!cancelled) {
          const cleanedApiResults = rankAndFilterFoods(response.data.data, apiQuery)
          const seenIds = new Set(localResults.map((f) => f.fdcId))
          const uniqueApiResults = cleanedApiResults.filter((f) => !seenIds.has(f.fdcId))
          const combined = [...localResults, ...uniqueApiResults].slice(0, 6)
          setSearchResults(combined)
        }
      } catch {
        if (!cancelled) {
          setSearchResults([])
        }
      }
    }

    void searchFoods()
    return () => {
      cancelled = true
    }
  }, [searchKeyword])

  const dynamicCustomSections = useMemo(() => {
    const customTypes = Array.from(new Set(mealLogs.map((mealLog) => mealLog.mealType).filter((mealType) => mealType.startsWith('custom:'))))
    return customTypes.map((mealType) => ({
      key: mealType as MealType,
      label: getMealLabel(mealType as MealType),
      icon: 'C',
      emptyText: 'No items in this custom meal type yet.',
    }))
  }, [mealLogs])

  const groupedMeals = useMemo(() => {
    return [...BASE_MEAL_SECTIONS, ...dynamicCustomSections].map((section) => {
      const logs = getSectionMealLogs(mealLogs, section.key)
      const totalCalories = logs.reduce((sum, mealLog) => sum + mealLog.totalCalories, 0)
      return { ...section, logs, totalCalories }
    })
  }, [dynamicCustomSections, mealLogs])

  const dailyDetailTotals = useMemo(() => sumItems(mealLogs.flatMap((mealLog) => mealLog.items)), [mealLogs])
  const dailyWarnings = useMemo(() => buildWarnings(summary, dailyDetailTotals), [dailyDetailTotals, summary])
  const caloriesProgress =
    summary && summary.caloriesTarget > 0
      ? `${Math.min(100, Math.round((summary.caloriesConsumed / summary.caloriesTarget) * 100))}%`
      : '0%'
  const dateLabel = selectedDate === formatDateInputValue(new Date()) ? 'Today' : formatDateLabel(selectedDate)
  const draftTotals = useMemo(() => sumItems(draftItems), [draftItems])
  function resetDraft(mealType: MealType = 'breakfast') {
    setModalMode('create')
    setEditingMealId(null)
    setDraftMealType(mealType)
    setCustomMealName(mealType.startsWith('custom:') ? getMealLabel(mealType) : '')
    setDraftItems([buildDraftItem()])
    setSearchKeyword('')
    setSearchResults([])
    setSaveMessage('')
  }

  function openCreateModal(mealType: MealType) {
    resetDraft(mealType)
    setModalMode('create')
    setIsModalOpen(true)
  }

  function openEditModal(mealLog: MealLog) {
    setModalMode('edit')
    setEditingMealId(mealLog.id)
    setDraftMealType(mealLog.mealType)
    setCustomMealName(mealLog.mealType.startsWith('custom:') ? getMealLabel(mealLog.mealType) : '')
    setDraftItems(mealLog.items.map((item) => buildDraftItem({
      ...item,
      id: `edit-${item.id}`,
      baseQuantity: item.quantity,
      baseCalories: item.calories,
      baseProtein: item.protein,
      baseFat: item.fat,
      baseCarbs: item.carbs,
      baseFiber: item.fiber ?? 0,
      baseSugar: item.sugar ?? 0,
      baseSodium: item.sodium ?? 0,
    })))
    setIsModalOpen(true)
    setSaveMessage('')
  }

  function openCopyModal(mealLog: MealLog) {
    setModalMode('copy')
    setEditingMealId(null)
    setDraftMealType(mealLog.mealType)
    setCustomMealName(mealLog.mealType.startsWith('custom:') ? getMealLabel(mealLog.mealType) : '')
    setDraftItems(mealLog.items.map((item) => buildDraftItem({ ...item, id: `copy-${item.id}` })))
    setSearchKeyword('')
    setSearchResults([])
    setSaveMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    resetDraft()
  }

  function updateDraftItem(id: string, patch: Partial<DraftMealItem>) {
    setDraftItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function updateDraftItemQuantity(id: string, nextQuantity: number) {
    const quantity = Math.max(0.1, Number(nextQuantity.toFixed(1)))
    setDraftItems((current) => current.map((item) => {
      if (item.id !== id) {
        return item
      }

      return modalMode === 'edit' ? scaleDraftItemQuantity(item, quantity) : { ...item, quantity }
    }))
  }

  function addDraftItem(item?: Partial<DraftMealItem>) {
    setDraftItems((current) => [...current, buildDraftItem(item)])
  }

  async function saveWaterLog() {
    const user = sessionService.getUser()
    const activeProfileId = sessionService.getActiveProfileId()
    const amountMl = Number(waterAmountMl)

    if (!user || !activeProfileId) {
      setErrorMessage('No active profile found.')
      return
    }

    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setErrorMessage('Water amount must be greater than 0.')
      return
    }

    waterLogService.addEntry(user.id, activeProfileId, selectedDate, amountMl)
    setIsWaterModalOpen(false)
    setWaterAmountMl('250')
    setErrorMessage('')
    await refreshMealLogs()
  }

  async function saveDraftMeal() {
    const activeProfileId = sessionService.getActiveProfileId()
    if (!activeProfileId) {
      setErrorMessage('No active profile found.')
      return
    }

    const mealType = draftMealType === 'custom:' ? (`custom:${customMealName.trim() || 'custom'}` as MealType) : draftMealType
    const payloadItems = draftItems
      .filter((item) => item.itemName.trim())
      .map((item) => ({
        foodItemId: item.foodItemId ?? undefined,
        quantity: item.quantity,
        unit: item.unit,
        itemType: item.itemType,
        itemName: item.itemName,
        calories: item.calories,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
        fiber: item.fiber,
        sugar: item.sugar,
        sodium: item.sodium,
      }))

    if (payloadItems.length === 0) {
      setErrorMessage('Add at least one item before saving.')
      return
    }

    try {
      if (modalMode === 'edit' && editingMealId) {
        await mealLogService.updateMealLog(editingMealId, {
          mealType,
          mealDate: selectedDate,
          items: payloadItems,
        })
      } else {
        await mealLogService.createMealLog({
          profileId: activeProfileId,
          mealType,
          mealDate: selectedDate,
          items: payloadItems,
        })
      }

      mealLogAssistService.recordRecentItems(
        payloadItems.map((item) => ({
          foodItemId: item.foodItemId ?? null,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories ?? 0,
          protein: item.protein ?? 0,
          fat: item.fat ?? 0,
          carbs: item.carbs ?? 0,
          fiber: item.fiber ?? 0,
          sugar: item.sugar ?? 0,
          sodium: item.sodium ?? 0,
          itemType: item.itemType ?? 'manual',
          itemName: item.itemName ?? '',
        })),
      )
      setSaveMessage('Meal log saved.')
      await refreshMealLogs()
      closeModal()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save meal log.')
    }
  }

  async function handleDeleteMeal(mealLogId: number) {
    try {
      await mealLogService.removeMealLog(mealLogId)
      await refreshMealLogs()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete meal log.')
    }
  }

  async function copyYesterdayMeals() {
    const yesterdayMeals = mealLogAssistService.getYesterdayMeals(allMealLogs, selectedDate)
    const activeProfileId = sessionService.getActiveProfileId()
    if (!activeProfileId || yesterdayMeals.length === 0) {
      return
    }

    for (const meal of yesterdayMeals) {
      await mealLogService.createMealLog({
        profileId: activeProfileId,
        mealType: meal.mealType,
        mealDate: selectedDate,
        items: meal.items.map((item) => ({
          foodItemId: item.foodItemId ?? undefined,
          quantity: item.quantity,
          unit: item.unit,
          itemType: item.itemType,
          itemName: item.itemName,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          fiber: item.fiber,
          sugar: item.sugar,
          sodium: item.sodium,
        })),
      })
    }

    await refreshMealLogs()
  }

  return (
    <DashboardShell
      activeItem="meal-log"
      title="Meal Log"
      subtitle={summary ? `${summary.greetingName} | ${formatGoalLabel(summary.goalLabel)}` : 'Track nutrition day by day'}
      action={
        <MealLogHeader>
          <button className="dashboard-journal-button" type="button" onClick={() => openCreateModal('breakfast')}>
            Add Meal
          </button>
          <button className="meal-journal__secondary-action" type="button" onClick={() => setIsWaterModalOpen(true)}>
            Add Water
          </button>
          <button className="meal-journal__secondary-action" type="button" onClick={() => void copyYesterdayMeals()}>
            Copy Yesterday
          </button>
        </MealLogHeader>
      }
    >
      <section className="meal-journal">
        <MealLogDateBar
          dateLabel={dateLabel}
          selectedDate={selectedDate}
          onPreviousDay={() => setSelectedDate((current) => shiftDateInputValue(current, -1))}
          onNextDay={() => setSelectedDate((current) => shiftDateInputValue(current, 1))}
          onDateChange={setSelectedDate}
        />

        <MealLogHero
          summary={summary}
          caloriesProgress={caloriesProgress}
          dailyDetailTotals={dailyDetailTotals}
          dailyWarnings={dailyWarnings}
        />

        {isLoading ? <p className="meal-journal__feedback">Loading meal log...</p> : null}
        {!isLoading && errorMessage ? <p className="meal-journal__feedback">{errorMessage}</p> : null}

        {!isLoading && !errorMessage ? (
          <MealLogSections
            groupedMeals={groupedMeals}
            onAddMeal={openCreateModal}
            onEditMeal={openEditModal}
            onCopyMeal={openCopyModal}
            onDeleteMeal={(mealLogId) => void handleDeleteMeal(mealLogId)}
            getMealLabel={getMealLabel}
          />
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="food-detail-modal" role="dialog" aria-modal="true">
          <div className="food-detail-modal__overlay" onClick={closeModal} />
          <section className={modalMode === 'edit' ? 'food-detail-modal__panel meal-log-modal meal-log-modal--edit' : 'food-detail-modal__panel meal-log-modal'}>
            <header className="food-detail-modal__header">
              <div>
                <h2>{modalMode === 'edit' ? 'Change Quantity' : modalMode === 'copy' ? 'Copy Meal' : 'Add Meal Log'}</h2>
                <p>{modalMode === 'edit' ? 'Adjust meal type and serving quantity.' : modalMode === 'copy' ? 'Copy this meal into another meal slot for the same day.' : 'Log meals from search only.'}</p>
              </div>
              <button className="food-detail-modal__close" type="button" onClick={closeModal}>x</button>
            </header>

            <div className="meal-log-modal__grid">
              <section className={modalMode === 'edit' ? 'meal-log-modal__form meal-log-modal__form--compact' : 'meal-log-modal__form'}>
                <div className="goal-management__grid">
                  <label className="profile-modal__field">
                    <span>{modalMode === 'copy' ? 'Copy to meal type' : 'Meal type'}</span>
                    <select value={draftMealType.startsWith('custom:') ? 'custom:' : draftMealType} onChange={(event) => setDraftMealType(event.target.value as MealType)}>
                      {MEAL_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      {modalMode === 'edit' && draftMealType.startsWith('custom:') ? <option value="custom:">{customMealName || 'Custom meal type'}</option> : null}
                      {modalMode !== 'edit' ? <option value="custom:">Custom meal type</option> : null}
                    </select>
                  </label>
                  {draftMealType.startsWith('custom:') && modalMode !== 'edit' ? (
                    <label className="profile-modal__field">
                      <span>Custom name</span>
                      <input value={customMealName} onChange={(event) => setCustomMealName(event.target.value)} placeholder="Example: Late supper" />
                    </label>
                  ) : null}
                </div>

                {modalMode === 'create' ? (
                  <>
                    <label className="profile-modal__field">
                      <span>Search food</span>
                  <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Search and tap to add" />
                </label>
                {searchResults.length > 0 ? (
                  <div className="meal-log-modal__search-results">
                    {searchResults.map((food) => (
                      <button key={food.fdcId} type="button" onClick={() => addDraftItem(mapSearchFoodToDraftItem(food))}>
                        {food.name} | {food.calories} kcal
                      </button>
                    ))}
                  </div>
                ) : null}                  </>
                ) : null}

                {modalMode === 'edit' ? (
                  <div className="meal-log-modal__edit-controls">
                    {draftItems.map((item) => (
                      <div className="meal-log-modal__quantity-card" key={item.id}>
                        <span className="meal-log-modal__control-label">Quantity</span>
                        <div className="meal-log-modal__quantity-stepper meal-log-modal__quantity-stepper--large" aria-label="Quantity controls">
                          <button type="button" onClick={() => updateDraftItemQuantity(item.id, item.quantity - 1)}>-</button>
                          <strong>{Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1)}</strong>
                          <button type="button" onClick={() => updateDraftItemQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <span className="meal-log-modal__unit-text">Unit: {item.unit ?? 'serving'}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {modalMode === 'copy' ? (
                  <div className="meal-log-modal__draft-list">
                    {draftItems.map((item) => (
                      <div className="meal-log-modal__draft-item" key={item.id}>
                        <div className="meal-log-modal__draft-item-header">
                          <div className="meal-log-modal__draft-item-copy">
                            <strong>{item.itemName.trim() || `Item ${draftItems.findIndex((draftItem) => draftItem.id === item.id) + 1}`}</strong>
                            <span>Review this copied item before saving it into another meal slot.</span>
                          </div>
                        </div>

                        <div className="meal-log-modal__draft-grid meal-log-modal__draft-grid--identity">
                          <label className="profile-modal__field">
                            <span>Food</span>
                            <input value={item.itemName} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Unit</span>
                            <input value={item.unit ?? 'serving'} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Quantity</span>
                            <input type="number" min="0.1" step="0.1" value={item.quantity} onChange={(event) => updateDraftItem(item.id, { quantity: Number(event.target.value) || 0 })} />
                          </label>
                        </div>

                        <div className="meal-log-modal__draft-grid meal-log-modal__draft-grid--nutrition">
                          <label className="profile-modal__field">
                            <span>Calories</span>
                            <input type="number" min="0" step="0.1" value={item.calories} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Protein</span>
                            <input type="number" min="0" step="0.1" value={item.protein} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Carbs</span>
                            <input type="number" min="0" step="0.1" value={item.carbs} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Fat</span>
                            <input type="number" min="0" step="0.1" value={item.fat} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Fiber</span>
                            <input type="number" min="0" step="0.1" value={item.fiber ?? 0} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Sugar</span>
                            <input type="number" min="0" step="0.1" value={item.sugar ?? 0} readOnly disabled />
                          </label>
                          <label className="profile-modal__field">
                            <span>Sodium (mg)</span>
                            <input type="number" min="0" step="1" value={item.sodium ?? 0} readOnly disabled />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <aside className="meal-log-modal__side">
                <div className="dashboard-section-subtitle">Draft Totals</div>
                <div className="dashboard-insights-list">
                  <div><span>Calories</span><strong>{Math.round(draftTotals.calories)} kcal</strong></div>
                  <div><span>Protein</span><strong>{Math.round(draftTotals.protein)} g</strong></div>
                  <div><span>Carbs</span><strong>{Math.round(draftTotals.carbs)} g</strong></div>
                  <div><span>Fat</span><strong>{Math.round(draftTotals.fat)} g</strong></div>
                  <div><span>Fiber</span><strong>{Math.round(draftTotals.fiber)} g</strong></div>
                  <div><span>Sugar</span><strong>{Math.round(draftTotals.sugar)} g</strong></div>
                  <div><span>Sodium</span><strong>{Math.round(draftTotals.sodium)} mg</strong></div>
                </div>
                {saveMessage ? <div className="goal-management__success">{saveMessage}</div> : null}

                <div className="food-detail-modal__actions">
                  <button className="food-detail-modal__ghost" type="button" onClick={closeModal}>Cancel</button>
                  <button className="food-detail-modal__primary" type="button" onClick={() => void saveDraftMeal()}>
                    {modalMode === 'edit' ? 'Update Quantity' : modalMode === 'copy' ? 'Copy Meal' : 'Save Meal'}
                  </button>
                </div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      {isWaterModalOpen ? (
        <div className="food-detail-modal" role="dialog" aria-modal="true">
          <div className="food-detail-modal__overlay" onClick={() => setIsWaterModalOpen(false)} />
          <section className="food-detail-modal__panel">
            <header className="food-detail-modal__header">
              <div>
                <h2>Add Water</h2>
                <p>Log the amount of water you drank and sync it back to the dashboard.</p>
              </div>
              <button className="food-detail-modal__close" type="button" onClick={() => setIsWaterModalOpen(false)}>x</button>
            </header>

            <label className="profile-modal__field">
              <span>Amount (ml)</span>
              <input type="number" min="50" step="50" value={waterAmountMl} onChange={(event) => setWaterAmountMl(event.target.value)} />
            </label>

            <div className="meal-log-modal__quick-actions">
              <button className="meal-journal__secondary-action" type="button" onClick={() => setWaterAmountMl('200')}>200 ml</button>
              <button className="meal-journal__secondary-action" type="button" onClick={() => setWaterAmountMl('250')}>250 ml</button>
              <button className="meal-journal__secondary-action" type="button" onClick={() => setWaterAmountMl('500')}>500 ml</button>
            </div>

            <div className="food-detail-modal__actions">
              <button className="food-detail-modal__ghost" type="button" onClick={() => setIsWaterModalOpen(false)}>Cancel</button>
              <button className="food-detail-modal__primary" type="button" onClick={() => void saveWaterLog()}>
                Save Water
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  )
}

export default MealLogPage
