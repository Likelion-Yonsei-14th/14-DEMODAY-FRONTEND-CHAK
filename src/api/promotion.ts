import { apiFetch } from '@/api/client'

export type PromotionInquiryInput = {
  company: string
  contactName: string
  email: string
  phone: string
  /** 관심 상품(서버의 interest 값). 고르지 않았으면 빈 문자열. */
  interest: string
  message: string
  consent: boolean
  /** 사람에게는 보이지 않는 칸. 자동 입력 프로그램이 채우면 서버가 저장하지 않는다. */
  website: string
}

/** 광고 상담 신청을 보낸다. 로그인 없이 호출하며, 서버는 같은 회사·이메일의 24시간 안 재전송을 한 건으로 본다. */
export const submitPromotionInquiry = (input: PromotionInquiryInput) =>
  apiFetch<{ received: boolean }>('/api/public/promotion/inquiries', {
    method: 'POST',
    body: {
      company: input.company.trim(),
      contactName: input.contactName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      interest: input.interest || undefined,
      message: input.message.trim(),
      consent: input.consent,
      website: input.website,
    },
  })

export type BenefitUploadPurpose = 'LOGO' | 'SHEET'

type BenefitUpload = {
  key: string
  uploadUrl: string
  method: 'PUT'
  headers: Record<string, string>
}

/** 혜택 시안 신청서에 붙일 파일을 저장소에 올리고, 신청서에 넣을 파일 키를 돌려준다. 로그인 없이 호출한다. */
export async function uploadBenefitFile(purpose: BenefitUploadPurpose, file: File): Promise<string> {
  const upload = await apiFetch<BenefitUpload>('/api/public/promotion/benefit-uploads', {
    method: 'POST',
    body: { purpose, fileName: file.name, size: file.size },
  })
  const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: file })
  if (!response.ok) {
    throw new Error(`upload failed: ${response.status}`)
  }
  return upload.key
}

/** 혜택 시안 신청서를 보낸다. 로그인 없이 호출한다. */
export const submitBenefitSubmission = (answers: Record<string, string | number | string[]>, website: string) =>
  apiFetch<{ received: boolean }>('/api/public/promotion/benefit-submissions', {
    method: 'POST',
    body: { answers, website },
  })
