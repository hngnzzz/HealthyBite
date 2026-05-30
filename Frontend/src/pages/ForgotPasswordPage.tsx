import { useState } from 'react'
import AuthField from '../components/auth/AuthField'
import AuthLayout from '../components/auth/AuthLayout'
import { EmailIcon } from '../components/auth/authIcons'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNoticeMessage(
      email.trim()
        ? `Password reset instructions will be sent to ${email.trim()} when the endpoint is available.`
        : 'Please enter your email address.',
    )
  }

  return (
    <AuthLayout pageLabel="Forgot password page">
      <h1 className="login-panel__title">Forget password</h1>
      <p className="login-panel__subtitle">
        Enter an email id associated with your account
      </p>

      <form className="login-form login-form--compact" onSubmit={handleSubmit}>
        <AuthField
          icon={<EmailIcon />}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="abc@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <button className="login-form__submit" type="submit">
          Reset password
        </button>
      </form>

      <p className="login-panel__note">
        {noticeMessage || 'You will shortly receive an email with further instructions'}
      </p>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
