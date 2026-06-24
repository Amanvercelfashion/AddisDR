export default function AboutModal({ onClose }) {
  return (
    <div className="auth-modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="about-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>
        <h2>About AddisDR</h2>
        <div className="about-content">

          <p>At AddisDR, we believe every business deserves the opportunity to grow, innovate, and thrive in the digital world.</p>

          <p>We exist to bridge the gap between traditional business practices and modern possibilities, helping transform ideas into meaningful digital experiences. Guided by innovation, creativity, and a commitment to excellence, we strive to create solutions that strengthen market presence and help businesses reach wider audiences.</p>

          <p>We believe digital access and innovation should not be limited to large corporations. From small retail shops to large enterprises, we are committed to making modern digital opportunities more accessible, empowering businesses to adapt, grow, and succeed in an increasingly connected world.</p>

          <h3>Mission</h3>
          <p>To provide accessible and effective digital solutions that enable businesses of all sizes to establish a strong digital presence, improve operational efficiency, and transform innovative ideas into scalable digital solutions.</p>

          <h3>Vision</h3>
          <p>To build an interconnected digital ecosystem where businesses are not only individually digitalized but also integrated through shared platforms, collaborative systems, and intelligent information exchange that enable sustainable growth across industries.</p>

          <h3>Our Services</h3>
          <ul>
            <li><strong>Web Development</strong> — Modern and responsive websites, professional online presence, improved customer experience, mobile-friendly and easy to use, designed to support business growth.</li>
            <li><strong>Social Media Management</strong> — Consistent brand presence across platforms, content planning and management, audience engagement and communication, increased visibility and reach, stronger customer relationships.</li>
            <li><strong>Business Automation</strong> — Streamlined business processes, reduced manual and repetitive tasks, improved efficiency and productivity, better organization and workflow management, more time to focus on business growth.</li>
          </ul>

          <p className="about-cta">Get in touch to explore how your business can transition into a more efficient, innovative, and digitally connected future.</p>

          <div className="about-contact">
            <p>Phone: +251 941 958 769</p>
            <p>Email: amanuelahmed3@gmail.com</p>
          </div>

        </div>
      </div>
    </div>
  )
}
