import { Link } from 'react-router-dom'
import { storyCards } from './homeData'

function HomeStoriesSection() {
  return (
    <section className="section section--plain" id="stories">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Fresh food stories</p>
        <h2 className="section-heading__title">Invest in your health, body, and confidence</h2>
      </div>

      <div className="story-grid">
        {storyCards.map((story) => (
          <article className="story-card" key={story.text}>
            <div className="story-card__image">
              <img className="story-card__image-content" src={story.image} alt={story.alt} />
            </div>
            <h3>Diet, Fitness</h3>
            <p>{story.text}</p>
            <span>Read more</span>
          </article>
        ))}
      </div>

      <div className="banner-cta">
        <p>Boost your routine with one account, one plan, one calm dashboard.</p>
        <Link className="cta-button button-link" to="/register">
          Start today
        </Link>
      </div>
    </section>
  )
}

export default HomeStoriesSection
