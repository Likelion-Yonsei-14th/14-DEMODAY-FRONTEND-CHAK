import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { MinigameNicknameForm } from './MinigameNicknameForm'

const fetchNickname = vi.fn()
const saveNickname = vi.fn()

vi.mock('@/api/minigames', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/minigames')>()),
  fetchMinigameNickname: () => fetchNickname(),
  saveMinigameNickname: (nickname: string) => saveNickname(nickname),
}))

const field = () => screen.getByLabelText(/^닉네임/)
const save = () => screen.getByRole('button', { name: '저장하기' })

beforeEach(() => {
  fetchNickname.mockReset().mockResolvedValue({ nickname: null, defaultNickname: '홍**' })
  saveNickname.mockReset()
})

describe('minigame nickname form', () => {
  it('shows what the ranking uses when no nickname is set yet', async () => {
    render(<MinigameNicknameForm />)
    await waitFor(() => expect(field()).toHaveAttribute('placeholder', '정하지 않으면 홍**'))
    expect(save()).toBeDisabled()
  })

  it('tells the player when a word is not allowed and keeps the form editable', async () => {
    saveNickname.mockRejectedValue(
      new ApiError(400, { code: 'NICKNAME_NOT_ALLOWED', message: '사용할 수 없는 닉네임입니다.' }),
    )
    render(<MinigameNicknameForm />)
    fireEvent.change(field(), { target: { value: '못쓰는말' } })
    fireEvent.click(save())

    expect(await screen.findByText('쓸 수 없는 표현이 들어 있어요. 다른 닉네임을 입력해 주세요.')).toBeInTheDocument()
    expect(field()).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(field(), { target: { value: '다른말' } })
    expect(screen.queryByText(/쓸 수 없는 표현/)).not.toBeInTheDocument()
    expect(save()).toBeEnabled()
  })

  it('checks the format before asking the server', () => {
    render(<MinigameNicknameForm />)
    fireEvent.change(field(), { target: { value: '가' } })
    fireEvent.click(save())
    expect(screen.getByText('닉네임은 2~12자로 입력해 주세요.')).toBeInTheDocument()
    fireEvent.change(field(), { target: { value: '<b>x</b>' } })
    fireEvent.click(save())
    expect(screen.getByText('한글, 영문, 숫자, 밑줄(_)만 쓸 수 있어요.')).toBeInTheDocument()
    expect(saveNickname).not.toHaveBeenCalled()
  })

  it('saves a good nickname and confirms it', async () => {
    saveNickname.mockResolvedValue({ nickname: '찍신왕', defaultNickname: '홍**' })
    render(<MinigameNicknameForm />)
    fireEvent.change(field(), { target: { value: '  찍신왕  ' } })
    fireEvent.click(save())

    expect(await screen.findByText('닉네임을 저장했어요')).toBeInTheDocument()
    expect(saveNickname).toHaveBeenCalledWith('  찍신왕  ')
    expect(field()).toHaveValue('찍신왕')
    expect(save()).toBeDisabled()
  })

  it('explains an expired login and a generic failure differently', async () => {
    saveNickname.mockRejectedValueOnce(new ApiError(401, { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }))
    render(<MinigameNicknameForm />)
    fireEvent.change(field(), { target: { value: '민준' } })
    fireEvent.click(save())
    expect(await screen.findByText('로그인이 만료됐어요. 다시 로그인한 뒤 시도해 주세요.')).toBeInTheDocument()

    saveNickname.mockRejectedValueOnce(new Error('network'))
    fireEvent.click(save())
    expect(await screen.findByText('지금은 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.')).toBeInTheDocument()
  })
})
