import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  fetchAdminAds: vi.fn(),
  fetchAdSwitch: vi.fn(),
  setAdSwitch: vi.fn(),
  createAdminAd: vi.fn(),
  updateAdminAd: vi.fn(),
  fetchAdMetrics: vi.fn(),
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
    api.fetchAdMetrics.mockResolvedValue({ advertisementId: 3, from: '', to: '', events: { IMPRESSION: 200, CLICK: 9 } })
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
    expect(await screen.findByText('200 · 9')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('지금 보일 배너: 1개'))
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(api.setAdSwitch).toHaveBeenCalledWith(true)
    expect(screen.getByText('노출 중')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('previews the draft banner inside the real pages, even while the switch is off', async () => {
    desks.fetchOwnerMessages.mockResolvedValue([
      { messageId: 11, kind: 'CARD', locked: true },
      { messageId: 12, kind: 'CARD', locked: false },
    ])
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

    // 편지 화면은 운영자 책상에서 열어 볼 수 있는 편지로 보여 준다.
    fireEvent.click(screen.getByRole('tab', { name: '편지 화면' }))
    expect(await within(screen.getByTestId('ad-preview-phone')).findByTitle('편지 화면 미리보기')).toHaveAttribute(
      'src',
      '/my/message/12?adPreview=1',
    )
  })

  it('offers saving the current screen or all screens as images', async () => {
    render(<AdsAdminPage />)
    await screen.findByRole('switch')
    expect(screen.getByRole('button', { name: '이 화면 이미지로 저장' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '세 화면 한 장으로 저장' })).toBeEnabled()
  })

  it('explains when there is no letter to preview', async () => {
    render(<AdsAdminPage />)
    await screen.findByRole('switch')
    fireEvent.click(screen.getByRole('tab', { name: '편지 화면' }))
    expect(await screen.findByText(/열어 볼 수 있는 편지가 없어/)).toBeInTheDocument()
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

describe('ads admin metrics', () => {
  it('survives a metrics response without counts', async () => {
    Object.values(api).forEach((fn) => fn.mockReset())
    desks.fetchOwnerMessages.mockReset().mockResolvedValue([])
    api.fetchAdminAds.mockResolvedValue([banner])
    api.fetchAdSwitch.mockResolvedValue({ enabled: false, updatedAt: null })
    api.fetchAdMetrics.mockResolvedValue({ advertisementId: 3, from: '', to: '' })
    render(<AdsAdminPage />)
    expect(await screen.findByText('0 · 0')).toBeInTheDocument()
  })
})
