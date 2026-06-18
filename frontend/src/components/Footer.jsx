export default function Footer() {
  return (
    <footer className="footer" id="siteFooter">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/images/addisdr-logo.svg" alt="AddisDR" className="logo-img-footer" />
          <p className="footer-tagline">Smart Digital Solutions for Modern Businesses</p>
          <p className="footer-desc">
            Powering the future of Ethiopian businesses by transforming operations through technology.
            AddisNET is a modern platform that helps businesses simplify operations, manage customers, and grow digitally.
            From bookings to business management, we provide smart solutions designed for the digital future —
            helping Ethiopian businesses move from traditional systems to modern digital experiences.
          </p>
        </div>

        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn
            </a>
            <a href="https://www.youtube.com/@VisionTone-z5s/shorts" className="social-link" target="_blank" rel="noopener" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.54 3.6 12 3.6 12 3.6s-7.54 0-9.38.47A3.01 3.01 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.01 3.01 0 0 0 2.12 2.13C4.46 20.4 12 20.4 12 20.4s7.54 0 9.38-.47a3.01 3.01 0 0 0 2.12-2.13A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#071220"/>
              </svg>
              YouTube
            </a>
            <a href="#" className="social-link" aria-label="Telegram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
              </svg>
              Telegram
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 AddisDR. All rights reserved.</p>
      </div>
    </footer>
  )
}
