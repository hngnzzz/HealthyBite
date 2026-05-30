import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'

function TermsPage() {
  return (
    <AuthLayout pageLabel="Terms page">
      <h1 className="login-panel__title">Terms</h1>
      <p className="login-panel__subtitle">
        By using HealthyBite, you agree to provide accurate account information
        and use the service for personal meal planning support.
      </p>

      <div className="login-panel__note">
        <p>
          Meal suggestions and nutrition information are provided for general
          wellness planning and are not a substitute for medical advice.
        </p>
        <p>
          You are responsible for keeping your login details secure and for
          reviewing meal choices against your own dietary needs.
        </p>
        <p>
          We may update these terms as HealthyBite changes. Continued use of the
          service means you accept the current terms.
        </p>
      </div>

      <p className="login-panel__footer">
        <Link to="/register">Back to sign up</Link>
      </p>
    </AuthLayout>
  )
}

export default TermsPage
