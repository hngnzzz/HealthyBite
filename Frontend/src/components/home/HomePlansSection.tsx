import { Link } from 'react-router-dom'
import { plans } from './homeData'

function HomePlansSection() {
  return (
    <section className="section section--highlight" id="plans">
      <div className="section-heading">
        <p className="section-heading__eyebrow">We have plans for</p>
        <h2 className="section-heading__title">Every goal and every pace</h2>
      </div>

      <div className="plan-strip">
        {plans.map((plan) => (
          <article className="plan-pill" key={plan}>
            <span className="plan-pill__icon" aria-hidden="true" />
            <span>{plan}</span>
          </article>
        ))}
      </div>

      <div className="inline-cta">
        <div>
          <h3>Don&apos;t know what&apos;s the right meal plan?</h3>
          <p>Start with a simple account and let the platform guide the next step.</p>
        </div>
        <Link className="cta-button button-link" to="/login">
          Sign in today
        </Link>
      </div>
    </section>
  )
}

export default HomePlansSection
