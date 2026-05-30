import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import { foodService } from '../services/foodService'
import { mealLogService } from '../services/mealLogService'
import { profileBootstrapService } from '../services/profileBootstrapService'
import { sessionService } from '../services/sessionService'
import type { MealLog } from '../types/mealLog'
import type { UsdaFoodItem } from '../types/food'

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein' },
] as const

const MEAL_TYPE_OPTIONS: Array<{ value: MealLog['mealType']; label: string }> = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

type SortKey = (typeof SORT_OPTIONS)[number]['key']

const EMPTY_FOOD: UsdaFoodItem = {
  fdcId: 0,
  name: '',
  dataType: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  servingSize: '',
  category: '',
  source: 'USDA',
  imageUrl: '',
  fatSecretFoodId: '',
  matchedKeyword: '',
  searchSource: '',
}

function roundNutritionValue(value: number) {
  return Math.round(value * 10) / 10
}

function getServingWeight(food: UsdaFoodItem | null) {
  if (!food?.servingSize) {
    return 100
  }

  const match = food.servingSize.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) {
    return 100
  }

  const parsed = Number(match[1].replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100
}

function FoodSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [foods, setFoods] = useState<UsdaFoodItem[]>([])
  const [selectedFood, setSelectedFood] = useState<UsdaFoodItem | null>(null)
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null)
  const [amountGrams, setAmountGrams] = useState('100')
  const [mealType, setMealType] = useState<MealLog['mealType']>('breakfast')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSavingMealLog, setIsSavingMealLog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [detailErrorMessage, setDetailErrorMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const normalizedKeyword = keyword.trim()

    async function loadFoods() {
      if (!normalizedKeyword) {
        setFoods([])
        setSelectedFood(null)
        setSelectedFoodId(null)
        setErrorMessage('')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await foodService.searchSmartFoods({ keyword: normalizedKeyword })
        const nextFoods = response.data.data

        if (!cancelled) {
          setFoods(nextFoods)

          if (nextFoods.length === 0) {
            setSelectedFood(null)
            setSelectedFoodId(null)
          }
        }
      } catch (error) {
        if (!cancelled) {
          setFoods([])
          setSelectedFood(null)
          setSelectedFoodId(null)
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load foods.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadFoods()

    return () => {
      cancelled = true
    }
  }, [keyword])

  async function handleSelectFood(food: UsdaFoodItem) {
    setSelectedFoodId(food.fdcId)
    setDetailErrorMessage('')
    setSaveMessage('')
    setIsLoadingDetail(true)

    try {
      const response = await foodService.getUsdaFoodById(food.fdcId)
      const nextFood = {
        ...response.data.data,
        imageUrl: food.imageUrl,
        fatSecretFoodId: food.fatSecretFoodId,
        matchedKeyword: food.matchedKeyword,
        searchSource: food.searchSource,
      }

      setSelectedFood(nextFood)
      setAmountGrams(String(getServingWeight(nextFood)))
      setMealType('breakfast')
    } catch (error) {
      setSelectedFood(null)
      setDetailErrorMessage(error instanceof Error ? error.message : 'Unable to load food details.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  function handleCloseDetailModal() {
    setSelectedFood(null)
    setSelectedFoodId(null)
    setDetailErrorMessage('')
    setSaveMessage('')
    setIsLoadingDetail(false)
    setIsSavingMealLog(false)
  }

  async function handleAddToMealLog() {
    if (!selectedFood) {
      return
    }

    const activeProfile = await profileBootstrapService.resolveExistingProfile()
    const activeProfileId = activeProfile?.id ?? sessionService.getActiveProfileId()

    if (!activeProfileId) {
      setDetailErrorMessage('No active profile found for saving this meal log.')
      return
    }

    if (!computedNutrition || appliedAmount <= 0) {
      setDetailErrorMessage('Invalid serving amount.')
      return
    }

    setIsSavingMealLog(true)
    setDetailErrorMessage('')
    setSaveMessage('')

    try {
      await mealLogService.createMealLog({
        profileId: activeProfileId,
        mealType,
        items: [
          {
            quantity: appliedAmount,
            itemType: 'usda',
            itemName: selectedFood.name,
            calories: computedNutrition.calories,
            protein: computedNutrition.protein,
            carbs: computedNutrition.carbs,
            fat: computedNutrition.fat,
          },
        ],
      })

      const mealLabel = MEAL_TYPE_OPTIONS.find((item) => item.value === mealType)?.label.toLowerCase() ?? 'meal log'
      setSaveMessage(`Added ${selectedFood.name} to ${mealLabel}.`)
    } catch (error) {
      setDetailErrorMessage(error instanceof Error ? error.message : 'Unable to save to meal log.')
    } finally {
      setIsSavingMealLog(false)
    }
  }

  const sortedFoods = useMemo(() => {
    const nextFoods = [...foods]

    nextFoods.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'en')
      }

      return b[sortBy] - a[sortBy]
    })

    return nextFoods
  }, [foods, sortBy])

  const lowestCalorie = sortedFoods.reduce(
    (lowest, food) => (food.calories < lowest.calories ? food : lowest),
    sortedFoods[0] ?? EMPTY_FOOD,
  )
  const highestProtein = sortedFoods.reduce(
    (highest, food) => (food.protein > highest.protein ? food : highest),
    sortedFoods[0] ?? EMPTY_FOOD,
  )
  const uniqueGroups = new Set(sortedFoods.map((food) => food.category).filter(Boolean)).size

  const servingWeight = getServingWeight(selectedFood)
  const enteredAmount = Number(amountGrams)
  const appliedAmount = Number.isFinite(enteredAmount) && enteredAmount > 0 ? enteredAmount : 0
  const nutritionMultiplier =
    selectedFood && servingWeight > 0 && appliedAmount > 0 ? appliedAmount / servingWeight : 0

  const computedNutrition = selectedFood
    ? {
        calories: roundNutritionValue(selectedFood.calories * nutritionMultiplier),
        protein: roundNutritionValue(selectedFood.protein * nutritionMultiplier),
        carbs: roundNutritionValue(selectedFood.carbs * nutritionMultiplier),
        fat: roundNutritionValue(selectedFood.fat * nutritionMultiplier),
      }
    : null

  return (
    <DashboardShell
      activeItem="food-search"
      title="Food Search"
      subtitle="Find your favorite foods and log them accurately with verified USDA nutrition data."
    >
      <section className="food-search-panel">
        <div className="food-search-toolbar">
          <label className="food-search-input">
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search Vietnamese or English foods... e.g. bread, rice, banh mi"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          <div className="food-search-meta">
            <div className="food-search-sort">
              <span>Sort by:</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  className={`food-search-sort__button${sortBy === option.key ? ' food-search-sort__button--active' : ''}`}
                  type="button"
                  onClick={() => setSortBy(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p>{sortedFoods.length} results</p>
          </div>
        </div>

        <section className="food-search-stats">
          <article className="food-search-stats__card">
            <strong>{sortedFoods.length}</strong>
            <span>Search results</span>
          </article>
          <article className="food-search-stats__card food-search-stats__card--purple">
            <strong>{uniqueGroups}</strong>
            <span>Food groups</span>
          </article>
          <article className="food-search-stats__card food-search-stats__card--green">
            <strong>{lowestCalorie.calories} kcal</strong>
            <span>Lowest calories</span>
          </article>
          <article className="food-search-stats__card food-search-stats__card--blue">
            <strong>{highestProtein.protein}g</strong>
            <span>Highest protein</span>
          </article>
        </section>

        {!keyword.trim() ? <p>Enter a Vietnamese or English keyword to search for food.</p> : null}
        {isLoading ? <p>Searching USDA + FatSecret...</p> : null}
        {!isLoading && errorMessage ? <p>{errorMessage}</p> : null}
        {!isLoading && !errorMessage && keyword.trim() && sortedFoods.length === 0 ? (
          <p>No matching results found from the current search sources.</p>
        ) : null}

        {!isLoading && !errorMessage && sortedFoods.length > 0 ? (
          <section className="food-search-grid">
            {sortedFoods.map((food) => (
              <article
                className={`food-item-card${selectedFoodId === food.fdcId ? ' food-item-card--selected' : ''}`}
                key={food.fdcId}
              >
                <button className="food-item-card__action" type="button" onClick={() => void handleSelectFood(food)}>
                  {food.imageUrl ? (
                    <div className="food-item-card__image-wrap">
                      <img className="food-item-card__image" src={food.imageUrl} alt={food.name} loading="lazy" />
                    </div>
                  ) : null}

                  <div className="food-item-card__header">
                    <div>
                      <h3>{food.name}</h3>
                      <p>
                        {food.category || 'Uncategorized'}
                        {food.servingSize ? ` · ${food.servingSize}` : ''}
                      </p>
                    </div>
                    <strong>
                      {food.calories}
                      <span>kcal</span>
                    </strong>
                  </div>

                  <div className="food-item-card__macros">
                    <div>
                      <strong>{food.protein}g</strong>
                      <span>Protein</span>
                    </div>
                    <div>
                      <strong>{food.carbs}g</strong>
                      <span>Carb</span>
                    </div>
                    <div>
                      <strong>{food.fat}g</strong>
                      <span>Fat</span>
                    </div>
                  </div>

                  <p className="food-item-card__vitamins">
                    Source: {food.searchSource || food.source || 'USDA'} · FDC ID: {food.fdcId}
                  </p>
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {selectedFoodId !== null ? (
          <div className="food-detail-modal" role="dialog" aria-modal="true">
            <div className="food-detail-modal__overlay" onClick={handleCloseDetailModal} />
            <section className="food-detail-modal__panel">
              <header className="food-detail-modal__header">
                <div>
                  <h2>Add to Meal Log</h2>
                  <p>Enter the amount and choose a meal to save this item to your nutrition log.</p>
                </div>
                <button className="food-detail-modal__close" type="button" onClick={handleCloseDetailModal}>
                  ×
                </button>
              </header>

              {isLoadingDetail ? <p>Loading nutrition details...</p> : null}
              {!isLoadingDetail && detailErrorMessage ? <p>{detailErrorMessage}</p> : null}
              {!isLoadingDetail && !detailErrorMessage && saveMessage ? (
                <p className="food-detail-modal__success">{saveMessage}</p>
              ) : null}

              {!isLoadingDetail && !detailErrorMessage && selectedFood ? (
                <article className="food-item-card food-item-card--selected">
                  {selectedFood.imageUrl ? (
                    <div className="food-item-card__image-wrap">
                      <img className="food-item-card__image" src={selectedFood.imageUrl} alt={selectedFood.name} />
                    </div>
                  ) : null}

                  <div className="food-item-card__header">
                    <div>
                      <h3>{selectedFood.name}</h3>
                      <p>
                        {selectedFood.category || 'Uncategorized'}
                        {selectedFood.servingSize ? ` · ${selectedFood.servingSize}` : ''}
                      </p>
                    </div>
                    <strong>
                      {computedNutrition?.calories ?? selectedFood.calories}
                      <span>kcal</span>
                    </strong>
                  </div>

                  <div className="food-amount-card">
                    <label className="food-amount-card__field">
                      <span>Amount</span>
                      <div className="food-amount-card__input">
                        <input
                          type="number"
                          min="1"
                          step="0.1"
                          value={amountGrams}
                          onChange={(event) => setAmountGrams(event.target.value)}
                        />
                        <span>g</span>
                      </div>
                    </label>

                    <label className="food-amount-card__field">
                      <span>Meal</span>
                      <select
                        className="food-amount-card__select"
                        value={mealType}
                        onChange={(event) => setMealType(event.target.value as MealLog['mealType'])}
                      >
                        {MEAL_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <p className="food-amount-card__hint">
                      Base values: {selectedFood.calories} kcal / {servingWeight}g
                    </p>
                  </div>

                  <div className="food-item-card__macros">
                    <div>
                      <strong>{computedNutrition?.protein ?? selectedFood.protein}g</strong>
                      <span>Protein</span>
                    </div>
                    <div>
                      <strong>{computedNutrition?.carbs ?? selectedFood.carbs}g</strong>
                      <span>Carb</span>
                    </div>
                    <div>
                      <strong>{computedNutrition?.fat ?? selectedFood.fat}g</strong>
                      <span>Fat</span>
                    </div>
                  </div>

                  <div className="food-detail-modal__actions">
                    <button className="food-detail-modal__ghost" type="button" onClick={handleCloseDetailModal}>
                      Close
                    </button>
                    <button
                      className="food-detail-modal__primary"
                      type="button"
                      onClick={() => void handleAddToMealLog()}
                      disabled={isSavingMealLog || appliedAmount <= 0}
                    >
                      {isSavingMealLog ? 'Saving...' : 'Add to Meal Log'}
                    </button>
                  </div>

                  <p className="food-item-card__vitamins">
                    Search source: {selectedFood.searchSource || selectedFood.source || 'USDA'}
                  </p>
                  <p className="food-item-card__vitamins">
                    Nutrition source: USDA · FDC ID: {selectedFood.fdcId}
                  </p>
                </article>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  )
}

export default FoodSearchPage
