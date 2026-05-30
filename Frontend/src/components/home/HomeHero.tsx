import { Link, useNavigate } from 'react-router-dom'
import heroMealImage from '../../assets/images/home/wh1.png'
import { useAuth } from '../../auth/useAuth'

function HomeHero() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  function handleLogout() {
    signOut()
    navigate('/login')
  }

  return (
    <section className="hero-section">
      <header className="topbar">
        <div className="brand">
          <span className="brand__name">HealthyBite</span>
          <span className="brand__mark" aria-hidden="true">
            leaf
          </span>
        </div>

        <nav className="topbar__nav" aria-label="Primary">
          <Link to="/blog">Blogs</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <button className="topbar__logout" type="button" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <div className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">Pastel nutrition experience</p>
          <h1 className="hero__title">
            <span>Healthy</span> living made easy!!
          </h1>
          <p className="hero__description">
            Get your custom plans, nutrition tracking, meal inspiration, and
            better routines in one calm space designed for everyday use.
          </p>

          {user ? (
            <>
              <div className="hero__actions">
                <Link className="cta-button button-link" to="/dashboard">
                  Continue tracking
                </Link>
                <Link className="ghost-button button-link" to="/profile">
                  My profile
                </Link>
              </div>
              <p className="hero__hint">Welcome back, {user.fullName.split(' ')[0]}!</p>
            </>
          ) : (
            <>
              <div className="hero__actions">
                <Link className="cta-button button-link" to="/login">
                  Sign in
                </Link>
                <Link className="ghost-button button-link" to="/register">
                  Create account
                </Link>
              </div>
              <p className="hero__hint">Sign in to get started today</p>
            </>
          )}
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="plate">
            <img className="plate__image" src={heroMealImage} alt="" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeHero
