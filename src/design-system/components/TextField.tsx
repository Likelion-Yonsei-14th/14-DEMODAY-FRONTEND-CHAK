import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'

type FieldFrameProps = {
  id: string
  label?: string
  helper?: string
  error?: string
  required?: boolean
  children: ReactNode
}

function FieldFrame({ id, label, helper, error, required, children }: FieldFrameProps) {
  const message = error ?? helper
  const messageId = message ? `${id}-message` : undefined

  return (
    <label className="ds-field" htmlFor={id}>
      {label && (
        <span className="ds-field__label">
          {label}
          {required && <span className="ds-field__required"> *</span>}
        </span>
      )}
      {children}
      {message && (
        <span
          id={messageId}
          className={error ? 'ds-field__message ds-field__message--error' : 'ds-field__message'}
        >
          {message}
        </span>
      )}
    </label>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label?: string
  helper?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, helper, error, required, className = '', ...props },
  ref,
) {
  const messageId = error || helper ? `${id}-message` : undefined
  return (
    <FieldFrame id={id} label={label} helper={helper} error={error} required={required}>
      <input
        ref={ref}
        id={id}
        className={[
          'ds-field__control',
          error ? 'ds-field__control--error' : '',
          className,
        ].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
        required={required}
        {...props}
      />
    </FieldFrame>
  )
})

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string
  label?: string
  helper?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { id, label, helper, error, required, className = '', rows = 5, ...props },
  ref,
) {
  const messageId = error || helper ? `${id}-message` : undefined
  return (
    <FieldFrame id={id} label={label} helper={helper} error={error} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={[
          'ds-field__control',
          'ds-field__textarea',
          error ? 'ds-field__control--error' : '',
          className,
        ].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
        required={required}
        {...props}
      />
    </FieldFrame>
  )
})
