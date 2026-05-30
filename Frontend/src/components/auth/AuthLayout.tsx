import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import loginVisual from '../../assets/images/login/l.png'

interface AuthLayoutProps {
  children: ReactNode
  pageLabel: string
  pageClassName?: string
  shellClassName?: string
  layoutClassName?: string
  panelClassName?: string
  innerClassName?: string
  visualClassName?: string
}

function AuthLayout({
  children,
  pageLabel,
  pageClassName = '',
  shellClassName = '',
  layoutClassName = '',
  panelClassName = '',
  innerClassName = '',
  visualClassName = '',
}: AuthLayoutProps) {
  return (
    <main className={`login-page ${pageClassName}`.trim()}>
      <section className={`login-shell ${shellClassName}`.trim()} aria-label={pageLabel}>
        <header className="login-topbar">
          <Link className="brand login-topbar__brand" to="/">
            <span className="brand__name">HealthyBite</span>
            <span className="brand__mark" aria-hidden="true">
              leaf
            </span>
          </Link>

          <nav className="login-topbar__nav" aria-label={`${pageLabel} navigation`}>
            <Link to="/blog">Blogs</Link>
          </nav>
        </header>

        <div className={`login-layout ${layoutClassName}`.trim()}>
          <section className={`login-panel ${panelClassName}`.trim()}>
            <div className={`login-panel__inner ${innerClassName}`.trim()}>{children}</div>
          </section>

          <div className={`login-visual ${visualClassName}`.trim()} aria-hidden="true">
            <img className="login-visual__image" src={loginVisual} alt="" />
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
