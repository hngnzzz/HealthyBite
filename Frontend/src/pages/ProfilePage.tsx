import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import { healthAssessmentService } from '../services/healthAssessmentService'
import { onboardingService } from '../services/onboardingService'
import { profileBootstrapService } from '../services/profileBootstrapService'
import { profileService } from '../services/profileService'
import { sessionService } from '../services/sessionService'
import type { PediatricHealthAssessment } from '../types/health'
import type { CreateProfilePayload } from '../types/profile'

type Gender = 'Male' | 'Female'
type ActivityLevel =
  | 'Sedentary'
  | 'Lightly active'
  | 'Moderately active'
  | 'Very active'
  | 'Extra active'
type GoalType = 'Lose weight' | 'Maintain' | 'Gain weight' | 'Build muscle'
type GoalSpeed = 'Slow' | 'Normal' | 'Fast'
type MeasurementUnit = 'metric' | 'imperial'
type PresetDietPlanKey =
  | 'high-protein-cut'
  | 'balanced-cut'
  | 'mediterranean'
  | 'balanced-maintain'
  | 'lower-carb'
  | 'clean-bulk'
  | 'lean-bulk'
  | 'performance'
  | 'plant-forward'
  | 'custom'
type DietPlanKey = PresetDietPlanKey | `custom:p${number}-c${number}-f${number}`

interface DietPlanDefinition {
  key: PresetDietPlanKey
  label: string
  description: string
  proteinRatio: number
  carbRatio: number
  fatRatio: number
}

interface DietPlanMeta {
  key: PresetDietPlanKey
  label: string
  description: string
}

interface ProfileFormState {
  profileName: string
  nickname: string
  gender: Gender
  age: string
  birthDate: string
  ageMonths: string
  heightCm: string
  weightKg: string
  targetWeightKg: string
  activityLevel: ActivityLevel
  goal: GoalType
  goalSpeed: GoalSpeed
  dietPlan: DietPlanKey
  healthStatus: string
  favoriteFoods: string
  measurementUnit: MeasurementUnit
}

interface StoredProfile extends ProfileFormState {
  id: number
}

interface ProfilesState {
  profiles: StoredProfile[]
  activeProfileId: number
}

const DEFAULT_FORM: ProfileFormState = {
  profileName: '',
  nickname: '',
  gender: 'Male',
  age: '',
  birthDate: '',
  ageMonths: '',
  heightCm: '',
  weightKg: '',
  targetWeightKg: '',
  activityLevel: 'Moderately active',
  goal: 'Maintain',
  goalSpeed: 'Normal',
  dietPlan: 'balanced-maintain',
  healthStatus: '',
  favoriteFoods: '',
  measurementUnit: 'metric',
}

const DIET_PLAN_META: Record<PresetDietPlanKey, DietPlanMeta> = {
  'high-protein-cut': {
    key: 'high-protein-cut',
    label: 'High-protein cut',
    description: 'Higher protein and controlled carbs for fat loss while preserving lean mass.',
  },
  'balanced-cut': {
    key: 'balanced-cut',
    label: 'Balanced fat loss',
    description: 'A practical calorie deficit with enough carbs to keep the plan sustainable.',
  },
  mediterranean: {
    key: 'mediterranean',
    label: 'Mediterranean',
    description: 'A balanced pattern centered on vegetables, legumes, whole grains, and healthy fats.',
  },
  'balanced-maintain': {
    key: 'balanced-maintain',
    label: 'Balanced maintenance',
    description: 'A steady everyday split for long-term maintenance and stable energy.',
  },
  'lower-carb': {
    key: 'lower-carb',
    label: 'Lower-carb',
    description: 'Moderate protein and fat with fewer carbs for users who prefer a lighter carb load.',
  },
  'clean-bulk': {
    key: 'clean-bulk',
    label: 'Clean weight gain',
    description: 'A controlled calorie surplus aimed at steady weight gain without excess.',
  },
  'lean-bulk': {
    key: 'lean-bulk',
    label: 'Lean muscle gain',
    description: 'A muscle-focused surplus with extra protein and a measured increase in calories.',
  },
  performance: {
    key: 'performance',
    label: 'Performance',
    description: 'Higher carbs to support training volume, recovery, and athletic performance.',
  },
  'plant-forward': {
    key: 'plant-forward',
    label: 'Plant-forward',
    description: 'An omnivorous but plant-heavy pattern built around fiber, legumes, and produce.',
  },
  custom: {
    key: 'custom',
    label: 'Custom macros',
    description: 'Set your own protein, carbs, and fat split instead of using a preset.',
  },
}

