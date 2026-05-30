import { benefitItems } from './homeData'
import whyHealthyImage1 from '../../assets/images/home/whyhealthy1.png'
import whyHealthyImage2 from '../../assets/images/home/whyhealthy2.jpg'
import whyHealthyImage3 from '../../assets/images/home/whyhealthy3.jpg'

function HomeWhySection() {
  return (
    <section className="section section--soft" id="about">
      <div className="why-grid">
        <div>
          <p className="section-label">Why HealthyBite</p>
          <h2 className="why-grid__title">Healthier choices without the noise</h2>
          <ul className="check-list">
            {benefitItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mosaic" aria-hidden="true">
          <div className="mosaic__card mosaic__card--tall">
            <img className="mosaic__image" src={whyHealthyImage1} alt="" />
          </div>
          <div className="mosaic__card">
            <img className="mosaic__image" src={whyHealthyImage2} alt="" />
          </div>
          <div className="mosaic__card mosaic__card--wide">
            <img className="mosaic__image" src={whyHealthyImage3} alt="" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeWhySection
