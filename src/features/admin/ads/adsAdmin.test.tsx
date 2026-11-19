import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  fetchAdminAds: vi.fn(),
  fetchAdSwitch: vi.fn(),
  setAdSwitch: vi.fn(),
  createAdminAd: vi.fn(),
  updateAdminAd: vi.fn(),
  fetchAdSummaries: vi.fn(),
  fetchAdReport: vi.fn(),
  uploadAdCreative: vi.fn(),
}))

const desks = vi.hoisted(() => ({ fetchOwnerMessages: vi.fn() }))
vi.mock('@/api/desks', () => desks)

vi.mock('@/api/adminAds', async (original) => ({ ...(await original<typeof import('@/api/adminAds')>()), ...api }))

import { AdsAdminPage } from './AdsAdminPage'
import { adStatus } from './adStatus'

const banner = {
  id: 3,
  title: '수험표 할인 카페',
  creativeUrl: 'https://cdn.example.com/b.webp',
  destinationUrl: 'https://example.com/cafe',
  placement: 'BANNER',
  startsAt: '2026-11-01T00:00:00Z',
  endsAt: '2099-01-01T00:00:00Z',
  active: true,
}

describe('ads admin', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    desks.fetchOwnerMessages.mockReset().mockResolvedValue([])
    api.fetchAdminAds.mockResolvedValue([banner])
    api.fetchAdSwitch.mockResolvedValue({ enabled: false, updatedAt: null })
    api.fetchAdSummaries.mockResolvedValue([{ advertisementId: 3, impressions: 200, reach: 120, clicks: 9 }])
  })

  it('reads status from the active flag and the period', () => {
    const now = Date.parse('2026-11-19T10:00:00Z')
    expect(adStatus({ ...banner, active: false }, now)).toBe('off')
    expect(adStatus({ ...banner, startsAt: '2026-11-20T00:00:00Z' }, now)).toBe('scheduled')
    expect(adStatus({ ...banner, endsAt: '2026-11-18T00:00:00Z' }, now)).toBe('ended')
    expect(adStatus(banner, now)).toBe('live')
  })

  it('keeps registered ads hidden while the switch is off and asks before turning it on', async () => {
    api.setAdSwitch.mockResolvedValue({ enabled: true, updatedAt: '2026-11-19T08:00:00Z' })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AdsAdminPage />)

    const toggle = await screen.findByRole('switch')
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    expect(screen.getByText(/켜면 게재 기간인 배너 1개가 바로 보여요/)).toBeInTheDocument()
    expect(screen.getByText('스위치 켜면 노출')).toBeInTheDocument()
    expect(await screen.findByText(/노출 200회 · 도달 120명 · 클릭 9회/)).toBeInTheDocument()
    expect(screen.getByText(/배너 노출 비중 100%/)).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('지금 보일 배너: 1개'))
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(api.setAdSwitch).toHaveBeenCalledWith(true)
    expect(screen.getByText('노출 중')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('previews the draft banner inside the real pages, even while the switch is off', async () => {
    render(<AdsAdminPage />)
    await screen.findByRole('switch')
    const phone = screen.getByTestId('ad-preview-phone')
    expect(within(phone).getByTitle('홈 미리보기')).toHaveAttribute('src', '/home?adPreview=1')
    expect(screen.getByText(/스위치가 꺼져 있어 지금은 사용자에게 보이지 않아요/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: '수험표 할인 모음' }))
    expect(within(screen.getByTestId('ad-preview-phone')).getByTitle('수험표 할인 모음 미리보기')).toHaveAttribute(
      'src',
      '/discounts?adPreview=1',
    )
    expect(screen.queryByRole('tab', { name: '첫 화면' })).toBeNull()

    // 편지 화면은 운영자의 실제 편지가 아니라 가상의 견본 편지로 보여 준다.
    fireEvent.click(screen.getByRole('tab', { name: '편지 화면' }))
    expect(within(screen.getByTestId('ad-preview-phone')).getByTitle('편지 화면 미리보기')).toHaveAttribute(
      'src',
      '/ad-preview/message/ad-preview-letter?adPreview=1',
    )
  })

  it('offers saving the current screen or all screens as images', async () => {
    render(<AdsAdminPage />)
    await screen.findByRole('switch')
    expect(screen.getByRole('button', { name: '이 화면 이미지로 저장' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '세 화면 한 장으로 저장' })).toBeEnabled()
  })

  it('uploads an image and registers the banner', async () => {
    api.uploadAdCreative.mockResolvedValue('https://www.chak.live/api/public/ads/creatives/5')
    api.createAdminAd.mockImplementation(async (input) => ({ id: 9, ...input }))
    render(<AdsAdminPage />)
    await screen.findByRole('switch')

    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'b.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('이미지 파일 올리기'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByLabelText('이미지 주소')).toHaveValue('https://www.chak.live/api/public/ads/creatives/5'))

    fireEvent.change(screen.getByLabelText('광고 이름 (이미지 대체 글로도 쓰여요)'), { target: { value: '수능 끝 할인' } })
    fireEvent.change(screen.getByLabelText('누르면 갈 주소'), { target: { value: 'https://example.com/sale' } })
    fireEvent.click(screen.getByRole('button', { name: '광고 등록' }))

    await waitFor(() => expect(api.createAdminAd).toHaveBeenCalled())
    expect(api.createAdminAd).toHaveBeenCalledWith(expect.objectContaining({
      title: '수능 끝 할인',
      creativeUrl: 'https://www.chak.live/api/public/ads/creatives/5',
      destinationUrl: 'https://example.com/sale',
      placement: 'BANNER',
      active: true,
    }))
    expect(await screen.findByText('광고를 등록했어요.')).toBeInTheDocument()
  })

  it('rejects non-image files before uploading', async () => {
    render(<AdsAdminPage />)
    await screen.findByRole('switch')
    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })
    fireEvent.change(screen.getByLabelText('이미지 파일 올리기'), { target: { files: [svg] } })
    expect(await screen.findByText('PNG·JPEG·WEBP·GIF 이미지만 올릴 수 있어요.')).toBeInTheDocument()
    expect(api.uploadAdCreative).not.toHaveBeenCalled()
  })
})

