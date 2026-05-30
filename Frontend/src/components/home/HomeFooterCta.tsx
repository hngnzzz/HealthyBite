import { Link } from 'react-router-dom'

function HomeFooterCta() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span className="brand__name">HealthyBite</span>
        <span className="brand__mark" aria-hidden="true">
          leaf
        </span>
      </div>

      <nav className="footer__nav" aria-label="Footer">
        <a href="#about">About us</a>
        <Link to="/blog">Blogs</Link>
        <Link to="/login">Sign in</Link>
      </nav>

      <div className="footer__divider" aria-hidden="true" />

      <p className="footer__copyright">
        © 2026 HealthyBite. All Rights Reserved.
      </p>
    </footer>
  )
}

export default HomeFooterCta
