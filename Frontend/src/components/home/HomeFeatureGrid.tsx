import { featureCards } from './homeData'

function HomeFeatureGrid() {
  return (
    <section className="section section--plain" id="features">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Have a HealthyBite for</p>
        <h2 className="section-heading__title">Lifestyle that feels sustainable</h2>
      </div>

      <div className="feature-grid">
        {featureCards.map((card) => (
          <article className="feature-card" key={card.title}>
            <div className="feature-card__icon" aria-hidden="true">
              <img
                className={`feature-card__icon-image ${card.imageClass}`}
                src={card.image}
                alt=""
              />
            </div>
            <div className="feature-card__content">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HomeFeatureGrid
