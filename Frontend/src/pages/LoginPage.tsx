import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import facebookIcon from '../assets/images/login/fb.png'
import googleIcon from '../assets/images/login/gg.png'
import instagramIcon from '../assets/images/login/ig.png'
import AuthField from '../components/auth/AuthField'
import AuthLayout from '../components/auth/AuthLayout'
import { EmailIcon, PasswordIcon } from '../components/auth/authIcons'
import { useAuth } from '../auth/useAuth'
import { authService } from '../services/authService'
import { ApiClientError } from '../types/api'

const SOCIAL_ITEMS = [
  { icon: googleIcon, name: 'Google' },
  { icon: facebookIcon, name: 'Facebook' },
  { icon: instagramIcon, name: 'Instagram' },
] as const

const INITIAL_FORM = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof typeof INITIAL_FORM, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage('Please enter your email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      })
      signIn(response.data.data)
      navigate('/dashboard')
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Unable to sign in. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout pageLabel="Login page">
      <h1 className="login-panel__title">Login</h1>

      <form className="login-form" onSubmit={handleSubmit}>
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
          autoComplete="current-password"
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

        <div className="login-form__meta">
          <Link to="/forgot-password">Forget password?</Link>
        </div>

        {errorMessage ? <p className="login-form__error">{errorMessage}</p> : null}

        <button className="login-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="login-panel__divider">or continue with</p>

      <div className="login-socials" aria-label="Social sign in">
        {SOCIAL_ITEMS.map((item) => (
          <button
            className="login-socials__button"
            type="button"
            key={item.name}
            aria-label={item.name}
            title={item.name}
          >
            <img className="login-socials__icon" src={item.icon} alt="" />
          </button>
        ))}
      </div>

      <p className="login-panel__footer">
        Don&apos;t have an account?
        <Link to="/register">Sign up</Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
