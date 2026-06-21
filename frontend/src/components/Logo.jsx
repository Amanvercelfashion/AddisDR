export default function Logo({ className, height = 78 }) {
  return (
    <img
      src="/images/addisdr-logo.png"
      alt="AddisDR"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}
