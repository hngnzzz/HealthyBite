import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import { goalManagementService } from '../services/goalManagementService'
import { profileBootstrapService } from '../services/profileBootstrapService'
import { profileService } from '../services/profileService'
import { sessionService } from '../services/sessionService'
import { weightLogService } from '../services/weightLogService'
import type { GoalDietPlanKey, GoalMacroSplit, GoalManagementType, GoalPlan, GoalStrictness } from '../types/goal'
import type { Profile, UpdateProfilePayload } from '../types/profile'
import type { WeightLog } from '../types/weightLog'
import { shiftDateInputValue, toLocalDateInputValue } from '../utils/date'

type GoalFormState = {
  type: GoalManagementType
  dietPlanKey: GoalDietPlanKey
  customMacroSplit: GoalMacroSplit
  startDate: string
  targetWeightKg: string
  targetDate: string
  plannedRateKgPerWeek: string
  strictness: GoalStrictness
}

type WeightLogFormState = {
  weightKg: string
  loggedDate: string
}

const GOAL_TYPES: Array<{ value: GoalManagementType; label: string }> = [
  { value: 'lose-weight', label: 'Lose weight' },
  { value: 'gain-weight', label: 'Gain weight' },
  { value: 'maintain-weight', label: 'Maintain weight' },
  { value: 'body-recomposition', label: 'Body recomposition' },
] as const

const DEFAULT_FORM: GoalFormState = {
  type: 'lose-weight',
  dietPlanKey: 'high-protein',
  customMacroSplit: {
    proteinPercent: 30,
    carbPercent: 40,
    fatPercent: 30,
  },
  startDate: toLocalDateInputValue(new Date()),
  targetWeightKg: '',
  targetDate: '',
  plannedRateKgPerWeek: '0.5',
  strictness: 'Balanced',
}

const DEFAULT_WEIGHT_LOG_FORM: WeightLogFormState = {
  weightKg: '',
  loggedDate: toLocalDateInputValue(new Date()),
}

const GOAL_DIET_OPTIONS: Record<GoalManagementType, Array<{ key: GoalDietPlanKey; label: string }>> = {
  'lose-weight': [
    { key: 'high-protein', label: 'High-protein' },
    { key: 'keto', label: 'Keto' },
    { key: 'mediterranean', label: 'Mediterranean' },
    { key: 'balanced', label: 'Balanced' },
    { key: 'custom', label: 'Custom' },
  ],
  'gain-weight': [
    { key: 'clean-bulk', label: 'Clean bulk' },
    { key: 'balanced', label: 'Balanced' },
    { key: 'custom', label: 'Custom' },
  ],
  'maintain-weight': [
    { key: 'balanced', label: 'Balanced' },
    { key: 'mediterranean', label: 'Mediterranean' },
    { key: 'custom', label: 'Custom' },
  ],
  'body-recomposition': [
    { key: 'high-protein-maintenance', label: 'High Protein Maintenance Diet' },
    { key: 'body-recomposition', label: 'Body Recomposition Diet' },
    { key: 'macro-tracking', label: 'Macro Tracking Diet' },
    { key: 'flexible-dieting', label: 'Flexible Dieting' },
    { key: 'mediterranean-high-protein', label: 'Mediterranean High Protein' },
    { key: 'low-carb-high-protein', label: 'Low Carb High Protein' },
    { key: 'custom', label: 'Custom' },
  ],
}

function isWeightChangeGoal(type: GoalManagementType) {
  return type === 'lose-weight' || type === 'gain-weight' || type === 'body-recomposition'
}

function isWeightAwareGoal(type: GoalManagementType) {
  return isWeightChangeGoal(type) || type === 'maintain-weight'
}

function formatWeight(value: number) {
  return `${value.toFixed(1)} kg`
}

