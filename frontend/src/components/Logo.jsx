export default function Logo({ className, height = 52 }) {
  return (
    <img
      src="/images/addisdr-logo.png"
      alt="AddisDR"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}
