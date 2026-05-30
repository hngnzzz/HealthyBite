import HomeFeatureGrid from '../components/home/HomeFeatureGrid'
import HomeFooterCta from '../components/home/HomeFooterCta'
import HomeHero from '../components/home/HomeHero'
import HomePlansSection from '../components/home/HomePlansSection'
import HomeReviewSection from '../components/home/HomeReviewSection'
import HomeStoriesSection from '../components/home/HomeStoriesSection'
import HomeWhySection from '../components/home/HomeWhySection'

function HomePage() {
  return (
    <main className="landing-page">
      <HomeHero />
      <HomeWhySection />
      <HomeFeatureGrid />
      <HomePlansSection />
      <HomeStoriesSection />
      <HomeReviewSection />
      <HomeFooterCta />
    </main>
  )
}

export default HomePage
