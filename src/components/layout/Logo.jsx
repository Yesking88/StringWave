import logoImg from '../../assets/logo.png'

export default function Logo({ className = "h-8 w-auto", ...props }) {
  return (
    <svg 
      viewBox="55 340 400 320" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <image 
        href={logoImg} 
        x="0" 
        y="0" 
        width="1024" 
        height="1024" 
      />
    </svg>
  )
}
