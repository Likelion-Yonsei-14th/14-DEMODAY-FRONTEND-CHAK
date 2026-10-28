import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { submitBenefitSubmission, uploadBenefitFile } from '@/api/promotion'
import { PromotionLayout } from './PromotionLayout'
import {
  BENEFIT_DATES,
  BENEFIT_PAGES,
  isVisible,
  toAnswers,
  validatePage,
  visibleQuestions,
  type Page,
  type Question,
  type Values,
} from './benefitSurvey'
import { PROMOTION_CONTACT, promotionStatus, tight } from './promotionContent'

type Phase = 'editing' | 'sending' | 'done'

const DRAFT_KEY = 'chak-benefit-draft'
const MAX_FILE_BYTES = 20 * 1024 * 1024

const errorText = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 429) return '짧은 시간에 너무 많이 보내셨어요. 잠시 뒤에 다시 시도해 주세요.'
    if (error.status === 400) return '입력한 내용을 한 번만 더 확인해 주세요.'
  }
  return `지금은 보내지 못했어요. 잠시 뒤에 다시 시도하시거나 ${PROMOTION_CONTACT.email}로 메일 주세요.`
}

/** 쓰던 내용을 이 탭에 잠깐 보관한다(새로고침해도 이어 쓰게). 파일 키는 보관하지 않는다. */
function readDraft(): Values {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Values) : {}
  } catch {
    return {}
  }
}

function writeDraft(values: Values | null) {
  try {
    if (values) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    else window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // 보관이 막힌 브라우저에서는 그냥 이어 쓰기 없이 쓴다.
  }
}

const withoutFileKeys = (values: Values): Values => {
  const copy = { ...values }
  for (const page of BENEFIT_PAGES) {
    for (const question of page.questions) {
      if (question.kind === 'file') delete copy[question.id]
    }
  }
  return copy
}

type FieldProps = {
  question: Question
  value: string | string[] | undefined
  error: string | undefined
  fileName: string | undefined
  onChange: (id: string, value: string | string[]) => void
  onFile: (question: Extract<Question, { kind: 'file' }>, file: File | null) => void
  uploading: boolean
}

