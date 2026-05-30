import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/auth/AuthLayout'
import { onboardingService } from '../services/onboardingService'
import { profileBootstrapService } from '../services/profileBootstrapService'

function PlanReadyPage() {
  const navigate = useNavigate()
  const { setActiveProfileId } = useAuth()
  const draft = onboardingService.getDraft()
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleOpenDashboard() {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const profile = await profileBootstrapService.ensurePrimaryProfile()

      if (!profile) {
        setErrorMessage('Please complete your onboarding details before opening the dashboard.')
        return
      }

      setActiveProfileId(profile.id)
      onboardingService.clearDraft()
      localStorage.removeItem('selectedGoal')
      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to prepare your dashboard.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      pageLabel="Plan ready page"
      pageClassName="auth-layout--fullscreen"
      shellClassName="auth-layout--fullscreen__shell"
      layoutClassName="auth-layout--fullscreen__layout"
      panelClassName="auth-layout--fullscreen__panel"
      innerClassName="auth-layout--fullscreen__inner"
      visualClassName="auth-layout--fullscreen__visual"
    >
      <section className="plan-ready-panel">
        <p className="plan-ready-panel__eyebrow">Well done</p>
        <h1 className="plan-ready-panel__title">Get started to a healthy lifestyle</h1>
        {(draft.fullName || draft.currentWeight || draft.targetWeight || draft.heightCm) && (
          <div className="plan-ready-panel__summary">
            <p>{draft.fullName ? `Profile: ${draft.fullName}` : 'Profile draft saved'}</p>
            <p>
              {draft.currentWeight || '--'} kg to {draft.targetWeight || '--'} kg | {draft.heightCm || '--'} cm
            </p>
          </div>
        )}
        {errorMessage ? <p className="login-form__error">{errorMessage}</p> : null}
        <button
          className="plan-ready-panel__action"
          type="button"
          onClick={() => void handleOpenDashboard()}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Opening dashboard...' : 'Open dashboard'}
        </button>
      </section>
    </AuthLayout>
  )
}

export default PlanReadyPage



