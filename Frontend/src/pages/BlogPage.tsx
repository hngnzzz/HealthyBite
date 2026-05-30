import { useState } from 'react'
import { Link } from 'react-router-dom'
import { blogPosts, blogTags, type BlogTag } from '../components/blog/blogData'

const ALL_BLOG_TAG = blogTags[0]

function BlogPage() {
  const [activeTag, setActiveTag] = useState<BlogTag>(ALL_BLOG_TAG)

  const filteredPosts =
    activeTag === ALL_BLOG_TAG
      ? blogPosts
      : blogPosts.filter((post) => post.tags.includes(activeTag))

  return (
    <main className="blog-page">
      <section className="blog-shell">
        <header className="blog-header">
          <div>
            <p className="section-heading__eyebrow">HealthyBite blog</p>
            <h1 className="blog-header__title">Health Infographics & Insights</h1>
            <p className="blog-header__subtitle">Learn simple ways to stay healthier every day.</p>
          </div>

          <Link className="ghost-button button-link" to="/">
            Back to home
          </Link>
        </header>

        <div className="blog-filter" aria-label="Filter by tag">
          {blogTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`blog-filter__chip ${activeTag === tag ? 'blog-filter__chip--active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="blog-filter__meta">
          <span>{filteredPosts.length} posts</span>
          <span>Tag: {activeTag}</span>
        </div>

        <div className="blog-grid">
          {filteredPosts.map((post) => (
            <article className="blog-card" key={post.id}>
              <a
                className="blog-card__poster"
                href={post.pdfUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open PDF for ${post.title}`}
              >
                <img className="blog-card__image" src={post.thumbnailUrl} alt={`Thumbnail for ${post.title}`} />
                <span className="blog-card__preview">PDF</span>
              </a>

              <div className="blog-card__body">
                <h2>{post.title}</h2>
                <p>Code: {post.code}</p>
                <p>Publisher: {post.publisher}</p>
                <div className="blog-card__tags">
                  {post.tags.map((tag) => (
                    <span className="blog-card__tag" key={`${post.id}-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <a className="blog-card__link" href={post.pdfUrl} target="_blank" rel="noreferrer">
                  View details →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default BlogPage
