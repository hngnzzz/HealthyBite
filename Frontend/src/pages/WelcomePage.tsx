import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'

function WelcomePage() {
  return (
    <AuthLayout
      pageLabel="Welcome page"
      pageClassName="auth-layout--fullscreen"
      shellClassName="auth-layout--fullscreen__shell"
      layoutClassName="auth-layout--fullscreen__layout"
      panelClassName="auth-layout--fullscreen__panel"
      innerClassName="auth-layout--fullscreen__inner"
      visualClassName="auth-layout--fullscreen__visual"
    >
      <section className="welcome-copy">
        <div className="welcome-copy__badge" aria-hidden="true">
          <span className="welcome-copy__badge-heart" />
        </div>
        <h1 className="welcome-copy__title">Welcome to HealthyBite</h1>
        <p className="welcome-copy__text">
          Your account is ready. Let&apos;s set up your goals and personalize your
          nutrition journey.
        </p>
        <Link className="welcome-copy__start" to="/choose-goals">
          Start
        </Link>
      </section>
    </AuthLayout>
  )
}

export default WelcomePage
