import { BENEFIT_PAGES, optionLabel, visibleQuestions, type Values } from '../promotion/benefitSurvey'
import type { AdminBenefitDetail } from '@/api/admin'

export type AnswerRow = {
  id: string
  label: string
  /** 여러 개를 고른 문항은 칩으로 보여 주려고 나눠 둔다. */
  items?: string[]
  text?: string
  file?: { name: string; url: string }
}

export type AnswerSection = { title: string; rows: AnswerRow[] }

const IMAGE = /\.(png|jpe?g|svg|webp)$/i
export const isImageName = (name: string) => IMAGE.test(name)

/** 신청서에서 보던 문항 이름 그대로, 다만 운영자에게는 필요 없는 "(필수)·(해당하는 것 모두 선택)" 안내는 뗀다. */
const plainLabel = (label: string) => label.replace(/\s*\((해당하는 것 모두 선택|20자 이내)\)/g, '').replace(/\s*\(필수\)/g, '')

const UNITS: Record<string, string> = { percent: '%', amount: '원', regularPrice: '원', specialPrice: '원', couponQuantity: '개', conditionMinAmount: '원', conditionQuantity: '개', maxCompanions: '명', conditionMaxCompanions: '명' }

/** 답변을 신청서의 페이지 순서대로 묶는다. 답이 없는 문항(고르지 않은 선택지에 딸린 것)은 빠진다. */
export function benefitSections(detail: Pick<AdminBenefitDetail, 'answers' | 'files'>): AnswerSection[] {
  const values = detail.answers as Values
  return BENEFIT_PAGES.map((page) => {
    const rows: AnswerRow[] = []
    for (const question of visibleQuestions(page, values)) {
      const answer = detail.answers[question.id]
      if (answer === undefined) continue
      const label = plainLabel(question.label)
      if (question.kind === 'file') {
        const file = detail.files.find((item) => item.field === question.id)
        rows.push({ id: question.id, label, file: { name: file?.fileName ?? String(answer), url: file?.url ?? '' } })
      } else if (Array.isArray(answer)) {
        rows.push({ id: question.id, label, items: answer.map((code) => optionLabel(question.id, code)) })
      } else if ('options' in question) {
        rows.push({ id: question.id, label, text: optionLabel(question.id, String(answer)) })
      } else {
        const unit = UNITS[question.id]
        rows.push({ id: question.id, label, text: unit ? `${Number(answer).toLocaleString('ko-KR')}${unit}` : String(answer) })
      }
    }
    return { title: page.title, rows }
  }).filter((section) => section.rows.length > 0)
}