const BASE_DIET_PLAN_RATIOS: Record<PresetDietPlanKey, Pick<DietPlanDefinition, 'proteinRatio' | 'carbRatio' | 'fatRatio'>> = {
  'high-protein-cut': { proteinRatio: 0.35, carbRatio: 0.3, fatRatio: 0.35 },
  'balanced-cut': { proteinRatio: 0.3, carbRatio: 0.4, fatRatio: 0.3 },
  mediterranean: { proteinRatio: 0.25, carbRatio: 0.4, fatRatio: 0.35 },
  'balanced-maintain': { proteinRatio: 0.25, carbRatio: 0.45, fatRatio: 0.3 },
  'lower-carb': { proteinRatio: 0.3, carbRatio: 0.25, fatRatio: 0.45 },
  'clean-bulk': { proteinRatio: 0.25, carbRatio: 0.5, fatRatio: 0.25 },
  'lean-bulk': { proteinRatio: 0.3, carbRatio: 0.45, fatRatio: 0.25 },
  performance: { proteinRatio: 0.25, carbRatio: 0.55, fatRatio: 0.2 },
  'plant-forward': { proteinRatio: 0.25, carbRatio: 0.45, fatRatio: 0.3 },
  custom: { proteinRatio: 0.3, carbRatio: 0.4, fatRatio: 0.3 },
}

const GOAL_DIET_PLAN_RATIO_OVERRIDES: Partial<Record<GoalType, Partial<Record<PresetDietPlanKey, Pick<DietPlanDefinition, 'proteinRatio' | 'carbRatio' | 'fatRatio'>>>>> = {
  'Lose weight': {
    'lean-bulk': { proteinRatio: 0.35, carbRatio: 0.3, fatRatio: 0.35 },
  },
  Maintain: {
    'lean-bulk': { proteinRatio: 0.3, carbRatio: 0.4, fatRatio: 0.3 },
  },
  'Gain weight': {
    'lean-bulk': { proteinRatio: 0.28, carbRatio: 0.47, fatRatio: 0.25 },
  },
  'Build muscle': {
    'lean-bulk': { proteinRatio: 0.32, carbRatio: 0.43, fatRatio: 0.25 },
  },
}

const GOAL_TO_DIET: Record<GoalType, DietPlanKey> = {
  'Lose weight': 'high-protein-cut',
  Maintain: 'balanced-maintain',
  'Gain weight': 'clean-bulk',
  'Build muscle': 'lean-bulk',
}

const DIET_PLAN_KEYS = Object.keys(DIET_PLAN_META) as PresetDietPlanKey[]

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
  'Extra active': 1.9,
}

const GOAL_ADJUSTMENTS: Record<GoalType, Record<GoalSpeed, number>> = {
  'Lose weight': { Slow: -250, Normal: -500, Fast: -750 },
  Maintain: { Slow: 0, Normal: 0, Fast: 0 },
  'Gain weight': { Slow: 200, Normal: 350, Fast: 500 },
  'Build muscle': { Slow: 150, Normal: 250, Fast: 350 },
}

