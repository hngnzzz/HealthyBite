import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'

const GOALS = [
  {
    id: 'lose-weight',
    title: 'Lose weight',
    description: 'Balanced meal plans with a calorie-aware structure.',
  },
  {
    id: 'maintain-health',
    title: 'Maintain health',
    description: 'Simple routines to keep your meals nutritious and steady.',
  },
  {
    id: 'gain-muscle',
    title: 'Gain muscle',
    description: 'Protein-forward suggestions to support training and recovery.',
  },
] as const

function ChooseGoalsPage() {
  const navigate = useNavigate()
  const [selectedGoal, setSelectedGoal] = useState<(typeof GOALS)[number]['id'] | ''>(() => {
    const storedGoal = localStorage.getItem('selectedGoal')
    return GOALS.some((goal) => goal.id === storedGoal) ? (storedGoal as (typeof GOALS)[number]['id']) : ''
  })

  function handleContinue() {
    if (!selectedGoal) {
      return
    }

    localStorage.setItem('selectedGoal', selectedGoal)
    navigate('/fill-details')
  }

  const selectedGoalLabel = GOALS.find((goal) => goal.id === selectedGoal)?.title

  return (
    <AuthLayout
      pageLabel="Choose goals page"
      pageClassName="auth-layout--fullscreen"
      shellClassName="auth-layout--fullscreen__shell"
      layoutClassName="auth-layout--fullscreen__layout"
      panelClassName="auth-layout--fullscreen__panel"
      innerClassName="auth-layout--fullscreen__inner"
      visualClassName="auth-layout--fullscreen__visual"
    >
      <section className="goals-panel">
        <p className="goals-eyebrow">Choose your goal</p>
        <h1 className="goals-title">Personalize your HealthyBite plan</h1>
        <p className="goals-subtitle">
          Start with one focus. We&apos;ll use it to tailor your nutrition targets and
          daily meal tracking.
        </p>

        <div className="goals-options" role="list" aria-label="Goal options">
          {GOALS.map((goal) => (
            <button
              className={`goals-option${selectedGoal === goal.id ? ' goals-option--selected' : ''}`}
              type="button"
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
            >
              <span className="goals-option__content">
                <span className="goals-option__title">{goal.title}</span>
                <span className="goals-option__description">{goal.description}</span>
              </span>
              <span className="goals-option__check" aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="goals-actions">
          <button
            className="goals-continue"
            type="button"
            onClick={handleContinue}
            disabled={!selectedGoal}
          >
            Continue
          </button>
        </div>

        <div className="goals-summary" aria-live="polite">
          {selectedGoalLabel ? (
            <p>
              Selected goal: <strong>{selectedGoalLabel}</strong>
            </p>
          ) : (
            <p>Select one option to continue.</p>
          )}
        </div>
      </section>
    </AuthLayout>
  )
}

export default ChooseGoalsPage
