import type { ReactNode } from 'react'

interface IconProps {
  children: ReactNode
}

function AuthIcon({ children }: IconProps) {
  return (
    <span className="login-input__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        {children}
      </svg>
    </span>
  )
}

export function UserIcon() {
  return (
    <AuthIcon>
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
        fill="currentColor"
      />
    </AuthIcon>
  )
}

export function PhoneIcon() {
  return (
    <AuthIcon>
      <path
        d="M7.62 3h2.16c.43 0 .8.3.89.71l.74 3.45a.97.97 0 0 1-.28.92l-1.5 1.46a14.54 14.54 0 0 0 4.83 4.83l1.46-1.5a.97.97 0 0 1 .92-.28l3.45.74c.41.09.71.46.71.89v2.16c0 .5-.37.92-.86.99l-1.58.23A16.98 16.98 0 0 1 3.78 6.44L4.01 4.86c.07-.49.49-.86.99-.86Z"
        fill="currentColor"
      />
    </AuthIcon>
  )
}

export function EmailIcon() {
  return (
    <AuthIcon>
      <path
        d="M4 6.75A1.75 1.75 0 0 1 5.75 5h12.5A1.75 1.75 0 0 1 20 6.75v10.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25V6.75Zm1.5.47v.13l6.14 4.5a.63.63 0 0 0 .72 0l6.14-4.5v-.13a.25.25 0 0 0-.25-.25H5.75a.25.25 0 0 0-.25.25Zm13 1.98-5.25 3.84a2.13 2.13 0 0 1-2.5 0L5.5 9.2v8.05c0 .14.11.25.25.25h12.5a.25.25 0 0 0 .25-.25V9.2Z"
        fill="currentColor"
      />
    </AuthIcon>
  )
}

interface PasswordIconProps {
  showPassword: boolean
}

export function PasswordIcon({ showPassword }: PasswordIconProps) {
  return (
    <AuthIcon>
      <path
        d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        fill="currentColor"
      />
      <path
        d="M2.46 12c1.7-3.4 5.1-5.75 9.54-5.75S19.84 8.6 21.54 12c-1.7 3.4-5.1 5.75-9.54 5.75S4.16 15.4 2.46 12Zm1.72 0c1.44 2.54 4.05 4.25 7.82 4.25 3.77 0 6.38-1.71 7.82-4.25-1.44-2.54-4.05-4.25-7.82-4.25-3.77 0-6.38 1.71-7.82 4.25Z"
        fill="currentColor"
      />
      {!showPassword ? (
        <path
          d="M5.5 4.5 19.5 18.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : null}
    </AuthIcon>
  )
}
