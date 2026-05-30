import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { onboardingService } from '../services/onboardingService'
import type { OnboardingDraft } from '../types/onboarding'

const INITIAL_FORM: OnboardingDraft = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  currentWeight: '',
  targetWeight: '',
  heightCm: '',
}

const MONTH_OPTIONS = [
  { value: '01', label: '01' },
  { value: '02', label: '02' },
  { value: '03', label: '03' },
  { value: '04', label: '04' },
  { value: '05', label: '05' },
  { value: '06', label: '06' },
  { value: '07', label: '07' },
  { value: '08', label: '08' },
  { value: '09', label: '09' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
] as const

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 120 }, (_, index) => String(CURRENT_YEAR - index))

interface DateOfBirthParts {
  day: string
  month: string
  year: string
}

function parseDateOfBirthParts(value: string): DateOfBirthParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return {
      day: '',
      month: '',
      year: '',
    }
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  }
}

function getDaysInMonth(year: string, month: string) {
  if (!year || !month) {
    return 31
  }

  return new Date(Number(year), Number(month), 0).getDate()
}

function buildDateOfBirthValue(parts: DateOfBirthParts) {
  const { day, month, year } = parts

  if (!day || !month || !year) {
    return ''
  }

  const maxDay = getDaysInMonth(year, month)
  if (Number(day) > maxDay) {
    return ''
  }

  const normalized = `${year}-${month}-${day}`
  const parsed = new Date(`${normalized}T00:00:00`)

  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
    return ''
  }

  return normalized
}

function FillDetailsPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<OnboardingDraft>(() => {
    const draft = onboardingService.getDraft()
    return draft.fullName || draft.dateOfBirth || draft.currentWeight || draft.targetWeight || draft.heightCm
      ? draft
      : INITIAL_FORM
  })
  const [dateOfBirthParts, setDateOfBirthParts] = useState<DateOfBirthParts>(() =>
    parseDateOfBirthParts(onboardingService.getDraft().dateOfBirth),
  )
  const [errorMessage, setErrorMessage] = useState('')

  function handleChange(field: keyof OnboardingDraft, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleDateOfBirthPartChange(field: keyof DateOfBirthParts, value: string) {
    setErrorMessage('')
    setDateOfBirthParts((current) => {
      const nextParts = {
        ...current,
        [field]: value,
      }

      if (
        field !== 'day' &&
        nextParts.day &&
        Number(nextParts.day) > getDaysInMonth(nextParts.year, nextParts.month)
      ) {
        nextParts.day = ''
      }

      const dateOfBirth = buildDateOfBirthValue(nextParts)
      setFormData((currentForm) => ({ ...currentForm, dateOfBirth }))

      return nextParts
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const dateOfBirth = buildDateOfBirthValue(dateOfBirthParts)
    if (!dateOfBirth) {
      setErrorMessage('Please select a valid date of birth.')
      return
    }

    const payload = {
      ...formData,
      fullName: formData.fullName.trim(),
      dateOfBirth,
    }

    onboardingService.saveDraft(payload)
    navigate('/plan-ready')
  }

  const availableDays = Array.from(
    { length: getDaysInMonth(dateOfBirthParts.year, dateOfBirthParts.month) },
    (_, index) => String(index + 1).padStart(2, '0'),
  )

  return (
    <AuthLayout
      pageLabel="Fill details page"
      pageClassName="auth-layout--fullscreen"
      shellClassName="auth-layout--fullscreen__shell"
      layoutClassName="auth-layout--fullscreen__layout"
      panelClassName="auth-layout--fullscreen__panel"
      innerClassName="auth-layout--fullscreen__inner"
      visualClassName="auth-layout--fullscreen__visual"
    >
      <section className="details-panel">
        <h1 className="details-panel__title">Fill up your details</h1>

        <form className="details-form" onSubmit={handleSubmit}>
          <label className="details-field">
            <span>Full name</span>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your name here"
              value={formData.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              required
            />
          </label>

          <label className="details-field">
            <span>Date of birth</span>
            <div className="details-date" role="group" aria-label="Date of birth">
              <select
                name="birthDay"
                value={dateOfBirthParts.day}
                onChange={(event) => handleDateOfBirthPartChange('day', event.target.value)}
                required
              >
                <option value="">Day</option>
                {availableDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              <select
                name="birthMonth"
                value={dateOfBirthParts.month}
                onChange={(event) => handleDateOfBirthPartChange('month', event.target.value)}
                required
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                name="birthYear"
                value={dateOfBirthParts.year}
                onChange={(event) => handleDateOfBirthPartChange('year', event.target.value)}
                required
              >
                <option value="">Year</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <fieldset className="details-fieldset">
            <legend>Gender</legend>
            <label className="details-radio">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === 'male'}
                onChange={(event) => handleChange('gender', event.target.value)}
              />
              <span>Male</span>
            </label>

            <label className="details-radio">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === 'female'}
                onChange={(event) => handleChange('gender', event.target.value)}
              />
              <span>Female</span>
            </label>
          </fieldset>

          <label className="details-field">
            <span>Current weight</span>
            <input
              type="number"
              min="1"
              step="0.1"
              name="currentWeight"
              placeholder="Enter your current weight in kgs"
              value={formData.currentWeight}
              onChange={(event) => handleChange('currentWeight', event.target.value)}
              required
            />
          </label>

          <label className="details-field">
            <span>Your goal</span>
            <input
              type="number"
              min="1"
              step="0.1"
              name="targetWeight"
              placeholder="Enter your desired weight in kgs"
              value={formData.targetWeight}
              onChange={(event) => handleChange('targetWeight', event.target.value)}
              required
            />
          </label>

          <label className="details-field">
            <span>Height</span>
            <input
              type="number"
              min="1"
              step="0.1"
              name="heightCm"
              placeholder="Enter your height in cm"
              value={formData.heightCm}
              onChange={(event) => handleChange('heightCm', event.target.value)}
              required
            />
          </label>

          {errorMessage ? <p className="login-form__error">{errorMessage}</p> : null}

          <button className="details-form__submit" type="submit">
            Create my plan
          </button>
        </form>
      </section>
    </AuthLayout>
  )
}

export default FillDetailsPage