function formatSignedWeight(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)} kg`
  }

  return `${value.toFixed(1)} kg`
}

function formatDisplayDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatWeeklyRateOption(rate: number) {
  const dailyDelta = Math.round((rate * 7700) / 7)
  return `${rate.toFixed(2)} kg/week (~${dailyDelta} kcal/day)`
}

function getDefaultTargetDate() {
  return shiftDateInputValue(toLocalDateInputValue(new Date()), 84)
}

function mapProfileToGoalType(profile: Profile): GoalManagementType {
  const goal = profile.goal.trim().toLowerCase()
  const dietPlan = profile.dietPlan.trim().toLowerCase()

  if (goal === 'lose weight') {
    return 'lose-weight'
  }

  if (goal === 'gain weight') {
    return 'gain-weight'
  }

  if (goal === 'build muscle') {
    return 'body-recomposition'
  }

  if (
    dietPlan === 'lower-carb'
    || dietPlan === 'high-protein-cut'
    || dietPlan === 'lean-bulk'
    || dietPlan === 'high-protein-maintenance'
    || dietPlan === 'body-recomposition'
    || dietPlan === 'macro-tracking'
    || dietPlan === 'flexible-dieting'
    || dietPlan === 'mediterranean-high-protein'
    || dietPlan === 'low-carb-high-protein'
  ) {
    return 'body-recomposition'
  }

  return 'maintain-weight'
}

function mapGoalTypeToProfileGoal(type: GoalManagementType) {
  switch (type) {
    case 'lose-weight':
      return 'lose_weight'
    case 'gain-weight':
      return 'gain_weight'
    case 'body-recomposition':
      return 'build_muscle'
    default:
      return 'maintain'
  }
}

function getDefaultDietPlanKey(type: GoalManagementType): GoalDietPlanKey {
  return GOAL_DIET_OPTIONS[type][0]?.key ?? 'balanced'
}

function parseCustomDietPlan(profileDietPlan: string): GoalMacroSplit | null {
  const matched = profileDietPlan.trim().toLowerCase().match(/^custom:p(\d+)-c(\d+)-f(\d+)$/)
  if (!matched) {
    return null
  }

  const proteinPercent = Number(matched[1])
  const carbPercent = Number(matched[2])
  const fatPercent = Number(matched[3])

  if (proteinPercent + carbPercent + fatPercent !== 100) {
    return null
  }

  return { proteinPercent, carbPercent, fatPercent }
}

function mapProfileDietPlanToGoalDietPlan(profileDietPlan: string, goalType: GoalManagementType): GoalDietPlanKey {
  const normalized = profileDietPlan.trim().toLowerCase()
  const customMacroSplit = parseCustomDietPlan(profileDietPlan)

  const mapped =
    normalized === 'mediterranean' || normalized === 'plant-forward'
      ? 'mediterranean'
      : normalized === 'lower-carb'
        ? 'keto'
        : normalized === 'high-protein-cut'
          ? 'high-protein'
          : normalized === 'high-protein-maintenance'
            ? 'high-protein-maintenance'
          : normalized === 'body-recomposition'
            ? 'body-recomposition'
          : normalized === 'macro-tracking'
            ? 'macro-tracking'
          : normalized === 'flexible-dieting'
            ? 'flexible-dieting'
          : normalized === 'mediterranean-high-protein'
            ? 'mediterranean-high-protein'
          : normalized === 'low-carb-high-protein'
            ? 'low-carb-high-protein'
          : customMacroSplit
            ? 'custom'
          : normalized === 'clean-bulk'
            ? 'clean-bulk'
            : normalized === 'lean-bulk' || normalized === 'performance'
              ? 'body-recomposition'
              : 'balanced'

  return GOAL_DIET_OPTIONS[goalType].some((option) => option.key === mapped) ? mapped : getDefaultDietPlanKey(goalType)
}

function mapGoalDietPlanToProfileDietPlan(dietPlanKey: GoalDietPlanKey) {
  switch (dietPlanKey) {
    case 'balanced':
      return 'balanced-maintain'
    case 'mediterranean':
      return 'mediterranean'
    case 'keto':
      return 'lower-carb'
    case 'high-protein':
      return 'high-protein-cut'
    case 'clean-bulk':
      return 'clean-bulk'
    case 'high-protein-maintenance':
      return 'high-protein-maintenance'
    case 'body-recomposition':
      return 'body-recomposition'
    case 'macro-tracking':
      return 'macro-tracking'
    case 'flexible-dieting':
      return 'flexible-dieting'
    case 'mediterranean-high-protein':
      return 'mediterranean-high-protein'
    case 'low-carb-high-protein':
      return 'low-carb-high-protein'
    case 'custom':
      return 'balanced-maintain'
    default:
      return 'balanced-maintain'
  }
}

function mapGoalDietPlanToProfileDietPlanWithMacros(dietPlanKey: GoalDietPlanKey, customMacroSplit: GoalMacroSplit) {
  if (dietPlanKey !== 'custom') {
    return mapGoalDietPlanToProfileDietPlan(dietPlanKey)
  }

  return `custom:p${customMacroSplit.proteinPercent}-c${customMacroSplit.carbPercent}-f${customMacroSplit.fatPercent}`
}

function mapProfileGenderToApi(value: string) {
  return value.trim().toLowerCase() === 'female' ? 'female' : 'male'
}

function mapProfileActivityLevelToApi(value: string) {
  switch (value.trim().toLowerCase()) {
    case 'sedentary':
      return 'sedentary'
    case 'lightly active':
      return 'light'
    case 'very active':
      return 'active'
    case 'extra active':
      return 'very_active'
    default:
      return 'moderate'
  }
}

function buildProfilePlanPayload(profile: Profile, plan: GoalPlan): UpdateProfilePayload {
  return {
    name: profile.name,
    nickname: profile.nickname,
    age: profile.age,
    birthDate: profile.birthDate,
    gender: mapProfileGenderToApi(profile.gender),
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    targetWeightKg: isWeightAwareGoal(plan.type) ? plan.targetWeightKg : (profile.targetWeightKg ?? profile.weightKg),
    goal: mapGoalTypeToProfileGoal(plan.type),
    activityLevel: mapProfileActivityLevelToApi(profile.activityLevel),
    dietPlan: mapGoalDietPlanToProfileDietPlanWithMacros(plan.dietPlanKey, plan.customMacroSplit ?? DEFAULT_FORM.customMacroSplit),
    targetCalories: plan.dailyTargets.calories,
    targetProtein: plan.dailyTargets.proteinGrams,
    targetCarbs: plan.dailyTargets.carbGrams,
    targetFat: plan.dailyTargets.fatGrams,
    waterGoalMl: plan.dailyTargets.waterMl,
    healthStatus: profile.healthStatus,
    favoriteFoods: profile.favoriteFoods,
    nutritionConstraints: profile.nutritionConstraints,
    measurementUnit: profile.measurementUnit,
  }
}


function buildFormFromProfile(profile: Profile): GoalFormState {
  const type = mapProfileToGoalType(profile)
  const customMacroSplit = parseCustomDietPlan(profile.dietPlan) ?? DEFAULT_FORM.customMacroSplit

  return {
    ...DEFAULT_FORM,
    type,
    dietPlanKey: mapProfileDietPlanToGoalDietPlan(profile.dietPlan, type),
    customMacroSplit,
    startDate: toLocalDateInputValue(new Date()),
    targetWeightKg:
      profile.targetWeightKg != null ? String(profile.targetWeightKg) : String(profile.weightKg),
    targetDate: getDefaultTargetDate(),
    plannedRateKgPerWeek: isWeightChangeGoal(type) ? DEFAULT_FORM.plannedRateKgPerWeek : '0',
  }
}

function buildFormFromPlan(plan: GoalPlan): GoalFormState {
  return {
    type: plan.type,
    dietPlanKey: plan.dietPlanKey,
    customMacroSplit: plan.customMacroSplit ?? DEFAULT_FORM.customMacroSplit,
    startDate: plan.startDate,
    targetWeightKg: String(plan.targetWeightKg),
    targetDate: plan.targetDate,
    plannedRateKgPerWeek: String(plan.plannedRateKgPerWeek),
    strictness: plan.strictness,
  }
}

function buildFormFromProfileAndPlan(profile: Profile, plan: GoalPlan | null): GoalFormState {
  const profileType = mapProfileToGoalType(profile)

  if (!plan || plan.type !== profileType) {
    return buildFormFromProfile(profile)
  }

  return {
    ...buildFormFromPlan(plan),
    type: profileType,
    dietPlanKey: plan.dietPlanKey,
    customMacroSplit: plan.customMacroSplit ?? parseCustomDietPlan(profile.dietPlan) ?? DEFAULT_FORM.customMacroSplit,
    startDate: plan.startDate,
    targetWeightKg:
      isWeightAwareGoal(profileType)
        ? String(profile.targetWeightKg ?? plan.targetWeightKg ?? profile.weightKg)
        : String(profile.weightKg),
    plannedRateKgPerWeek: isWeightChangeGoal(profileType) ? String(plan.plannedRateKgPerWeek) : '0',
  }
}

function getDefaultWeeklyRate(type: GoalManagementType) {
  switch (type) {
    case 'lose-weight':
      return '0.5'
    case 'gain-weight':
      return '0.25'
    case 'body-recomposition':
      return '0.2'
    default:
      return '0'
  }
}

function getSuggestedTargetWeight(profile: Profile, type: GoalManagementType) {
  if (type === 'maintain-weight') {
    return String(profile.weightKg)
  }

  if (type === 'lose-weight') {
    return String(Math.max(Number((profile.weightKg - 3).toFixed(1)), 1))
  }

  if (type === 'gain-weight') {
    return String(Number((profile.weightKg + 2).toFixed(1)))
  }

  if (type === 'body-recomposition') {
    return String(Number(profile.weightKg.toFixed(1)))
  }

  return String(profile.weightKg)
}

function getValidationMessage(form: GoalFormState, profile: Profile | null) {
  const targetWeight = Number(form.targetWeightKg)
  const rate = Number(form.plannedRateKgPerWeek)
  const isWeightGoal = isWeightAwareGoal(form.type)
  const isWeightChange = isWeightChangeGoal(form.type)

  if (!profile) {
    return 'Active profile is required.'
  }
  if (!form.targetDate) {
    return 'Target date is required.'
  }
  if (form.dietPlanKey === 'custom') {
    const totalMacroPercent = form.customMacroSplit.proteinPercent + form.customMacroSplit.carbPercent + form.customMacroSplit.fatPercent
    const hasInvalidPercent = [form.customMacroSplit.proteinPercent, form.customMacroSplit.carbPercent, form.customMacroSplit.fatPercent]
      .some((value) => Number.isNaN(value) || value < 0 || value > 100)

    if (hasInvalidPercent) {
      return 'Custom macro percentages must stay between 0 and 100.'
    }

    if (totalMacroPercent !== 100) {
      return 'Protein, carbs, and fat must total exactly 100%.'
    }
  }
  if (isWeightGoal && (!targetWeight || targetWeight <= 0)) {
    return 'Target weight must be greater than 0.'
  }
  if (isWeightChange && (!rate || rate <= 0)) {
    return 'Planned weekly change must be greater than 0.'
  }
  if (form.type === 'lose-weight' && targetWeight >= profile.weightKg) {
    return 'For weight loss, target weight should be lower than current weight.'
  }
  if (form.type === 'gain-weight' && targetWeight <= profile.weightKg) {
    return 'For gain-focused goals, target weight should be higher than current weight.'
  }
  if (form.type === 'body-recomposition' && Math.abs(targetWeight - profile.weightKg) > 3) {
    return 'For body recomposition, target weight should stay close to current weight.'
  }
  if (form.type === 'maintain-weight' && Math.abs(targetWeight - profile.weightKg) > 2) {
    return 'Maintain weight should stay close to current weight.'
  }

  return ''
}

function getProgressLabels(type: GoalManagementType) {
  if (type === 'maintain-weight') {
    return {
      currentTargetLabel: 'Current / Stable baseline',
      actualLabel: 'Weight drift',
      plannedLabel: 'Planned change',
      varianceLabel: 'Drift variance',
    }
  }

  if (!isWeightAwareGoal(type)) {
    return {
      currentTargetLabel: 'Current weight / Baseline',
      actualLabel: 'Weight change',
      plannedLabel: 'Planned change',
      varianceLabel: 'Variance',
    }
  }

  return {
    currentTargetLabel: 'Current / Target',
    actualLabel: 'Actual progress',
    plannedLabel: 'Planned progress',
    varianceLabel: 'Variance',
  }
}

function getWeightLogValidationMessage(form: WeightLogFormState) {
  const weight = Number(form.weightKg)
  const today = toLocalDateInputValue(new Date())

  if (!form.weightKg.trim()) {
    return 'Enter your weight before logging.'
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    return 'Weight must be greater than 0 kg.'
  }

  if (weight > 500) {
    return 'Weight must be 500 kg or less.'
  }

  if (!form.loggedDate) {
    return 'Choose the date you measured your weight.'
  }

  if (form.loggedDate > today) {
    return 'Logged date cannot be in the future.'
  }

  return ''
}

function buildWeightLogRows(logs: WeightLog[]) {
  return logs.map((log, index) => {
    const previousOlderLog = logs[index + 1]
    const changeKg = previousOlderLog ? Number((log.weightKg - previousOlderLog.weightKg).toFixed(1)) : null

    return {
      ...log,
      changeKg,
    }
  })
}

function getWeightInsights(logs: WeightLog[]) {
  if (logs.length < 2) {
    return null
  }

  const newest = logs[0]
  const oldest = logs[logs.length - 1]
  const totalChangeKg = Number((newest.weightKg - oldest.weightKg).toFixed(1))
  const elapsedDays = Math.max(1, Math.abs((new Date(newest.loggedDate).getTime() - new Date(oldest.loggedDate).getTime()) / 86400000))
  const averageWeeklyProgressKg = Number(((totalChangeKg / elapsedDays) * 7).toFixed(1))

  return {
    totalChangeKg,
    averageWeeklyProgressKg,
  }
}

function GoalManagementPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goalPlan, setGoalPlan] = useState<GoalPlan | null>(null)
  const [form, setForm] = useState<GoalFormState>(DEFAULT_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isWeightLogLoading, setIsWeightLogLoading] = useState(false)
  const [deletingWeightLogId, setDeletingWeightLogId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [weightLogForm, setWeightLogForm] = useState<WeightLogFormState>(DEFAULT_WEIGHT_LOG_FORM)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [weightLogPendingDelete, setWeightLogPendingDelete] = useState<WeightLog | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadGoalManagement() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const user = sessionService.getUser()
        if (!user) {
          throw new Error('You are not signed in.')
        }

        const activeProfile = await profileBootstrapService.resolveExistingProfile()
        const activeProfileId = activeProfile?.id ?? sessionService.getActiveProfileId()

        if (!activeProfileId) {
          throw new Error('No active profile found.')
        }

        const response = await profileService.getProfileById(activeProfileId)
        const weightLogsResponse = await weightLogService.getByProfile(activeProfileId)
        const loadedProfile = response.data.data
        const storedPlan = goalManagementService.refreshPlan(user.id, loadedProfile)

        if (!cancelled) {
          setProfile(loadedProfile)
          setGoalPlan(storedPlan)
          setWeightLogs(weightLogsResponse.data.data)
          setForm(buildFormFromProfileAndPlan(loadedProfile, storedPlan))
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load goal management.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadGoalManagement()

    return () => {
      cancelled = true
    }
  }, [])

  const validationMessage = useMemo(() => getValidationMessage(form, profile), [form, profile])
  const weightLogValidationMessage = useMemo(() => getWeightLogValidationMessage(weightLogForm), [weightLogForm])
  const isWeightGoal = isWeightAwareGoal(form.type)
  const isWeightChange = isWeightChangeGoal(form.type)
  const weightLogRows = useMemo(() => buildWeightLogRows(weightLogs), [weightLogs])
  const weightInsights = useMemo(() => getWeightInsights(weightLogs), [weightLogs])

  const previewPlan = useMemo(() => {
    const user = sessionService.getUser()
    if (!user || !profile || validationMessage) {
      return goalPlan
    }

    return goalManagementService.buildPlan(profile, {
      type: form.type,
      dietPlanKey: form.dietPlanKey,
      customMacroSplit: form.dietPlanKey === 'custom' ? form.customMacroSplit : null,
      startDate: form.startDate,
      targetWeightKg: Number(form.targetWeightKg),
      targetDate: form.targetDate,
      plannedRateKgPerWeek: Number(form.plannedRateKgPerWeek),
      strictness: form.strictness,
    }, goalPlan, { recordHistory: false })
  }, [form, goalPlan, profile, validationMessage])
  const progressLabels = getProgressLabels(previewPlan?.type ?? form.type)

  function updateForm<K extends keyof GoalFormState>(field: K, value: GoalFormState[K]) {
    setSuccessMessage('')
    setToastMessage(null)
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateWeightLogForm<K extends keyof WeightLogFormState>(field: K, value: WeightLogFormState[K]) {
    setToastMessage(null)
    setErrorMessage('')
    setWeightLogForm((current) => ({ ...current, [field]: value }))
  }

  function updateGoalType(type: GoalManagementType) {
    if (!profile) {
      return
    }

    setSuccessMessage('')
    setForm((current) => ({
      ...current,
      type,
      dietPlanKey: getDefaultDietPlanKey(type),
      customMacroSplit: current.customMacroSplit,
      targetWeightKg: isWeightAwareGoal(type) ? getSuggestedTargetWeight(profile, type) : String(profile.weightKg),
      plannedRateKgPerWeek: getDefaultWeeklyRate(type),
    }))
  }

  function updateCustomMacroSplit(field: keyof GoalMacroSplit, value: string) {
    setSuccessMessage('')
    setForm((current) => ({
      ...current,
      customMacroSplit: {
        ...current.customMacroSplit,
        [field]: Number(value),
      },
    }))
  }

  async function handleSaveGoal() {
    const user = sessionService.getUser()
    if (!user || !profile) {
      setErrorMessage('Active user and profile are required.')
      return
    }

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    const saved = goalManagementService.savePlan(user.id, profile, {
      type: form.type,
      dietPlanKey: form.dietPlanKey,
      customMacroSplit: form.dietPlanKey === 'custom' ? form.customMacroSplit : null,
      startDate: form.startDate,
      targetWeightKg: Number(form.targetWeightKg),
      targetDate: form.targetDate,
      plannedRateKgPerWeek: Number(form.plannedRateKgPerWeek),
      strictness: form.strictness,
    })

    try {
      await profileService.updateProfile(profile.id, buildProfilePlanPayload(profile, saved))
      const refreshedProfile = (await profileService.getProfileById(profile.id)).data.data

      setProfile(refreshedProfile)
      setGoalPlan(saved)
      setForm(buildFormFromProfileAndPlan(refreshedProfile, saved))
      setSuccessMessage('Goal plan saved and synced to the active profile.')
      setErrorMessage('')
    } catch (error) {
      setGoalPlan(saved)
      setErrorMessage(error instanceof Error ? error.message : 'Goal saved locally, but profile sync failed.')
    }
  }

  async function reloadWeightData(activeProfileId: number, userId: number) {
    const [profileResponse, weightLogsResponse] = await Promise.all([
      profileService.getProfileById(activeProfileId),
      weightLogService.getByProfile(activeProfileId),
    ])
    const refreshedProfile = profileResponse.data.data
    const refreshedPlan = goalManagementService.refreshPlan(userId, refreshedProfile)

    setProfile(refreshedProfile)
    setGoalPlan(refreshedPlan)
    setForm(buildFormFromProfileAndPlan(refreshedProfile, refreshedPlan))
    setWeightLogs(weightLogsResponse.data.data)
  }

  async function handleLogWeight() {
    const user = sessionService.getUser()
    if (!user || !profile) {
      setErrorMessage('Active user and profile are required.')
      setToastMessage({ type: 'error', text: 'Active user and profile are required.' })
      return
    }

    if (weightLogValidationMessage) {
      setErrorMessage(weightLogValidationMessage)
      setToastMessage({ type: 'error', text: weightLogValidationMessage })
      return
    }

    setIsWeightLogLoading(true)
    setErrorMessage('')
    setToastMessage(null)

    try {
      await weightLogService.create(profile.id, {
        weightKg: Number(weightLogForm.weightKg),
        loggedDate: weightLogForm.loggedDate,
      })
      await reloadWeightData(profile.id, user.id)
      setWeightLogForm(DEFAULT_WEIGHT_LOG_FORM)
      setToastMessage({ type: 'success', text: 'Weight logged successfully.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log weight right now.'
      setErrorMessage(message)
      setToastMessage({ type: 'error', text: message })
    } finally {
      setIsWeightLogLoading(false)
    }
  }

  async function handleDeleteWeightLog() {
    const user = sessionService.getUser()
    if (!user || !profile || !weightLogPendingDelete) {
      setWeightLogPendingDelete(null)
      return
    }

    setDeletingWeightLogId(weightLogPendingDelete.id)
    setToastMessage(null)
    setErrorMessage('')

    try {
      await weightLogService.remove(weightLogPendingDelete.id)
      await reloadWeightData(profile.id, user.id)
      setWeightLogPendingDelete(null)
      setToastMessage({ type: 'success', text: 'Weight log deleted successfully.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete this weight log.'
      setErrorMessage(message)
      setToastMessage({ type: 'error', text: message })
    } finally {
      setDeletingWeightLogId(null)
    }
  }

  const summaryCards = previewPlan
    ? [
        {
          label: 'Goal Type',
          value: GOAL_TYPES.find((item) => item.value === previewPlan.type)?.label ?? '--',
          note: `${previewPlan.strictness} plan | ${previewPlan.status}`,
          accent: 'orange',
        },
        {
          label: 'Daily Calories',
          value: String(previewPlan.dailyTargets.calories),
          note: 'kcal target per day',
          accent: 'blue',
        },
        {
          label: 'Completion',
          value: formatPercent(previewPlan.progress.completionPercent),
          note: previewPlan.progress.onTrackLikelihood,
          accent: 'green',
        },
        {
          label: 'Plan Window',
          value: previewPlan.targetDate || '--',
          note: `${previewPlan.startDate} -> ${previewPlan.targetDate}`,
          accent: 'pink',
        },
      ]
    : []

  return (
    <DashboardShell
      activeItem="goal-management"
      title="Goal Management"
      subtitle="Use the active profile goal to build and tune its detailed plan"
      action={
        <button className="dashboard-journal-button" type="button" onClick={() => void handleSaveGoal()} disabled={!!validationMessage || !profile}>
          Save Goal
        </button>
      }
    >
      <section className="dashboard-summary-grid">
        {summaryCards.map((card) => (
          <article className="dashboard-card dashboard-card--summary" key={card.label}>
            <div className={`dashboard-card__badge dashboard-card__badge--${card.accent}`} />
            <p className="dashboard-card__label">{card.label}</p>
            <div className="dashboard-card__value-row">
              <strong>{card.value}</strong>
            </div>
            <p className="dashboard-card__note">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-content-grid goal-management__content-grid">
        <article className="dashboard-card dashboard-card--nutrition goal-management__panel">
          <div className="dashboard-section-header">
            <h3>Plans</h3>
          </div>

          {isLoading ? <p>Loading goal setup...</p> : null}
          {errorMessage ? <div className="profile-modal__warning">{errorMessage}</div> : null}
          {successMessage ? <div className="goal-management__success">{successMessage}</div> : null}

          {!isLoading && profile ? (
            <div className="goal-management__form">
              <div className="goal-management__options">
                {GOAL_TYPES.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    className={`goals-option${form.type === goal.value ? ' goals-option--selected' : ''}`}
                    onClick={() => updateGoalType(goal.value)}
                  >
                    <span className="goals-option__content">
                      <span className="goals-option__title">{goal.label}</span>
                    </span>
                    <span className="goals-option__check" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="dashboard-overview-block">
                <div className="dashboard-section-subtitle">Active Goal From Profile</div>
                <div className="dashboard-insights-list">
                  <div><span>Start date</span><strong>{form.startDate}</strong></div>
                  <div><span>Goal</span><strong>{GOAL_TYPES.find((item) => item.value === form.type)?.label ?? '--'}</strong></div>
                  <div><span>Profile target weight</span><strong>{formatWeight(profile.targetWeightKg ?? profile.weightKg)}</strong></div>
                  <div><span>Diet plan</span><strong>{previewPlan?.dailyTargets.dietPlanLabel ?? GOAL_DIET_OPTIONS[form.type].find((option) => option.key === form.dietPlanKey)?.label ?? '--'}</strong></div>
                  <div><span>Macro split</span><strong>{previewPlan ? `${previewPlan.dailyTargets.macroSplit.proteinPercent}% / ${previewPlan.dailyTargets.macroSplit.carbPercent}% / ${previewPlan.dailyTargets.macroSplit.fatPercent}%` : `${form.customMacroSplit.proteinPercent}% / ${form.customMacroSplit.carbPercent}% / ${form.customMacroSplit.fatPercent}%`}</strong></div>
                  <div><span>Activity level</span><strong>{profile.activityLevel || '--'}</strong></div>
                </div>
                <div className="goal-management__options">
                  {GOAL_DIET_OPTIONS[form.type].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`goals-option${form.dietPlanKey === option.key ? ' goals-option--selected' : ''}`}
                      onClick={() => updateForm('dietPlanKey', option.key)}
                    >
                      <span className="goals-option__content">
                        <span className="goals-option__title">{option.label}</span>
                      </span>
                      <span className="goals-option__check" aria-hidden="true" />
                    </button>
                  ))}
                </div>

                {form.dietPlanKey === 'custom' ? (
                  <div className="goal-management__grid">
                    <label className="profile-modal__field goal-management__field">
                      <span>Protein (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={form.customMacroSplit.proteinPercent}
                        onChange={(event) => updateCustomMacroSplit('proteinPercent', event.target.value)}
                      />
                    </label>
                    <label className="profile-modal__field goal-management__field">
                      <span>Carbs (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={form.customMacroSplit.carbPercent}
                        onChange={(event) => updateCustomMacroSplit('carbPercent', event.target.value)}
                      />
                    </label>
                    <label className="profile-modal__field goal-management__field">
                      <span>Fat (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={form.customMacroSplit.fatPercent}
                        onChange={(event) => updateCustomMacroSplit('fatPercent', event.target.value)}
                      />
                    </label>
                    <div className="profile-modal__field goal-management__field">
                      <span>Total</span>
                      <strong>{form.customMacroSplit.proteinPercent + form.customMacroSplit.carbPercent + form.customMacroSplit.fatPercent}%</strong>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="goal-management__grid">
                <label className="profile-modal__field goal-management__field">
                  <span>Start date</span>
                  <input type="date" value={form.startDate} onChange={(event) => updateForm('startDate', event.target.value)} />
                </label>
                <label className="profile-modal__field goal-management__field">
                  <span>Target weight (kg)</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={form.targetWeightKg}
                    disabled={!isWeightGoal}
                    onChange={(event) => updateForm('targetWeightKg', event.target.value)}
                  />
                </label>
                <label className="profile-modal__field goal-management__field">
                  <span>Target date</span>
                  <input type="date" value={form.targetDate} onChange={(event) => updateForm('targetDate', event.target.value)} />
                </label>
                <label className="profile-modal__field goal-management__field">
                  <span>Desired weekly change (kg)</span>
                  <select value={form.plannedRateKgPerWeek} disabled={!isWeightChange} onChange={(event) => updateForm('plannedRateKgPerWeek', event.target.value)}>
                    <option value="0.2">{formatWeeklyRateOption(0.2)}</option>
                    <option value="0.25">{formatWeeklyRateOption(0.25)}</option>
                    <option value="0.5">{formatWeeklyRateOption(0.5)}</option>
                    <option value="0.75">{formatWeeklyRateOption(0.75)}</option>
                    <option value="1">{formatWeeklyRateOption(1)}</option>
                    <option value="1.25">{formatWeeklyRateOption(1.25)}</option>
                  </select>
                </label>
                <label className="profile-modal__field goal-management__field">
                  <span>Plan strictness</span>
                  <select value={form.strictness} onChange={(event) => updateForm('strictness', event.target.value as GoalStrictness)}>
                    <option value="Flexible">Flexible</option>
                    <option value="Balanced">Balanced</option>
                    <option value="Strict">Strict</option>
                  </select>
                </label>
              </div>

              {!isWeightGoal ? (
                <p className="profile-modal__hint">
                  This goal does not rely on target body weight, so weight-change inputs are locked to your current profile.
                </p>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="dashboard-card dashboard-card--meals goal-management__panel">
          <div className="dashboard-section-header">
            <h3>Targets, Progress, and History</h3>
          </div>

          {!isLoading && previewPlan ? (
            <>
              <div className="dashboard-overview-grid">
                <div className="dashboard-overview-block">
                  <div className="dashboard-section-subtitle">Daily Targets</div>
                  <div className="dashboard-insights-list">
                    <div><span>Calories</span><strong>{previewPlan.dailyTargets.calories} kcal</strong></div>
                    <div><span>Protein</span><strong>{previewPlan.dailyTargets.proteinGrams} g</strong></div>
                    <div><span>Carbs</span><strong>{previewPlan.dailyTargets.carbGrams} g</strong></div>
                    <div><span>Fat</span><strong>{previewPlan.dailyTargets.fatGrams} g</strong></div>
                    <div><span>Water</span><strong>{previewPlan.dailyTargets.waterMl} ml</strong></div>
                    <div><span>Meals / day</span><strong>{previewPlan.dailyTargets.mealsPerDay}</strong></div>
                    <div><span>Diet plan</span><strong>{previewPlan.dailyTargets.dietPlanLabel}</strong></div>
                    <div><span>Macro split</span><strong>{`${previewPlan.dailyTargets.macroSplit.proteinPercent}% / ${previewPlan.dailyTargets.macroSplit.carbPercent}% / ${previewPlan.dailyTargets.macroSplit.fatPercent}%`}</strong></div>
                    <div><span>Steps</span><strong>{previewPlan.dailyTargets.stepsTarget ?? '--'}</strong></div>
                  </div>
                </div>

                <div className="dashboard-overview-block">
                  <div className="dashboard-section-subtitle">Progress Tracking</div>
                  <div className="dashboard-insights-list">
                    <div><span>Start date</span><strong>{previewPlan.progress.startDate}</strong></div>
                    <div><span>Status</span><strong>{previewPlan.status}</strong></div>
                    <div><span>{progressLabels.currentTargetLabel}</span><strong>{formatWeight(previewPlan.progress.currentWeightKg)} / {formatWeight(previewPlan.progress.targetWeightKg)}</strong></div>
                    <div><span>{progressLabels.actualLabel}</span><strong>{previewPlan.progress.actualProgressKg.toFixed(1)} kg</strong></div>
                    <div><span>{progressLabels.plannedLabel}</span><strong>{previewPlan.progress.plannedProgressKg.toFixed(1)} kg</strong></div>
                    <div><span>{progressLabels.varianceLabel}</span><strong>{previewPlan.progress.varianceKg.toFixed(1)} kg</strong></div>
                    <div><span>Completion likelihood</span><strong>{previewPlan.progress.onTrackLikelihood}</strong></div>
                  </div>
                </div>
              </div>

              <div className="dashboard-alert-list">
                <div className="dashboard-section-subtitle">Safety Alerts</div>
                {previewPlan.safetyAlerts.length === 0 ? (
                  <p className="dashboard-card__note">No safety alerts for this plan.</p>
                ) : (
                  previewPlan.safetyAlerts.map((alert) => (
                    <div className={`dashboard-alert dashboard-alert--${alert.level}`} key={`${alert.level}-${alert.title}`}>
                      <strong>{alert.title}</strong>
                      <span>{alert.message}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="dashboard-alert-list">
                <div className="dashboard-section-subtitle">Goal Change History</div>
                {previewPlan.history.length === 0 ? (
                  <p className="dashboard-card__note">No previous goal versions yet.</p>
                ) : (
                  previewPlan.history.map((entry) => (
                    <div className="goal-management__history-item" key={entry.id}>
                      <strong>{GOAL_TYPES.find((item) => item.value === entry.type)?.label ?? entry.type}</strong>
                      <span>{entry.changedAt.slice(0, 10)} | {entry.targetWeightKg} kg | {entry.plannedRateKgPerWeek} kg/week | {entry.strictness}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="goal-management__weight-card">
                <div className="dashboard-section-subtitle">Log New Weight</div>
                <div className="goal-management__weight-form">
                  <label className="profile-modal__field goal-management__field">
                    <span>Today's Weight (kg)</span>
                    <input
                      type="number"
                      min="0.1"
                      max="500"
                      step="0.1"
                      value={weightLogForm.weightKg}
                      placeholder={profile ? profile.weightKg.toFixed(1) : '0.0'}
                      onChange={(event) => updateWeightLogForm('weightKg', event.target.value)}
                    />
                  </label>
                  <label className="profile-modal__field goal-management__field">
                    <span>Date Logged</span>
                    <input
                      type="date"
                      max={toLocalDateInputValue(new Date())}
                      value={weightLogForm.loggedDate}
                      onChange={(event) => updateWeightLogForm('loggedDate', event.target.value)}
                    />
                  </label>
                  <button
                    className="dashboard-journal-button goal-management__weight-submit"
                    type="button"
                    onClick={() => void handleLogWeight()}
                    disabled={!!weightLogValidationMessage || isWeightLogLoading}
                  >
                    {isWeightLogLoading ? 'Logging...' : 'Log Weight'}
                  </button>
                </div>
                {weightLogValidationMessage ? <p className="goal-management__form-note">{weightLogValidationMessage}</p> : null}
              </div>

              <div className="goal-management__weight-card">
                <div className="dashboard-section-subtitle">Weight Log History</div>
                {weightInsights ? (
                  <div className="goal-management__weight-insights">
                    <div>
                      <span>Total change</span>
                      <strong className={weightInsights.totalChangeKg > 0 ? 'goal-management__change--up' : weightInsights.totalChangeKg < 0 ? 'goal-management__change--down' : ''}>
                        {formatSignedWeight(weightInsights.totalChangeKg)}
                      </strong>
                    </div>
                    <div>
                      <span>Avg weekly progress</span>
                      <strong className={weightInsights.averageWeeklyProgressKg > 0 ? 'goal-management__change--up' : weightInsights.averageWeeklyProgressKg < 0 ? 'goal-management__change--down' : ''}>
                        {formatSignedWeight(weightInsights.averageWeeklyProgressKg)}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {weightLogRows.length === 0 ? (
                  <div className="goal-management__empty-state">
                    <span aria-hidden="true">+</span>
                    <strong>No logged weights yet.</strong>
                    <p>Add your first weight entry to track progress over time.</p>
                  </div>
                ) : (
                  <div className="goal-management__weight-history" aria-label="Weight log history">
                    <div className="goal-management__weight-history-head">
                      <span>Date</span>
                      <span>Weight</span>
                      <span>Change</span>
                      <span>Action</span>
                    </div>
                    {weightLogRows.map((log) => (
                      <div className="goal-management__weight-history-row" key={log.id}>
                        <span>{formatDisplayDate(log.loggedDate)}</span>
                        <strong>{formatWeight(log.weightKg)}</strong>
                        <strong className={log.changeKg == null ? '' : log.changeKg > 0 ? 'goal-management__change--up' : log.changeKg < 0 ? 'goal-management__change--down' : ''}>
                          {log.changeKg == null ? '--' : formatSignedWeight(log.changeKg)}
                        </strong>
                        <button
                          className="goal-management__delete-weight"
                          type="button"
                          aria-label={`Delete weight log from ${formatDisplayDate(log.loggedDate)}`}
                          title="Delete weight log"
                          disabled={deletingWeightLogId != null}
                          onClick={() => setWeightLogPendingDelete(log)}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : !isLoading ? (
            <p className="dashboard-card__note">Complete the required fields to preview targets and progress.</p>
          ) : null}
        </article>
      </section>

      {toastMessage ? <div className={`goal-management__toast goal-management__toast--${toastMessage.type}`}>{toastMessage.text}</div> : null}
      {weightLogPendingDelete ? (
        <div className="goal-management__confirm" role="dialog" aria-modal="true" aria-labelledby="delete-weight-log-title">
          <div className="goal-management__confirm-overlay" onClick={() => deletingWeightLogId == null ? setWeightLogPendingDelete(null) : undefined} />
          <section className="goal-management__confirm-panel">
            <h3 id="delete-weight-log-title">Delete weight log</h3>
            <p>Are you sure you want to delete this weight log?</p>
            <div className="goal-management__confirm-detail">
              <span>{formatDisplayDate(weightLogPendingDelete.loggedDate)}</span>
              <strong>{formatWeight(weightLogPendingDelete.weightKg)}</strong>
            </div>
            <div className="goal-management__confirm-actions">
              <button
                className="food-detail-modal__ghost"
                type="button"
                disabled={deletingWeightLogId != null}
                onClick={() => setWeightLogPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="food-detail-modal__primary goal-management__confirm-delete"
                type="button"
                disabled={deletingWeightLogId != null}
                onClick={() => void handleDeleteWeightLog()}
              >
                {deletingWeightLogId != null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  )
}

export default GoalManagementPage
