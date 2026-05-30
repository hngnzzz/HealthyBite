import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import AuthField from '../components/auth/AuthField'
import AuthLayout from '../components/auth/AuthLayout'
import {
  EmailIcon,
  PasswordIcon,
  PhoneIcon,
  UserIcon,
} from '../components/auth/authIcons'
import { authService } from '../services/authService'
import { onboardingService } from '../services/onboardingService'
import { ApiClientError } from '../types/api'

const INITIAL_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function RegisterPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    onboardingService.clearDraft()
    localStorage.removeItem('selectedGoal')
  }, [])

  function handleChange(field: keyof typeof INITIAL_FORM, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please complete the required fields.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.register({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        email: formData.email.trim(),
        password: formData.password,
      })
      onboardingService.clearDraft()
      localStorage.removeItem('selectedGoal')
      signIn(response.data.data)
      navigate('/welcome')
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Unable to create your account. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout pageLabel="Register page">
      <h1 className="login-panel__title">Sign up</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <AuthField
          icon={<UserIcon />}
          label="Name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="ABC"
          value={formData.fullName}
          onChange={(event) => handleChange('fullName', event.target.value)}
          required
        />

        <AuthField
          icon={<PhoneIcon />}
          label="Mobile no."
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          placeholder="+84******"
          value={formData.phoneNumber}
          onChange={(event) => handleChange('phoneNumber', event.target.value)}
        />

        <AuthField
          icon={<EmailIcon />}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="abc@gmail.com"
          value={formData.email}
          onChange={(event) => handleChange('email', event.target.value)}
          required
        />

        <AuthField
          icon={<PasswordIcon showPassword={showPassword} />}
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="............"
          value={formData.password}
          onChange={(event) => handleChange('password', event.target.value)}
          required
          rightAction={
            <button
              className="login-input__toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <PasswordIcon showPassword={showPassword} />
            </button>
          }
        />

        <AuthField
          icon={<PasswordIcon showPassword={showConfirmPassword} />}
          label="Confirm password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="............"
          value={formData.confirmPassword}
          onChange={(event) => handleChange('confirmPassword', event.target.value)}
          required
          rightAction={
            <button
              className="login-input__toggle"
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              <PasswordIcon showPassword={showConfirmPassword} />
            </button>
          }
        />

        <p className="login-panel__terms">
          By signing up you agree with the
          <Link to="/privacy-policy"> Privacy policy </Link>
          and
          <Link to="/terms"> Terms </Link>
          of HealthyBite
        </p>

        {errorMessage ? <p className="login-form__error">{errorMessage}</p> : null}

        <button className="login-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Get started'}
        </button>
      </form>

      <p className="login-panel__footer">
        Already have an account?
        <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
