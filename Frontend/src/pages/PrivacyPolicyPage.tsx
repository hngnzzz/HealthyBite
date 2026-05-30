import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'

function PrivacyPolicyPage() {
  return (
    <AuthLayout pageLabel="Privacy policy page">
      <h1 className="login-panel__title">Privacy policy</h1>
      <p className="login-panel__subtitle">
        HealthyBite uses your account details to create your profile, protect your
        sign-in, and personalize meal planning.
      </p>

      <div className="login-panel__note">
        <p>
          We collect the information you provide during sign-up, including your
          name, email address, mobile number, and password credentials.
        </p>
        <p>
          Your information is used to manage your account, support profile
          features, and contact you about account activity when needed.
        </p>
        <p>
          We do not sell your personal information. Access is limited to services
          required to operate HealthyBite and keep your account available.
        </p>
      </div>

      <p className="login-panel__footer">
        <Link to="/register">Back to sign up</Link>
      </p>
    </AuthLayout>
  )
}

export default PrivacyPolicyPage
