import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  fetchOutreach: vi.fn(),
  createOutreach: vi.fn(),
  updateOutreach: vi.fn(),
  deleteOutreach: vi.fn(),
}))
vi.mock('@/api/adminOutreach', () => api)

import { OutreachPage } from './OutreachPage'
import { contactHref } from './outreachFormat'

const row = {
  id: 1,
  kind: 'STORE' as const,
  storeName: '딥띵커',
  category: '방탈출',
  region: '홍대',
  channel: 'INSTAGRAM' as const,
  contact: '@deepthinker',
  assignee: '다은',
  status: 'TODO' as const,
  note: null,
  lastContactedOn: null,
  updatedByName: '다은',
  createdAt: '2026-11-17T00:00:00Z',
  updatedAt: '2026-11-17T00:00:00Z',
}

describe('store outreach page', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.fetchOutreach.mockResolvedValue([row])
    api.updateOutreach.mockResolvedValue(row)
    api.createOutreach.mockResolvedValue(row)
  })

  it('lists stores with a clickable contact and status counts', async () => {
    render(<OutreachPage />)
    expect(await screen.findByText('딥띵커')).toBeTruthy()
    expect(screen.getByRole('link', { name: '@deepthinker' }).getAttribute('href')).toBe('https://instagram.com/deepthinker')
    expect(screen.getByRole('tab', { name: '연락 전 1' })).toBeTruthy()
  })

  it('changing the status saves it and stamps the first contact date', async () => {
    render(<OutreachPage />)
    fireEvent.change(await screen.findByLabelText('딥띵커 상태'), { target: { value: 'CONTACTED' } })
    await waitFor(() => expect(api.updateOutreach).toHaveBeenCalled())
    const [id, input] = api.updateOutreach.mock.lastCall!
    expect(id).toBe(1)
    expect(input.status).toBe('CONTACTED')
    expect(input.lastContactedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('adds a new store from the form', async () => {
    render(<OutreachPage />)
    await screen.findByText('딥띵커')
    fireEvent.click(screen.getByRole('button', { name: '매장 추가' }))
    fireEvent.change(screen.getByLabelText('매장 이름 *'), { target: { value: '가평 펜션' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(api.createOutreach).toHaveBeenCalledWith(expect.objectContaining({ storeName: '가평 펜션', status: 'TODO' })))
  })

  it('switches to brands and adds a brand by default there', async () => {
    api.fetchOutreach.mockResolvedValue([row, { ...row, id: 2, kind: 'BRAND' as const, storeName: '메가MGC커피' }])
    render(<OutreachPage />)
    expect(await screen.findByText('딥띵커')).toBeTruthy()
    expect(screen.queryByText('메가MGC커피')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: '브랜드 1' }))
    expect(screen.getByText('메가MGC커피')).toBeTruthy()
    expect(screen.queryByText('딥띵커')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '브랜드 추가' }))
    fireEvent.change(screen.getByLabelText('브랜드 이름 *'), { target: { value: '삼성스토어' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() =>
      expect(api.createOutreach).toHaveBeenCalledWith(expect.objectContaining({ kind: 'BRAND', storeName: '삼성스토어', channel: 'EMAIL' })),
    )
  })

  it('turns contacts into links only when the format is known', () => {
    expect(contactHref('EMAIL', 'a@b.com')).toBe('mailto:a@b.com')
    expect(contactHref('PHONE', '02-123-4567')).toBe('tel:021234567')
    expect(contactHref('NAVER_TALK', 'https://talk.naver.com/x')).toBe('https://talk.naver.com/x')
    expect(contactHref('VISIT', '홍대입구 3번 출구')).toBeNull()
  })
})
