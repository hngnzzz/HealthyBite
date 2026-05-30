import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../components/dashboard/DashboardShell'
import { profileBootstrapService } from '../services/profileBootstrapService'
import { profileService } from '../services/profileService'
import { sessionService } from '../services/sessionService'
import type { Profile } from '../types/profile'

type Gender = 'Male' | 'Female'
type ActivityLevel =
  | 'Sedentary'
  | 'Lightly active'
  | 'Moderately active'
  | 'Very active'
  | 'Extra active'

interface StoredMeasurements {
  waistCm: string
  hipCm: string
  shoulderCm: string
  chestCm: string
}

interface BodyShapeAssessment {
  label: string
  explanation: string
  missingFields: string[]
  isDetailed: boolean
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
  'Extra active': 1.9,
}

const BODY_SHAPE_CLOSE_RATIO = 0.08
const BODY_SHAPE_CLEAR_RATIO = 0.1
const BODY_SHAPE_RECTANGLE_VARIANCE = 0.08
const BODY_SHAPE_WAIST_TAPER_RATIO = 0.8
const BODY_SHAPE_APPLE_RATIO = 0.98

function roundTo(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
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

function getMeasurementsStorageKey(profileId: number) {
  return `bodyReviewMeasurements:${profileId}`
}

function getStoredMeasurements(profileId: number): StoredMeasurements {
  const raw = localStorage.getItem(getMeasurementsStorageKey(profileId))
  if (!raw) {
    return { waistCm: '', hipCm: '', shoulderCm: '', chestCm: '' }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredMeasurements>
    return {
      waistCm: parsed.waistCm ?? '',
      hipCm: parsed.hipCm ?? '',
      shoulderCm: parsed.shoulderCm ?? '',
      chestCm: parsed.chestCm ?? '',
    }
  } catch {
    return { waistCm: '', hipCm: '', shoulderCm: '', chestCm: '' }
  }
}

function saveStoredMeasurements(profileId: number, measurements: StoredMeasurements) {
  localStorage.setItem(getMeasurementsStorageKey(profileId), JSON.stringify(measurements))
}

function getBmiStatus(bmi: number) {
  if (bmi <= 0) return 'Not available'
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy weight'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obesity class I'
  if (bmi < 40) return 'Obesity class II'
  return 'Obesity class III'
}

function getBmiInterpretation(bmi: number) {
  if (bmi <= 0) {
    return 'BMI is not available yet because height or weight is missing.'
  }

  if (bmi < 18.5) {
    return `BMI ${bmi.toFixed(1)} is below the usual healthy-weight range, which can suggest underweight status and the need to review overall nutrition and body reserves.`
  }

  if (bmi < 25) {
    return `BMI ${bmi.toFixed(1)} sits in the usual healthy-weight range, suggesting body weight is broadly proportionate to height on this screening measure.`
  }

  if (bmi < 30) {
    return `BMI ${bmi.toFixed(1)} is in the overweight range, which can be associated with higher long-term cardiometabolic risk, especially if abdominal-fat markers are also elevated.`
  }

  if (bmi < 35) {
    return `BMI ${bmi.toFixed(1)} falls in obesity class I, suggesting excess body weight on screening and a higher likelihood of metabolic risk than the healthy-weight range.`
  }

  if (bmi < 40) {
    return `BMI ${bmi.toFixed(1)} falls in obesity class II, which usually indicates a more pronounced excess-weight burden and a stronger need to review body-fat distribution and health risk.`
  }

  return `BMI ${bmi.toFixed(1)} falls in obesity class III, indicating very high excess weight on screening and a substantially elevated health-risk profile.`
}

function getBmrInterpretation(bmr: number) {
  if (bmr <= 0) {
    return 'BMR is not available yet because age, height, weight, or gender is missing.'
  }

  return `BMR ${bmr} kcal/day is the estimated energy your body would use at complete rest to maintain essential functions such as breathing, circulation, and temperature control.`
}

function getTdeeInterpretation(tdee: number, activityLevel: ActivityLevel) {
  if (tdee <= 0) {
    return 'TDEE is not available yet because BMR or activity level input is incomplete.'
  }

  return `TDEE ${tdee} kcal/day is the estimated total daily energy need after applying your current activity level (${activityLevel}). It is a practical baseline for calorie planning.`
}

function getWaistRisk(waistCm: number, gender: Gender) {
  if (waistCm <= 0) {
    return {
      label: 'Not available',
      riskLevel: 'neutral',
      note: 'Enter waist circumference to assess abdominal-fat risk.',
    } as const
  }

  if (gender === 'Male') {
    if (waistCm >= 102) {
      return {
        label: 'Substantially increased',
        riskLevel: 'high',
        note: 'Waist circumference is in a high-risk zone for abdominal adiposity.',
      } as const
    }
    if (waistCm >= 94) {
      return {
        label: 'Increased',
        riskLevel: 'medium',
        note: 'Waist circumference suggests elevated abdominal-fat risk.',
      } as const
    }
  } else {
    if (waistCm >= 88) {
      return {
        label: 'Substantially increased',
        riskLevel: 'high',
        note: 'Waist circumference is in a high-risk zone for abdominal adiposity.',
      } as const
    }
    if (waistCm >= 80) {
      return {
        label: 'Increased',
        riskLevel: 'medium',
        note: 'Waist circumference suggests elevated abdominal-fat risk.',
      } as const
    }
  }

  return {
    label: 'Lower risk',
    riskLevel: 'low',
    note: 'Waist circumference is below the common abdominal-risk action threshold.',
  } as const
}

function getWhrRisk(whr: number, gender: Gender) {
  if (whr <= 0) {
    return {
      label: 'Not available',
      riskLevel: 'neutral',
      note: 'Enter both waist and hip measurements to calculate WHR.',
    } as const
  }

  const threshold = gender === 'Male' ? 0.9 : 0.85
  if (whr >= threshold) {
    return {
      label: 'Elevated',
      riskLevel: 'medium',
      note: 'Waist-to-hip ratio is above the common WHO abdominal-risk threshold.',
    } as const
  }

  return {
    label: 'Lower risk',
    riskLevel: 'low',
    note: 'Waist-to-hip ratio is below the common abdominal-risk threshold.',
  } as const
}

function getWhtrRisk(whtr: number) {
  if (whtr <= 0) {
    return {
      label: 'Not available',
      riskLevel: 'neutral',
      note: 'Enter waist circumference to calculate WHtR.',
    } as const
  }

  if (whtr >= 0.5) {
    return {
      label: 'Elevated',
      riskLevel: 'medium',
      note: 'Waist-to-height ratio is above the common screening boundary of 0.5.',
    } as const
  }

  return {
    label: 'Lower risk',
    riskLevel: 'low',
    note: 'Waist-to-height ratio is below the common screening boundary of 0.5.',
  } as const
}

function getOverallAssessment(input: {
  bmi: number
  waistRisk: ReturnType<typeof getWaistRisk>
  whrRisk: ReturnType<typeof getWhrRisk>
  whtrRisk: ReturnType<typeof getWhtrRisk>
}) {
  const findings: string[] = []

  if (input.bmi > 0) {
    findings.push(`BMI is ${getBmiStatus(input.bmi)}.`)
  }

  if (input.waistRisk.riskLevel === 'high') {
    findings.push('Waist circumference indicates a high abdominal-fat risk.')
  } else if (
    input.waistRisk.riskLevel === 'medium' ||
    input.whrRisk.riskLevel === 'medium' ||
    input.whtrRisk.riskLevel === 'medium'
  ) {
    findings.push('Central adiposity markers suggest elevated abdominal-fat risk.')
  } else if (
    input.waistRisk.riskLevel === 'low' &&
    input.whrRisk.riskLevel === 'low' &&
    input.whtrRisk.riskLevel === 'low'
  ) {
    findings.push('Abdominal-fat screening markers are currently in a lower-risk zone.')
  }

  if (findings.length === 0) {
    findings.push('Add body measurements to generate a fuller screening summary.')
  }

  const hasAnyData =
    input.bmi > 0 ||
    input.waistRisk.riskLevel !== 'neutral' ||
    input.whrRisk.riskLevel !== 'neutral' ||
    input.whtrRisk.riskLevel !== 'neutral'

  const tone = !hasAnyData
    ? 'neutral'
    : input.waistRisk.riskLevel === 'high' || input.bmi >= 30
      ? 'high'
      : input.waistRisk.riskLevel === 'medium' ||
          input.whrRisk.riskLevel === 'medium' ||
          input.whtrRisk.riskLevel === 'medium' ||
          input.bmi >= 25
        ? 'medium'
        : 'low'

  return {
    tone,
    summary: findings.join(' '),
  }
}

function getWhrInterpretation(whr: number, gender: Gender, risk: ReturnType<typeof getWhrRisk>) {
  if (whr <= 0) {
    return 'WHR is not available yet because both waist and hip circumference are required.'
  }

  const threshold = gender === 'Male' ? 0.9 : 0.85
  if (risk.riskLevel === 'low') {
    return `WHR ${whr.toFixed(2)} is below the common threshold of ${threshold.toFixed(2)}, which suggests fat distribution around the waist is not currently in the higher abdominal-risk zone on this screening measure.`
  }

  return `WHR ${whr.toFixed(2)} is above the common threshold of ${threshold.toFixed(2)}, which suggests a greater concentration of abdominal fat relative to hip size and therefore a higher metabolic-risk pattern.`
}

function getWhtrInterpretation(whtr: number, waistCm: number, heightCm: number, risk: ReturnType<typeof getWhtrRisk>) {
  if (whtr <= 0) {
    return 'WHtR is not available yet because waist circumference and height are required.'
  }

  if (risk.riskLevel === 'low') {
    return `WHtR ${whtr.toFixed(2)} means your waist (${waistCm.toFixed(1)} cm) is under half of your height (${heightCm.toFixed(1)} cm), which is generally viewed as a lower central-adiposity screening result.`
  }

  return `WHtR ${whtr.toFixed(2)} means your waist (${waistCm.toFixed(1)} cm) is at least half of your height (${heightCm.toFixed(1)} cm), which suggests elevated central-fat accumulation on screening.`
}

function isCloseTo(value: number, target: number, tolerance = 0.05) {
  if (value <= 0 || target <= 0) {
    return false
  }

  return Math.abs(value - target) / target <= tolerance
}

function formatMissingBodyMeasurements(missingFields: string[]) {
  if (missingFields.length === 0) {
    return 'Need body measurements: shoulder, chest, waist, hip.'
  }

  return `Need body measurements: ${missingFields.join(', ')}.`
}

function getBodyShapeAssessment(input: {
  shoulder: number
  chest: number
  waist: number
  hip: number
}) {
  const missingFields = getMissingMeasurementFields(input)
  if (missingFields.length > 0) {
    return {
      label: 'Need body measurements',
      explanation: formatMissingBodyMeasurements(missingFields),
      missingFields,
      isDetailed: false,
    } satisfies BodyShapeAssessment
  }

  const { shoulder, chest, waist, hip } = input
  const upperAverage = (shoulder + chest) / 2
  const widestMeasurement = Math.max(shoulder, chest, waist, hip)
  const narrowestMeasurement = Math.min(shoulder, chest, waist, hip)

  if (waist >= widestMeasurement * BODY_SHAPE_APPLE_RATIO) {
    return {
      label: 'Apple Shape',
      explanation: 'The waist is the dominant measurement, so the midsection reads as the fullest area.',
      missingFields: [],
      isDetailed: true,
    } satisfies BodyShapeAssessment
  }

  if (
    isCloseTo(shoulder, chest, BODY_SHAPE_CLOSE_RATIO) &&
    isCloseTo(upperAverage, hip, BODY_SHAPE_CLOSE_RATIO) &&
    waist <= Math.min(upperAverage, hip) * BODY_SHAPE_WAIST_TAPER_RATIO
  ) {
    return {
      label: 'Hourglass Shape',
      explanation: 'Shoulders or chest and hips are close in size, while the waist is clearly narrower.',
      missingFields: [],
      isDetailed: true,
    } satisfies BodyShapeAssessment
  }

  if (upperAverage >= hip * (1 + BODY_SHAPE_CLEAR_RATIO)) {
    return {
      label: 'Inverted Triangle Shape',
      explanation: 'The upper body is clearly broader than the hips, so the top half dominates the silhouette.',
      missingFields: [],
      isDetailed: true,
    } satisfies BodyShapeAssessment
  }

  if (hip >= upperAverage * (1 + BODY_SHAPE_CLEAR_RATIO)) {
    return {
      label: 'Pear Shape',
      explanation: 'The hips are clearly broader than the shoulder and chest line, so the lower body leads the silhouette.',
      missingFields: [],
      isDetailed: true,
    } satisfies BodyShapeAssessment
  }

  if (
    Math.max(shoulder, chest, waist, hip) - narrowestMeasurement <=
    widestMeasurement * BODY_SHAPE_RECTANGLE_VARIANCE
  ) {
    return {
      label: 'Rectangle Shape',
      explanation: 'Shoulders, chest, waist, and hips stay fairly close together, which creates a straighter outline.',
      missingFields: [],
      isDetailed: true,
    } satisfies BodyShapeAssessment
  }

  return {
    label: 'Rectangle Shape',
    explanation: 'Your measurements are fairly balanced overall, without a strongly dominant upper or lower body shape.',
    missingFields: [],
    isDetailed: true,
  } satisfies BodyShapeAssessment
}

function getMissingMeasurementFields(input: {
  shoulder: number
  chest: number
  waist: number
  hip: number
}) {
  const missingFields: string[] = []

  if (input.shoulder <= 0) {
    missingFields.push('shoulder')
  }

  if (input.chest <= 0) {
    missingFields.push('chest')
  }

  if (input.waist <= 0) {
    missingFields.push('waist')
  }

  if (input.hip <= 0) {
    missingFields.push('hip')
  }

  return missingFields
}

function buildBodyReviewMetrics(
  profile: Profile | null,
  waistCm: string,
  hipCm: string,
  shoulderCm: string,
  chestCm: string,
) {
  if (!profile) {
    return null
  }

  const gender = mapApiGender(profile.gender)
  const activityLevel = mapApiActivityLevel(profile.activityLevel)
  const heightCm = Number(profile.heightCm) || 0
  const weightKg = Number(profile.weightKg) || 0
  const age = Number(profile.age) || 0
  const waist = Number(waistCm) || 0
  const hip = Number(hipCm) || 0
  const shoulder = Number(shoulderCm) || 0
  const chest = Number(chestCm) || 0
  const heightM = heightCm > 0 ? heightCm / 100 : 0
  const bmi = heightM > 0 ? roundTo(weightKg / (heightM * heightM), 1) : 0
  const bmr =
    age > 0 && heightCm > 0 && weightKg > 0
      ? Math.round(
          gender === 'Male'
            ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
            : 10 * weightKg + 6.25 * heightCm - 5 * age - 161,
        )
      : 0
  const tdee = bmr > 0 ? Math.round(bmr * ACTIVITY_FACTORS[activityLevel]) : 0
  const whr = waist > 0 && hip > 0 ? roundTo(waist / hip, 2) : 0
  const whtr = waist > 0 && heightCm > 0 ? roundTo(waist / heightCm, 2) : 0
  const waistRisk = getWaistRisk(waist, gender)
  const whrRisk = getWhrRisk(whr, gender)
  const whtrRisk = getWhtrRisk(whtr)
  const overall = getOverallAssessment({ bmi, waistRisk, whrRisk, whtrRisk })
  const bodyShape = getBodyShapeAssessment({ shoulder, chest, waist, hip })

  return {
    gender,
    activityLevel,
    bmi,
    bmiStatus: getBmiStatus(bmi),
    bmr,
    tdee,
    waist,
    whr,
    whtr,
    waistRisk,
    whrRisk,
    whtrRisk,
    overall,
    bodyShape,
    bmiInterpretation: getBmiInterpretation(bmi),
    bmrInterpretation: getBmrInterpretation(bmr),
    tdeeInterpretation: getTdeeInterpretation(tdee, activityLevel),
    whrInterpretation: getWhrInterpretation(whr, gender, whrRisk),
    whtrInterpretation: getWhtrInterpretation(whtr, waist, heightCm, whtrRisk),
  }
}

type BodyReviewMetrics = NonNullable<ReturnType<typeof buildBodyReviewMetrics>>

function BodyMetricCards({ metrics }: { metrics: BodyReviewMetrics }) {
  const metricCards = [
    { label: 'BMI', value: metrics.bmi ? metrics.bmi.toFixed(1) : '--', note: metrics.bmiStatus },
    { label: 'BMR', value: metrics.bmr ? `${metrics.bmr}` : '--', note: 'kcal/day' },
    { label: 'TDEE', value: metrics.tdee ? `${metrics.tdee}` : '--', note: metrics.activityLevel },
    { label: 'WHR', value: metrics.whr ? metrics.whr.toFixed(2) : '--', note: metrics.whrRisk.label },
    { label: 'WHtR', value: metrics.whtr ? metrics.whtr.toFixed(2) : '--', note: metrics.whtrRisk.label },
  ]

  return (
    <section className="body-review__metric-grid">
      <div className="body-review__metric-row body-review__metric-row--primary">
        {metricCards.slice(0, 3).map((card) => (
          <article className="dashboard-card dashboard-card--summary body-review__metric-card" key={card.label}>
            <p className="dashboard-card__label">{card.label}</p>
            <div className="dashboard-card__value-row">
              <strong>{card.value}</strong>
            </div>
            <p className="dashboard-card__note">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="body-review__metric-row body-review__metric-row--secondary">
        {metricCards.slice(3).map((card) => (
          <article className="dashboard-card dashboard-card--summary body-review__metric-card" key={card.label}>
            <p className="dashboard-card__label">{card.label}</p>
            <div className="dashboard-card__value-row">
              <strong>{card.value}</strong>
            </div>
            <p className="dashboard-card__note">{card.note}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function BodyMeasurementsPanel({
  profile,
  metrics,
  waistCm,
  hipCm,
  shoulderCm,
  chestCm,
  onWaistChange,
  onHipChange,
  onShoulderChange,
  onChestChange,
}: {
  profile: Profile
  metrics: BodyReviewMetrics
  waistCm: string
  hipCm: string
  shoulderCm: string
  chestCm: string
  onWaistChange: (value: string) => void
  onHipChange: (value: string) => void
  onShoulderChange: (value: string) => void
  onChestChange: (value: string) => void
}) {
  return (
    <div className="body-review__left-column">
      <article className="dashboard-card body-review__panel">
        <div className="dashboard-section-header">
          <h3>Measurements</h3>
        </div>

        <div className="body-review__inputs">
          <label className="profile-modal__field">
            <span>Waist circumference (cm)</span>
            <input type="number" min="1" step="0.1" value={waistCm} onChange={(event) => onWaistChange(event.target.value)} placeholder="Enter waist circumference" />
          </label>
          <label className="profile-modal__field">
            <span>Hip circumference (cm)</span>
            <input type="number" min="1" step="0.1" value={hipCm} onChange={(event) => onHipChange(event.target.value)} placeholder="Enter hip circumference" />
          </label>
          <label className="profile-modal__field">
            <span>Shoulder width / circumference (cm)</span>
            <input type="number" min="1" step="0.1" value={shoulderCm} onChange={(event) => onShoulderChange(event.target.value)} placeholder="Enter shoulder measurement" />
          </label>
          <label className="profile-modal__field">
            <span>Chest circumference (cm)</span>
            <input type="number" min="1" step="0.1" value={chestCm} onChange={(event) => onChestChange(event.target.value)} placeholder="Enter chest measurement" />
          </label>
        </div>

        <div className="dashboard-insights-list body-review__facts-grid">
          <div><span>Height</span><strong>{profile.heightCm} cm</strong></div>
          <div><span>Weight</span><strong>{profile.weightKg} kg</strong></div>
          <div><span>Age</span><strong>{profile.age}</strong></div>
          <div><span>Gender</span><strong>{metrics.gender}</strong></div>
          <div><span>Activity level</span><strong>{metrics.activityLevel}</strong></div>
          <div><span>Waist circumference</span><strong>{metrics.waist ? `${metrics.waist} cm` : '--'}</strong></div>
        </div>
      </article>

      <article className="dashboard-card body-review__panel">
        <div className="dashboard-section-header">
          <h3>Body Shape Assessment: {metrics.bodyShape.label}</h3>
        </div>
        <div className="body-review__shape-card">
          <p>{metrics.bodyShape.explanation}</p>
        </div>
      </article>
    </div>
  )
}

function BodyRiskPanel({ metrics }: { metrics: BodyReviewMetrics }) {
  return (
    <article className="dashboard-card body-review__panel">
      <div className="dashboard-section-header">
        <h3>Risk Screening</h3>
      </div>

      <div className="body-review__risk-list">
        <div className={`body-review__risk-item body-review__risk-item--${metrics.overall.tone}`}>
          <strong>Overall screening summary</strong>
          <p>{metrics.overall.summary}</p>
        </div>
        <div className="body-review__risk-item">
          <strong>BMI</strong>
          <p>{metrics.bmiInterpretation}</p>
        </div>
        <div className="body-review__risk-item">
          <strong>Waist circumference</strong>
          <p>{metrics.waistRisk.note}</p>
        </div>
        <div className="body-review__risk-item">
          <strong>TDEE</strong>
          <p>{metrics.tdeeInterpretation}</p>
        </div>
        <div className="body-review__risk-item">
          <strong>Waist-to-hip ratio (WHR)</strong>
          <p>{metrics.whrInterpretation}</p>
        </div>
        <div className="body-review__risk-item">
          <strong>BMR</strong>
          <p>{metrics.bmrInterpretation}</p>
        </div>
        <div className="body-review__risk-item">
          <strong>Waist-to-height ratio (WHtR)</strong>
          <p>{metrics.whtrInterpretation}</p>
        </div>
      </div>
    </article>
  )
}

function BodyReviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [waistCm, setWaistCm] = useState('')
  const [hipCm, setHipCm] = useState('')
  const [shoulderCm, setShoulderCm] = useState('')
  const [chestCm, setChestCm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const activeProfile = await profileBootstrapService.resolveExistingProfile()
        const activeProfileId = activeProfile?.id ?? sessionService.getActiveProfileId()

        if (!activeProfileId) {
          throw new Error('No active profile found.')
        }

        const response = await profileService.getProfileById(activeProfileId)
        const nextProfile = response.data.data
        const storedMeasurements = getStoredMeasurements(activeProfileId)

        if (!cancelled) {
          setProfile(nextProfile)
          setWaistCm(storedMeasurements.waistCm)
          setHipCm(storedMeasurements.hipCm)
          setShoulderCm(storedMeasurements.shoulderCm)
          setChestCm(storedMeasurements.chestCm)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load body review.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!profile) {
      return
    }

    saveStoredMeasurements(profile.id, { waistCm, hipCm, shoulderCm, chestCm })
  }, [chestCm, hipCm, profile, shoulderCm, waistCm])

  const metrics = useMemo(
    () => buildBodyReviewMetrics(profile, waistCm, hipCm, shoulderCm, chestCm),
    [chestCm, hipCm, profile, shoulderCm, waistCm],
  )

  return (
    <DashboardShell
      activeItem="body-review"
      title="Body Review"
      subtitle="Screen body composition indicators from your active profile"
    >
      {isLoading ? <p className="dashboard-card__note">Loading body review...</p> : null}
      {!isLoading && errorMessage ? <p className="dashboard-card__note">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && profile && metrics ? (
        <section className="body-review">
          <BodyMetricCards metrics={metrics} />

          <section className="body-review__content-grid">
            <BodyMeasurementsPanel
              profile={profile}
              metrics={metrics}
              waistCm={waistCm}
              hipCm={hipCm}
              shoulderCm={shoulderCm}
              chestCm={chestCm}
              onWaistChange={setWaistCm}
              onHipChange={setHipCm}
              onShoulderChange={setShoulderCm}
              onChestChange={setChestCm}
            />

            <BodyRiskPanel metrics={metrics} />
          </section>

        </section>
      ) : null}
    </DashboardShell>
  )
}

export default BodyReviewPage