describe('ads admin delivery', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    desks.fetchOwnerMessages.mockReset().mockResolvedValue([])
    api.fetchAdminAds.mockResolvedValue([{ ...banner, targetRegions: ['부산'] }])
    api.fetchAdSwitch.mockResolvedValue({ enabled: true, updatedAt: null })
    api.fetchAdSummaries.mockResolvedValue([])
  })

  it('shows nothing for ads without numbers yet and the target region', async () => {
    render(<AdsAdminPage />)
    expect(await screen.findByText(/부산$/)).toBeInTheDocument()
    expect(screen.getAllByText('집계 없음').length).toBeGreaterThan(0)
  })

  it('sends the picked regions, and nationwide when none are picked', async () => {
    api.createAdminAd.mockImplementation(async (input) => ({ id: 9, ...input }))
    render(<AdsAdminPage />)
    await screen.findByRole('switch')
    const regions = screen.getByRole('group', { name: '보여 줄 지역' })
    fireEvent.click(within(regions).getByRole('button', { name: '경기' }))
    fireEvent.click(within(regions).getByRole('button', { name: '서울' }))
    expect(within(regions).getByRole('button', { name: '전국' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.change(screen.getByLabelText('광고 이름 (이미지 대체 글로도 쓰여요)'), { target: { value: '지역 광고' } })
    fireEvent.change(screen.getByLabelText('이미지 주소'), { target: { value: 'https://cdn.example.com/a.png' } })
    fireEvent.change(screen.getByLabelText('누르면 갈 주소'), { target: { value: 'https://example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '광고 등록' }))
    await waitFor(() =>
      expect(api.createAdminAd).toHaveBeenCalledWith(expect.objectContaining({ targetRegions: ['서울', '경기'] })),
    )
  })

  it('opens a report with totals, days and regions, and copies a summary for the advertiser', async () => {
    api.fetchAdReport.mockResolvedValue({
      advertisementId: 3,
      from: '',
      to: '',
      totals: { impressions: 1500, reach: 820, clicks: 30 },
      days: [
        { date: '2026-11-19', impressions: 900, reach: 600, clicks: 20 },
        { date: '2026-11-20', impressions: 600, reach: 400, clicks: 10 },
      ],
      regions: [
        { region: '부산', impressions: 1400, reach: 790, clicks: 29 },
        { region: '알 수 없음', impressions: 100, reach: 30, clicks: 1 },
      ],
    })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<AdsAdminPage />)
    fireEvent.click(await screen.findByRole('button', { name: '보고서' }))
    expect(await screen.findByText('820명')).toBeInTheDocument()
    expect(screen.getByText('11/19')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '광고주용 요약 복사' }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    const text = writeText.mock.calls[0]![0] as string
    expect(text).toContain('11/19 ~ 11/20')
    expect(text).toContain('도달 820명')
    expect(text).toContain('부산 790명')
    expect(text).not.toContain('알 수 없음')
  })
})