function Field({ question, value, error, fileName, onChange, onFile, uploading }: FieldProps) {
  const id = `benefit-${question.id}`
  const text = typeof value === 'string' ? value : ''
  const list = Array.isArray(value) ? value : []
  const describedBy = [question.hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  const required = question.required ? <em className="promo-required"> (필수)</em> : null
  const hint = question.hint ? <small id={`${id}-hint`}>{question.hint}</small> : null
  const problem = error ? <p id={`${id}-error`} className="promo-field-error" role="alert">{error}</p> : null
  const className = question.sub ? 'promo-field promo-field--sub' : 'promo-field'

  if (question.kind === 'radio' || question.kind === 'checkbox') {
    const multiple = question.kind === 'checkbox'
    return (
      <fieldset className={className} aria-describedby={describedBy} data-field={question.id}>
        <legend>{question.label}{required}</legend>
        {hint}
        {question.options.map((option) => (
          <label key={option.value} className="promo-option">
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={id}
              value={option.value}
              checked={multiple ? list.includes(option.value) : text === option.value}
              onChange={(event) => {
                if (!multiple) return onChange(question.id, option.value)
                onChange(question.id, event.target.checked ? [...list, option.value] : list.filter((item) => item !== option.value))
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
        {problem}
      </fieldset>
    )
  }

  if (question.kind === 'file') {
    return (
      <div className={className} data-field={question.id}>
        <label htmlFor={id}>{question.label}{required}</label>
        {hint}
        <input
          id={id}
          type="file"
          accept={question.accept}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          disabled={uploading}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onFile(question, event.target.files?.[0] ?? null)
            event.target.value = ''
          }}
        />
        {uploading && <p className="promo-note" role="status">올리는 중이에요</p>}
        {fileName && !uploading && (
          <p className="promo-note" role="status">
            올렸어요: {fileName}{' '}
            <button type="button" className="promo-linkbtn" onClick={() => onFile(question, null)}>빼기</button>
          </p>
        )}
        {problem}
      </div>
    )
  }

  const common = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': question.required || undefined,
  } as const

  let control
  if (question.kind === 'select') {
    control = (
      <select {...common} value={text} onChange={(event) => onChange(question.id, event.target.value)}>
        <option value="">선택해 주세요</option>
        {question.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    )
  } else if (question.kind === 'longtext') {
    control = (
      <textarea
        {...common}
        rows={4}
        maxLength={question.max}
        placeholder={question.placeholder}
        value={text}
        onChange={(event) => onChange(question.id, event.target.value)}
      />
    )
  } else if (question.kind === 'number') {
    control = (
      <div className="promo-unit">
        <input
          {...common}
          inputMode="numeric"
          autoComplete="off"
          placeholder={question.placeholder}
          value={text}
          onChange={(event) => onChange(question.id, event.target.value.replace(/[^0-9]/g, ''))}
        />
        {question.unit && <span aria-hidden>{question.unit}</span>}
      </div>
    )
  } else {
    const type = question.kind === 'phone' ? 'tel' : question.kind === 'email' ? 'email' : question.kind === 'url' ? 'url' : question.kind === 'date' ? 'date' : 'text'
    control = (
      <input
        {...common}
        type={type}
        maxLength={'max' in question ? question.max : undefined}
        autoComplete={question.kind === 'phone' ? 'tel' : question.kind === 'email' ? 'email' : question.id === 'brand' ? 'organization' : question.id === 'contactName' ? 'name' : 'off'}
        placeholder={question.placeholder}
        value={text}
        onChange={(event) => onChange(question.id, question.kind === 'phone' ? event.target.value.replace(/[^0-9+\-() ]/g, '') : event.target.value)}
      />
    )
  }

  return (
    <div className={className} data-field={question.id}>
      <label htmlFor={id}>{question.label}{required}</label>
      {hint}
      {control}
      {problem}
    </div>
  )
}

export function PromotionBenefitPage() {
  const closed = promotionStatus() === 'CLOSED'
  const [pageIndex, setPageIndex] = useState(0)
  const [values, setValues] = useState<Values>(readDraft)
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [phase, setPhase] = useState<Phase>('editing')
  const topRef = useRef<HTMLHeadingElement>(null)
  const page = BENEFIT_PAGES[pageIndex] as Page
  const last = pageIndex === BENEFIT_PAGES.length - 1

  useEffect(() => {
    writeDraft(withoutFileKeys(values))
  }, [values])

  useEffect(() => {
    topRef.current?.focus()
    window.scrollTo?.(0, 0)
  }, [pageIndex])

  const change = (id: string, value: string | string[]) => {
    setValues((current) => ({ ...current, [id]: value }))
    setErrors((current) => {
      if (!(id in current)) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const changeFile = async (question: Extract<Question, { kind: 'file' }>, file: File | null) => {
    if (!file) {
      setValues((current) => {
        const next = { ...current }
        delete next[question.id]
        return next
      })
      setFileNames((current) => {
        const next = { ...current }
        delete next[question.id]
        return next
      })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors((current) => ({ ...current, [question.id]: '20MB 이하 파일만 올릴 수 있어요' }))
      return
    }
    setUploading(question.id)
    try {
      const key = await uploadBenefitFile(question.purpose, file)
      setValues((current) => ({ ...current, [question.id]: key }))
      setFileNames((current) => ({ ...current, [question.id]: file.name }))
      setErrors((current) => {
        const next = { ...current }
        delete next[question.id]
        return next
      })
    } catch {
      setErrors((current) => ({ ...current, [question.id]: '파일을 올리지 못했어요. 형식(이미지·PDF·AI, 엑셀·CSV)과 크기를 확인해 주세요' }))
    } finally {
      setUploading(null)
    }
  }

  const focusFirstError = (found: Record<string, string>) => {
    const first = visibleQuestions(page, values).find((question) => found[question.id])
    if (!first) return
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-field="${first.id}"] input, [data-field="${first.id}"] select, [data-field="${first.id}"] textarea, #benefit-${first.id}`)
      target?.focus()
    })
  }

  const next = () => {
    const found = validatePage(page, values)
    setErrors(found)
    if (Object.keys(found).length > 0) return focusFirstError(found)
    setPageIndex((index) => index + 1)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!last) return next()
    const found = validatePage(page, values)
    setErrors(found)
    if (Object.keys(found).length > 0) return focusFirstError(found)
    if (!consent || uploading) return
    setPhase('sending')
    setFormError(null)
    try {
      await submitBenefitSubmission(toAnswers(values), website)
      writeDraft(null)
      setPhase('done')
    } catch (failure) {
      setFormError(errorText(failure))
      setPhase('editing')
    }
  }

  if (phase === 'done') {
    return (
      <PromotionLayout title="혜택 정보를 받았어요 · 착">
        <main className="promo-form-page">
          <div className="promo-done" role="status">
            <h1>제출해 주셔서 감사합니다!</h1>
            <p>
              {tight(`${BENEFIT_DATES.proposalBy}까지 담당자 이메일로 광고 시안을 보내드릴게요. 시안을 받으신 뒤 3일 안에 수정 요청이 없으면 그대로 게재됩니다.`)}
            </p>
            <p>
              궁금한 점은 <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>로 편하게 메일 주세요.
            </p>
            <Link className="promo-btn" to="/promotion">제안서로 돌아가기</Link>
          </div>
        </main>
      </PromotionLayout>
    )
  }

  return (
    <PromotionLayout title="2027 수능 수험생 혜택 참여 신청 · 착">
      <main className="promo-form-page">
        <p className="promo-back"><Link to="/promotion/apply">← 신청 종류 다시 고르기</Link></p>
        <h1 tabIndex={-1} ref={topRef}>2027 수능 수험생 혜택 참여 신청</h1>
        <p className="promo-form-page__lead">
          {tight(`수능을 마친 수험생들을 위한 '착 수험생 혜택함'에 소개할 혜택 정보를 받고 있어요. ${BENEFIT_DATES.sendBy}까지 보내주시면 ${BENEFIT_DATES.proposalBy}까지 광고 시안을 보내드립니다. 작성에는 약 3분 걸려요.`)}
        </p>

        {closed ? (
          <p className="promo-error" role="alert">
            이번 시즌 접수는 마감했어요. 다음 시즌 제휴는 <a href={`mailto:${PROMOTION_CONTACT.email}`}>{PROMOTION_CONTACT.email}</a>로 문의해 주세요.
          </p>
        ) : (
          <form className="promo-form promo-survey" onSubmit={submit} noValidate>
            <p className="promo-progress" aria-live="polite">
              {pageIndex + 1} / {BENEFIT_PAGES.length} · {page.title}
            </p>

            {page.questions.filter((question) => isVisible(question, values)).map((question) => (
              <Field
                key={question.id}
                question={question}
                value={values[question.id]}
                error={errors[question.id]}
                fileName={fileNames[question.id]}
                onChange={change}
                onFile={changeFile}
                uploading={uploading === question.id}
              />
            ))}

            {last && (
              <>
                {/* 자동 입력 프로그램만 채우는 숨은 칸 */}
                <div className="promo-trap" aria-hidden>
                  <label>
                    웹사이트
                    <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
                  </label>
                </div>
                <label className="promo-consent">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                  <span>
                    시안 전달을 위해 담당자 이름·연락처·이메일을 받는 데 동의해요. 접수 1년 뒤에 지우고, 자세한 내용은{' '}
                    <Link to="/privacy" target="_blank">개인정보처리방침</Link>에 있어요.
                  </span>
                </label>
              </>
            )}

            {Object.keys(errors).length > 0 && (
              <p className="promo-error" role="alert">빨간 안내가 있는 칸을 확인해 주세요.</p>
            )}
            {formError && <p className="promo-error" role="alert">{formError}</p>}

            <div className="promo-survey__nav">
              {pageIndex > 0 && (
                <button type="button" className="promo-btn promo-btn--ghost" onClick={() => setPageIndex((index) => index - 1)}>
                  이전
                </button>
              )}
              <button
                type="submit"
                className="promo-btn"
                disabled={phase === 'sending' || uploading !== null || (last && !consent)}
              >
                {last ? (phase === 'sending' ? '보내는 중' : '제출하기') : '다음'}
              </button>
            </div>
          </form>
        )}
      </main>
    </PromotionLayout>
  )
}
