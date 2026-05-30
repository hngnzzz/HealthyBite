import type { InputHTMLAttributes, ReactNode } from 'react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode
  label: string
  rightAction?: ReactNode
}

function AuthField({
  icon,
  label,
  rightAction,
  ...inputProps
}: AuthFieldProps) {
  return (
    <label className="login-field">
      <span>{label}</span>
      <div className={`login-input${rightAction ? ' login-input--with-action' : ''}`}>
        <input {...inputProps} />
        {rightAction ?? icon}
      </div>
    </label>
  )
}

export default AuthField