function roundTo(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function getInitial(profileName: string) {
  const trimmed = profileName.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'H'
}

function mapBootstrapGender(value?: string): Gender {
  return value === 'Female' ? 'Female' : 'Male'
}

function mapBootstrapActivityLevel(value?: string): ActivityLevel {
  switch (value) {
    case 'Sedentary':
    case 'Lightly active':
    case 'Moderately active':
    case 'Very active':
    case 'Extra active':
      return value
    default:
      return 'Moderately active'
  }
}

function mapBootstrapGoal(value?: string): GoalType {
  switch (value) {
    case 'Lose weight':
    case 'Maintain':
    case 'Gain weight':
    case 'Build muscle':
      return value
    default:
      return 'Maintain'
  }
}

function mapBootstrapGoalSpeed(value?: string): GoalSpeed {
  switch (value) {
    case 'Slow':
    case 'Normal':
    case 'Fast':
      return value
    default:
      return 'Normal'
  }
}

function calculateAgeFromBirthDate(value?: string) {
  if (!value) {
    return ''
  }

  const birthDate = new Date(value)
  if (Number.isNaN(birthDate.getTime())) {
    return ''
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())

  if (hasNotHadBirthdayYet) {
    age -= 1
  }

  return String(Math.max(0, age))
}

function isPresetDietPlan(value?: string): value is PresetDietPlanKey {
  return DIET_PLAN_KEYS.includes(value as PresetDietPlanKey)
}

function parseCustomDietPlan(value?: string) {
  if (!value) {
    return null
  }

  const match = /^custom:p(\d+)-c(\d+)-f(\d+)$/i.exec(value.trim())
  if (!match) {
    return null
  }

  const proteinRatio = Number(match[1]) / 100
  const carbRatio = Number(match[2]) / 100
  const fatRatio = Number(match[3]) / 100
  const proteinPercent = Number(match[1])
  const carbPercent = Number(match[2])
  const fatPercent = Number(match[3])

  if (
    Number.isNaN(proteinRatio) ||
    Number.isNaN(carbRatio) ||
    Number.isNaN(fatRatio) ||
    proteinPercent + carbPercent + fatPercent !== 100
  ) {
    return null
  }

  return {
    proteinRatio,
    carbRatio,
    fatRatio,
  }
}

function resolveDietPlan(goal: GoalType, dietPlan: DietPlanKey) {
  const custom = parseCustomDietPlan(dietPlan)
  if (custom) {
    return {
      ...DIET_PLAN_META.custom,
      ...custom,
    }
  }

  if (dietPlan === 'custom') {
    return {
      ...DIET_PLAN_META.custom,
      ...BASE_DIET_PLAN_RATIOS.custom,
    }
  }

  const resolvedPlan = isPresetDietPlan(dietPlan) ? dietPlan : 'balanced-maintain'
  const override = GOAL_DIET_PLAN_RATIO_OVERRIDES[goal]?.[resolvedPlan]

  return {
    ...DIET_PLAN_META[resolvedPlan],
    ...(override ?? BASE_DIET_PLAN_RATIOS[resolvedPlan]),
  }
}

function getPrefilledForm(profileName = ''): ProfileFormState {
  const onboardingDraft = onboardingService.getDraft()
  const bootstrapDraft = profileBootstrapService.buildPrefillDraft(profileName)

  return {
    ...DEFAULT_FORM,
    profileName: bootstrapDraft.profileName || onboardingDraft.fullName || profileName,
    nickname: '',
    gender: mapBootstrapGender(bootstrapDraft.gender),
    age: onboardingDraft.dateOfBirth ? calculateAgeFromBirthDate(onboardingDraft.dateOfBirth) : (bootstrapDraft.age || ''),
    birthDate: onboardingDraft.dateOfBirth || '',
    ageMonths: bootstrapDraft.ageMonths || '',
    heightCm: onboardingDraft.heightCm || bootstrapDraft.heightCm || '',
    weightKg: onboardingDraft.currentWeight || bootstrapDraft.weightKg || '',
    targetWeightKg: onboardingDraft.targetWeight || bootstrapDraft.targetWeightKg || bootstrapDraft.weightKg || '',
    activityLevel: mapBootstrapActivityLevel(bootstrapDraft.activityLevel),
    goal: mapBootstrapGoal(bootstrapDraft.goal),
    goalSpeed: mapBootstrapGoalSpeed(bootstrapDraft.goalSpeed),
    dietPlan: parseCustomDietPlan(bootstrapDraft.dietPlan)
      ? (bootstrapDraft.dietPlan as DietPlanKey)
      : isPresetDietPlan(bootstrapDraft.dietPlan)
        ? bootstrapDraft.dietPlan
        : 'balanced-maintain',
    healthStatus: bootstrapDraft.healthStatus || '',
    favoriteFoods: '',
    measurementUnit: (bootstrapDraft.measurementUnit as string) === 'imperial' ? 'imperial' : 'metric',
  }
}

function getRangeValidation(age: number, heightCm: number, weightKg: number, ageMonths = 0) {
  if (age > 0 && age < 18 && (ageMonths < 0 || ageMonths > 11)) {
    return { isValid: false, message: 'Child extra months must be between 0 and 11.' }
  }

  if (age >= 0 && age < 5 && (weightKg < 0.5 || weightKg > 40 || heightCm < 35 || heightCm > 145)) {
    return { isValid: false, message: 'For ages 0-5: weight must be 0.5-40kg and height 35-145cm.' }
  }

  if (age >= 5 && age < 18 && (weightKg < 8.9 || weightKg > 120 || heightCm < 85.9 || heightCm > 197)) {
    return { isValid: false, message: 'For ages 5-18: weight must be 8.9-120kg and height 85.9-197cm.' }
  }

  return { isValid: true, message: '' }
}

function getTargetWeightValidation(weightKg: number, targetWeightKg: number) {
  if (targetWeightKg <= 0) {
    return { isValid: false, message: 'Target weight must be greater than 0.' }
  }

  if (targetWeightKg < weightKg * 0.5 || targetWeightKg > weightKg * 1.5) {
    return { isValid: false, message: 'Target weight is not reasonable for the current weight.' }
  }

  return { isValid: true, message: '' }
}

function mapApiGender(value: string): Gender {
  return value.trim().toLowerCase() === 'female' ? 'Female' : 'Male'
}
function mapApiActivityLevel(value: string): ActivityLevel {
  switch (value.trim().toLowerCase()) {
    case 'sedentary':
      return 'Sedentary'
    case 'lightly active':
      return 'Lightly active'
    case 'moderately active':
      return 'Moderately active'
    case 'very active':
      return 'Very active'
    case 'extra active':
      return 'Extra active'
    default:
      return 'Moderately active'
  }
}
function mapApiGoal(value: string): GoalType {
  switch (value.trim().toLowerCase()) {
    case 'lose weight':
    case 'lose_weight':
      return 'Lose weight'
    case 'gain weight':
    case 'gain_weight':
      return 'Gain weight'
    case 'build muscle':
    case 'build_muscle':
      return 'Build muscle'
    case 'maintain':
    default:
      return 'Maintain'
  }
}
function toStoredProfile(profile: {
  id: number
  name: string
  nickname: string
  birthDate: string | null
  gender: string
  age: number
  heightCm: number
  weightKg: number
  targetWeightKg: number | null
  activityLevel: string
  goal: string
  dietPlan: string
  healthStatus: string
  favoriteFoods: string
  nutritionConstraints: string
  measurementUnit: string
}): StoredProfile {
  const goal = mapApiGoal(profile.goal)

  return {
    id: profile.id,
    profileName: profile.name,
    nickname: profile.nickname || '',
    gender: mapApiGender(profile.gender),
    age: String(profile.age),
    birthDate: profile.birthDate || '',
    ageMonths: '',
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    targetWeightKg: profile.targetWeightKg != null ? String(profile.targetWeightKg) : String(profile.weightKg),
    activityLevel: mapApiActivityLevel(profile.activityLevel),
    goal,
    goalSpeed: 'Normal',
    dietPlan: parseCustomDietPlan(profile.dietPlan)
      ? (profile.dietPlan as DietPlanKey)
      : isPresetDietPlan(profile.dietPlan)
        ? profile.dietPlan
        : GOAL_TO_DIET[goal],
    healthStatus: profile.healthStatus || '',
    favoriteFoods: profile.favoriteFoods || '',
    measurementUnit: (profile.measurementUnit as string) === 'imperial' ? 'imperial' : 'metric',
  }
}

function toAssessmentGender(gender: Gender): 'Male' | 'Female' {
  return gender
}

function calculateMetrics(profile: ProfileFormState, pediatricAssessment: PediatricHealthAssessment | null) {
  const age = Number(profile.age) || 0
  const heightCm = Number(profile.heightCm) || 0
  const weightKg = Number(profile.weightKg) || 0
  const heightM = heightCm > 0 ? heightCm / 100 : 0
  const bmi = heightM > 0 ? roundTo(weightKg / (heightM * heightM), 1) : 0
  const bmiStatus =
    bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmr =
    age > 0 && heightCm > 0 && weightKg > 0
      ? Math.round(
          profile.gender === 'Male'
            ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
            : 10 * weightKg + 6.25 * heightCm - 5 * age - 161,
        )
      : 0
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[profile.activityLevel])
  const calorieTarget = Math.max(0, tdee + GOAL_ADJUSTMENTS[profile.goal][profile.goalSpeed])
  const idealWeightMin = heightM > 0 ? roundTo(18.5 * heightM * heightM, 1) : 0
  const idealWeightMax = heightM > 0 ? roundTo(24.9 * heightM * heightM, 1) : 0
  const dietPlan = resolveDietPlan(profile.goal, profile.dietPlan)

  return {
    bmi,
    bmiStatus,
    bmr,
    tdee,
    calorieTarget,
    idealWeightText: pediatricAssessment?.idealWeightText ?? `${idealWeightMin} - ${idealWeightMax} kg`,
    summaryLabel: pediatricAssessment?.summaryLabel ?? `BMI - ${bmiStatus}`,
    summaryValue: pediatricAssessment?.summaryValue ?? String(bmi || 0),
    percentileText: pediatricAssessment?.percentileText ?? '',
    detailLines: pediatricAssessment?.detailLines ?? [],
    warning: pediatricAssessment?.warning ?? '',
    proteinGrams: Math.round((calorieTarget * dietPlan.proteinRatio) / 4),
    carbGrams: Math.round((calorieTarget * dietPlan.carbRatio) / 4),
    fatGrams: Math.round((calorieTarget * dietPlan.fatRatio) / 9),
    dietPlan,
  }
}

type ProfileMetrics = ReturnType<typeof calculateMetrics>

interface ProfileCardsSectionProps {
  profiles: StoredProfile[]
  activeProfileId: number
  profilePediatricAssessments: Record<number, PediatricHealthAssessment | null>
  onEditProfile: (profile: StoredProfile) => void
  onDeleteProfile: (profileId: number) => void
  onSetActiveProfile: (profileId: number) => void
}

function ProfileCardsSection({
  profiles,
  activeProfileId,
  profilePediatricAssessments,
  onEditProfile,
  onDeleteProfile,
  onSetActiveProfile,
}: ProfileCardsSectionProps) {
  return (
    <div className="profile-grid">
      {profiles.map((profile) => {
        const metrics = calculateMetrics(profile, profilePediatricAssessments[profile.id] ?? null)
        const isActive = profile.id === activeProfileId

        return (
          <article key={profile.id} className={`profile-card${isActive ? ' profile-card--active' : ''}`}>
            <div className="profile-card__top">
              <div className="profile-card__identity">
                <div className="profile-card__avatar">{getInitial(profile.profileName)}</div>
                <div>
                  <h3>{profile.profileName}</h3>
                  <p>{profile.gender} - {profile.age || '--'} years old</p>
                </div>
              </div>

              <div className="profile-card__actions">
                {isActive ? <span className="profile-card__status">Active</span> : null}
                <button className="profile-card__icon-button" type="button" onClick={() => onEditProfile(profile)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m4 20 4.5-1 9.3-9.3a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
                  </svg>
                </button>
                <button className="profile-card__icon-button" type="button" onClick={() => onDeleteProfile(profile.id)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 7h14" />
                    <path d="M9 7V5h6v2" />
                    <path d="M8 7l1 12h6l1-12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="profile-stats-grid">
              <article className="profile-stat-card">
                <strong>{profile.heightCm || '--'}cm</strong>
                <span>Height</span>
              </article>
              <article className="profile-stat-card">
                <strong>{profile.weightKg || '--'}kg</strong>
                <span>Weight</span>
              </article>
              <article className="profile-stat-card">
                <strong>{profile.targetWeightKg || '--'}kg</strong>
                <span>Target weight</span>
              </article>
              <article className="profile-stat-card">
                <strong className="profile-stat-card__value--green">{metrics.summaryValue}</strong>
                <span>{metrics.summaryLabel}</span>
              </article>
            </div>

            <dl className="profile-details-list">
              <div><dt>Nickname</dt><dd>{profile.nickname || 'Not set'}</dd></div>
              <div><dt>Birth date</dt><dd>{profile.birthDate || 'Not set'}</dd></div>
              <div><dt>BMR</dt><dd>{metrics.bmr} kcal/day</dd></div>
              <div><dt>TDEE</dt><dd>{metrics.tdee} kcal/day</dd></div>
              <div><dt>Ideal weight</dt><dd>{metrics.idealWeightText}</dd></div>
              <div><dt>Activity level</dt><dd>{profile.activityLevel}</dd></div>
              <div><dt>Health status</dt><dd>{profile.healthStatus || 'None specified'}</dd></div>
              <div><dt>Favorite foods</dt><dd>{profile.favoriteFoods || 'None specified'}</dd></div>
              <div><dt>Unit</dt><dd>{profile.measurementUnit}</dd></div>
              {metrics.percentileText ? <div><dt>Percentile</dt><dd>{metrics.percentileText}</dd></div> : null}
            </dl>

            {metrics.warning ? <div className="profile-modal__warning">{metrics.warning}</div> : null}

            <div className="profile-card__footer">
              {isActive ? (
                <button className="profile-card__action profile-card__action--current" type="button" disabled>
                  Current Profile
                </button>
              ) : (
                <button className="profile-card__action" type="button" onClick={() => onSetActiveProfile(profile.id)}>
                  Use This Profile
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

interface ProfileFormModalProps {
  editingProfileId: number | null
  draftProfile: ProfileFormState
  draftMetrics: ProfileMetrics
  rangeValidation: { isValid: boolean; message: string }
  targetWeightValidation: { isValid: boolean; message: string }
  canSaveProfile: boolean
  onClose: () => void
  onUpdateDraft: <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => void
  onSave: () => void
}

function ProfileFormModal({
  editingProfileId,
  draftProfile,
  draftMetrics,
  rangeValidation,
  targetWeightValidation,
  canSaveProfile,
  onClose,
  onUpdateDraft,
  onSave,
}: ProfileFormModalProps) {
  return (
    <div className="profile-modal" role="dialog" aria-modal="true">
      <div className="profile-modal__overlay" onClick={onClose} />
      <section className="profile-modal__panel">
        <header className="profile-modal__header">
          <h3>{editingProfileId ? 'Edit Profile' : 'Add New Profile'}</h3>
          <button className="profile-modal__close" type="button" onClick={onClose}>x</button>
        </header>

        <div className="profile-modal__body">
          <section className="profile-modal__form">
            <label className="profile-modal__field">
              <span>Full name</span>
              <input value={draftProfile.profileName} onChange={(e) => onUpdateDraft('profileName', e.target.value)} />
            </label>

            <label className="profile-modal__field">
              <span>Nickname</span>
              <input value={draftProfile.nickname} onChange={(e) => onUpdateDraft('nickname', e.target.value)} />
            </label>

            <div className="profile-modal__inline-grid">
              <label className="profile-modal__field">
                <span>Gender</span>
                <select value={draftProfile.gender} onChange={(e) => onUpdateDraft('gender', e.target.value as Gender)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <label className="profile-modal__field">
                <span>Date of birth</span>
                <input
                  type="date"
                  value={draftProfile.birthDate}
                  onChange={(e) => {
                    onUpdateDraft('birthDate', e.target.value)
                    onUpdateDraft('age', calculateAgeFromBirthDate(e.target.value))
                  }}
                />
              </label>
            </div>

            <div className="profile-modal__inline-grid">
              <label className="profile-modal__field">
                <span>Age</span>
                <input type="number" min="1" value={draftProfile.age} onChange={(e) => onUpdateDraft('age', e.target.value)} />
              </label>
              <label className="profile-modal__field">
                <span>Height (cm)</span>
                <input type="number" min="1" step="0.1" value={draftProfile.heightCm} onChange={(e) => onUpdateDraft('heightCm', e.target.value)} />
              </label>
            </div>

            <div className="profile-modal__inline-grid">
              <label className="profile-modal__field">
                <span>Weight (kg)</span>
                <input type="number" min="1" step="0.1" value={draftProfile.weightKg} onChange={(e) => onUpdateDraft('weightKg', e.target.value)} />
              </label>
              <label className="profile-modal__field">
                <span>Measurement unit</span>
                <select value={draftProfile.measurementUnit} onChange={(e) => onUpdateDraft('measurementUnit', e.target.value as MeasurementUnit)}>
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </label>
            </div>

            <label className="profile-modal__field">
              <span>Activity level</span>
              <select value={draftProfile.activityLevel} onChange={(e) => onUpdateDraft('activityLevel', e.target.value as ActivityLevel)}>
                {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>

            <label className="profile-modal__field">
              <span>Health information</span>
              <input
                value={draftProfile.healthStatus}
                placeholder="Example: healthy, diabetes, hypertension"
                onChange={(e) => onUpdateDraft('healthStatus', e.target.value)}
              />
            </label>

            <label className="profile-modal__field">
              <span>Favorite foods</span>
              <input
                value={draftProfile.favoriteFoods}
                placeholder="Rice, chicken breast, yogurt..."
                onChange={(e) => onUpdateDraft('favoriteFoods', e.target.value)}
              />
            </label>
          </section>

          <aside className="profile-modal__result">
            <h4>Calculated Results</h4>
            <div className="profile-modal__result-card">
              <strong>{draftMetrics.summaryValue}</strong>
              <span>{draftMetrics.summaryLabel}</span>
              <p>{draftMetrics.warning || 'Review the targets and adjust your nutrition plan if needed.'}</p>
            </div>

            <div className="profile-modal__metric profile-modal__metric--blue">
              <span>BMR</span>
              <strong>{draftMetrics.bmr} kcal/day</strong>
            </div>
            <div className="profile-modal__metric profile-modal__metric--green">
              <span>TDEE</span>
              <strong>{draftMetrics.tdee} kcal/day</strong>
            </div>
            <div className="profile-modal__ideal">Ideal weight: {draftMetrics.idealWeightText}</div>

            {!rangeValidation.isValid ? <div className="profile-modal__warning">{rangeValidation.message}</div> : null}
            {!targetWeightValidation.isValid ? <div className="profile-modal__warning">{targetWeightValidation.message}</div> : null}
          </aside>
        </div>

        <footer className="profile-modal__footer">
          <button className="profile-modal__secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="profile-modal__primary" type="button" onClick={onSave} disabled={!canSaveProfile}>
            Save Profile
          </button>
        </footer>
      </section>
    </div>
  )
}

function ProfilePage() {
  const [profilesState, setProfilesState] = useState<ProfilesState>({ profiles: [], activeProfileId: 0 })
  const [draftProfile, setDraftProfile] = useState<ProfileFormState>(() =>
    getPrefilledForm(sessionService.getUser()?.fullName ?? ''),
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null)
  const [draftPediatricAssessment, setDraftPediatricAssessment] = useState<PediatricHealthAssessment | null>(null)
  const [profilePediatricAssessments, setProfilePediatricAssessments] = useState<Record<number, PediatricHealthAssessment | null>>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const draftMetrics = useMemo(
    () => calculateMetrics(draftProfile, draftPediatricAssessment),
    [draftProfile, draftPediatricAssessment],
  )
  const draftAge = Number(draftProfile.age) || 0
  const draftAgeMonths = Number(draftProfile.ageMonths) || 0
  const draftHeight = Number(draftProfile.heightCm) || 0
  const draftWeight = Number(draftProfile.weightKg) || 0
  const draftTargetWeight = Number(draftProfile.targetWeightKg) || 0
  const rangeValidation = getRangeValidation(draftAge, draftHeight, draftWeight, draftAgeMonths)
  const targetWeightValidation = getTargetWeightValidation(draftWeight, draftTargetWeight)
  const canSaveProfile =
    draftProfile.profileName.trim().length > 0 &&
    draftAge > 0 &&
    draftHeight > 0 &&
    draftWeight > 0 &&
    draftTargetWeight > 0 &&
    rangeValidation.isValid &&
    targetWeightValidation.isValid

  useEffect(() => {
    let cancelled = false

    async function loadProfiles() {
      const user = sessionService.getUser()
      if (!user)
      {
        setErrorMessage('You are not signed in.')
        setIsLoading(false)
        return
      }

      try {
        await profileBootstrapService.resolveExistingProfile()
        const response = await profileService.getMyProfiles()
        const profiles = response.data.data.map(toStoredProfile)

        if (!cancelled) {
          const activeProfileId =
            profiles.find((profile) => profile.id === sessionService.getActiveProfileId())?.id ??
            profiles[0]?.id ??
            0

          if (activeProfileId) {
            sessionService.setActiveProfileId(activeProfileId)
          }

          setProfilesState({ profiles, activeProfileId })
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load profiles.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProfiles()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDraftAssessment() {
      if (!(draftAge > 0 && draftAge < 18 && draftHeight > 0 && draftWeight > 0)) {
        setDraftPediatricAssessment(null)
        return
      }

      const assessment = await healthAssessmentService.assessPediatricGrowth({
        gender: toAssessmentGender(draftProfile.gender),
        ageYears: draftAge,
        ageMonths: draftAgeMonths,
        heightCm: draftHeight,
        weightKg: draftWeight,
      })

      if (!cancelled) {
        setDraftPediatricAssessment(assessment)
      }
    }

    void loadDraftAssessment()

    return () => {
      cancelled = true
    }
  }, [draftAge, draftAgeMonths, draftHeight, draftWeight, draftProfile.gender])

  useEffect(() => {
    let cancelled = false

    async function loadAssessments() {
      const pediatricProfiles = profilesState.profiles.filter((profile) => {
        const age = Number(profile.age) || 0
        const heightCm = Number(profile.heightCm) || 0
        const weightKg = Number(profile.weightKg) || 0
        return age > 0 && age < 18 && heightCm > 0 && weightKg > 0
      })

      if (!pediatricProfiles.length) {
        setProfilePediatricAssessments({})
        return
      }

      const nextMap: Record<number, PediatricHealthAssessment | null> = {}

      await Promise.all(
        pediatricProfiles.map(async (profile) => {
          nextMap[profile.id] = await healthAssessmentService.assessPediatricGrowth({
            gender: toAssessmentGender(profile.gender),
            ageYears: Number(profile.age) || 0,
            ageMonths: Number(profile.ageMonths) || 0,
            heightCm: Number(profile.heightCm) || 0,
            weightKg: Number(profile.weightKg) || 0,
          })
        }),
      )

      if (!cancelled) {
        setProfilePediatricAssessments(nextMap)
      }
    }

    void loadAssessments()

    return () => {
      cancelled = true
    }
  }, [profilesState.profiles])

  function persist(nextState: ProfilesState) {
    setProfilesState(nextState)
    if (nextState.activeProfileId > 0) {
      sessionService.setActiveProfileId(nextState.activeProfileId)
    }
  }

  function openCreateModal() {
    setEditingProfileId(null)
    const prefilled = getPrefilledForm(sessionService.getUser()?.fullName ?? '')
    setDraftProfile(prefilled)
    setIsModalOpen(true)
  }

  function openEditModal(profile: StoredProfile) {
    setEditingProfileId(profile.id)
    setDraftProfile(profile)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingProfileId(null)
  }

  function updateDraft<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setDraftProfile((current) => ({ ...current, [field]: value }))
  }

  function setActiveProfile(profileId: number) {
    persist({ ...profilesState, activeProfileId: profileId })
  }

  async function deleteProfile(profileId: number) {
    try {
      await profileService.deleteProfile(profileId)
      const nextProfiles = profilesState.profiles.filter((profile) => profile.id !== profileId)
      const nextActiveId =
        profilesState.activeProfileId === profileId ? nextProfiles[0]?.id ?? 0 : profilesState.activeProfileId

      if (!nextActiveId) {
        sessionService.clearActiveProfileId()
      }

      persist({ profiles: nextProfiles, activeProfileId: nextActiveId })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete profile.')
    }
  }

  async function saveProfile() {
    if (!canSaveProfile) return

    const user = sessionService.getUser()
    if (!user) {
      setErrorMessage('You are not signed in.')
      return
    }

    const payload: CreateProfilePayload = {
      userId: 0,
      name: draftProfile.profileName.trim(),
      nickname: draftProfile.nickname.trim(),
      age: Number(draftProfile.age) || 0,
      birthDate: draftProfile.birthDate || null,
      gender: draftProfile.gender.toLowerCase(),
      heightCm: Number(draftProfile.heightCm) || 0,
      weightKg: Number(draftProfile.weightKg) || 0,
      targetWeightKg: Number(draftProfile.targetWeightKg) || 0,
      goal:
        draftProfile.goal === 'Lose weight'
          ? 'lose_weight'
          : draftProfile.goal === 'Gain weight'
            ? 'gain_weight'
            : draftProfile.goal === 'Build muscle'
              ? 'build_muscle'
              : 'maintain',
      activityLevel:
        draftProfile.activityLevel === 'Sedentary'
          ? 'sedentary'
          : draftProfile.activityLevel === 'Lightly active'
            ? 'light'
            : draftProfile.activityLevel === 'Very active'
              ? 'active'
              : draftProfile.activityLevel === 'Extra active'
                ? 'very_active'
                : 'moderate',
      dietPlan: draftProfile.dietPlan,
      targetCalories: draftMetrics.calorieTarget,
      targetProtein: draftMetrics.proteinGrams,
      targetCarbs: draftMetrics.carbGrams,
      targetFat: draftMetrics.fatGrams,
      waterGoalMl: 2000,
      healthStatus: draftProfile.healthStatus.trim(),
      favoriteFoods: draftProfile.favoriteFoods.trim(),
      nutritionConstraints: '',
      measurementUnit: draftProfile.measurementUnit,
    }

    try {
      if (editingProfileId) {
        await profileService.updateProfile(editingProfileId, {
          name: payload.name,
          nickname: payload.nickname,
          age: payload.age,
          birthDate: payload.birthDate,
          gender: payload.gender,
          heightCm: payload.heightCm,
          weightKg: payload.weightKg,
          targetWeightKg: payload.targetWeightKg,
          goal: payload.goal,
          activityLevel: payload.activityLevel,
          dietPlan: payload.dietPlan,
          targetCalories: payload.targetCalories,
          targetProtein: payload.targetProtein,
          targetCarbs: payload.targetCarbs,
          targetFat: payload.targetFat,
          waterGoalMl: payload.waterGoalMl,
          healthStatus: payload.healthStatus,
          favoriteFoods: payload.favoriteFoods,
          nutritionConstraints: payload.nutritionConstraints,
          measurementUnit: payload.measurementUnit,
        })
        const refreshed = await profileService.getProfileById(editingProfileId)
        const updated = toStoredProfile(refreshed.data.data)

        persist({
          profiles: profilesState.profiles.map((profile) => (profile.id === editingProfileId ? updated : profile)),
          activeProfileId: profilesState.activeProfileId || updated.id,
        })
      } else {
        const created = await profileService.createProfile(payload)
        const newProfile = toStoredProfile(created.data.data)
        persist({
          profiles: [...profilesState.profiles, newProfile],
          activeProfileId: newProfile.id,
        })
      }

      closeModal()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save profile.')
    }
  }

  return (
    <DashboardShell
      activeItem="profile"
      title="Health Profiles"
      subtitle="Manage health information for you and your family"
      action={
        <button className="dashboard-journal-button profile-add-button" type="button" onClick={openCreateModal}>
          Add Profile
        </button>
      }
      mainClassName="profile-main"
    >
      <section className="profile-content">
        {errorMessage ? <div className="profile-modal__warning">{errorMessage}</div> : null}
        {isLoading ? <p>Loading profiles...</p> : null}
        {!isLoading && profilesState.profiles.length === 0 ? <p>No profiles yet. Create your first one.</p> : null}

        <ProfileCardsSection
          profiles={profilesState.profiles}
          activeProfileId={profilesState.activeProfileId}
          profilePediatricAssessments={profilePediatricAssessments}
          onEditProfile={openEditModal}
          onDeleteProfile={(profileId) => void deleteProfile(profileId)}
          onSetActiveProfile={setActiveProfile}
        />
      </section>

      {isModalOpen ? (
        <ProfileFormModal
          editingProfileId={editingProfileId}
          draftProfile={draftProfile}
          draftMetrics={draftMetrics}
          rangeValidation={rangeValidation}
          targetWeightValidation={targetWeightValidation}
          canSaveProfile={canSaveProfile}
          onClose={closeModal}
          onUpdateDraft={updateDraft}
          onSave={() => void saveProfile()}
        />
      ) : null}
    </DashboardShell>
  )
}

export default ProfilePage







