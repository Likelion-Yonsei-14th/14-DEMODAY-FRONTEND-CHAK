import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationProvider } from '@/design-system/overlays'
import type { Board, GameState, Piece } from './deskBlastEngine'

const api = vi.hoisted(() => ({
  createDeskBlastRound: vi.fn(),
  submitDeskBlastRound: vi.fn(),
  fetchDeskBlastLeaderboard: vi.fn(),
}))
vi.mock('@/api/minigames', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api/minigames')>()), ...api }))

const share = vi.hoisted(() => ({ renderBlastShareImage: vi.fn(), downloadBlob: vi.fn() }))
vi.mock('./deskBlastShareImage', async (importOriginal) => ({ ...(await importOriginal<typeof import('./deskBlastShareImage')>()), ...share }))

const engine = vi.hoisted(() => ({ next: null as GameState | null }))
vi.mock('./deskBlastEngine', async (importOriginal) => {
  const real = await importOriginal<typeof import('./deskBlastEngine')>()
  return { ...real, createGame: (rng?: () => number) => engine.next ?? real.createGame(rng) }
})

const sound = vi.hoisted(() => ({
  muted: false,
  unlockAudio: vi.fn(),
  playPick: vi.fn(),
  playPlace: vi.fn(),
  playClear: vi.fn(),
  playAllClear: vi.fn(),
  playComboBreak: vi.fn(),
  playGameOver: vi.fn(),
  playNewBest: vi.fn(),
  setMuted: vi.fn((value: boolean) => {
    sound.muted = value
  }),
}))
vi.mock('./deskBlastSound', () => ({ ...sound, isMuted: () => sound.muted }))

import { DeskBlastPage } from './DeskBlastPages'

const SIZE = 8
const piece = (id: number, rows: string[], kind = 1): Piece => {
  const shape: Array<[number, number]> = []
  rows.forEach((line, r) => Array.from(line).forEach((char, c) => char === '#' && shape.push([r, c])))
  return { id, shape, rows: rows.length, cols: Math.max(...rows.map((line) => line.length)), kind }
}
const boardOf = (filled: Array<[number, number]>): Board =>
  Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => (filled.some(([fr, fc]) => fr === r && fc === c) ? 2 : 0)))
const row = (r: number, skip: number[] = []) =>
  Array.from({ length: SIZE }, (_, c) => [r, c] as [number, number]).filter(([, c]) => !skip.includes(c))
const state = (overrides: Partial<GameState>): GameState => ({
  board: boardOf([]),
  placed: [],
  hand: [piece(1, ['#']), piece(2, ['##']), piece(3, ['###'])],
  score: 0,
  combo: 0,
  missStreak: 0,
  bestCombo: 0,
  lines: 0,
  placements: 0,
  status: 'playing',
  nextPieceId: 4,
  ...overrides,
})

/** A checkerboard: no line is full and no pair fits, so one move ends the game. */
const lastMove = () =>
  state({
    board: boardOf(Array.from({ length: SIZE }, (_, r) => row(r)).flat().filter(([r, c]) => (r + c) % 2 === 0)),
    hand: [piece(1, ['#']), piece(2, ['##']), null],
    score: 40,
    lines: 3,
    bestCombo: 2,
    placements: 9,
  })

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderPage(path = '/minigame/desk-blast') {
  return render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/minigame/desk-blast" element={<DeskBlastPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </NotificationProvider>,
  )
}

function pointer(target: Element | Window, type: string, x: number, y: number, pointerId = 1) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: x },
    clientY: { value: y },
  })
  act(() => {
    target.dispatchEvent(event)
  })
}

const cell = (r: number, c: number) => screen.getByLabelText(new RegExp(`^${r + 1}행 ${c + 1}열`))
const tapPiece = (slot: number) => {
  pointer(screen.getByTestId(`blast-piece-${slot}`), 'pointerdown', 10, 10)
  pointer(window, 'pointerup', 10, 10)
}
const score = () => screen.getByTestId('blast-score').textContent

/** Gives the board a size in jsdom: 320px wide, so a cell is 40px. */
function sizeBoard() {
  screen.getByTestId('blast-board').getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 320, height: 320, right: 320, bottom: 320, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
}

/** Drags the piece in `slot` so it lands with its top-left cell on (row, col). */
function dragTo(slot: number, r: number, c: number, p: Piece) {
  sizeBoard()
  const piece = screen.getByTestId(`blast-piece-${slot}`)
  pointer(piece, 'pointerdown', 200, 500)
  // The preview floats above the finger by its height plus the lift, centered on it.
  const x = c * 40 + (p.cols * 40) / 2
  const y = r * 40 + p.rows * 40 + 56
  pointer(window, 'pointermove', x, y)
  pointer(window, 'pointerup', x, y)
}

beforeEach(() => {
  window.localStorage.clear()
  sound.muted = false
  for (const fn of Object.values(sound)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as ReturnType<typeof vi.fn>).mockClear()
  engine.next = null
  api.createDeskBlastRound.mockReset().mockResolvedValue({ roundId: 'round-1', expiresAt: '2099-01-01T00:00:00Z' })
  api.submitDeskBlastRound.mockReset().mockResolvedValue({ score: 41, ranked: false, rank: null })
  api.fetchDeskBlastLeaderboard.mockReset().mockResolvedValue({ period: 'daily', entries: [], me: null })
  share.renderBlastShareImage.mockReset().mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
  share.downloadBlob.mockReset()
  Element.prototype.scrollTo = vi.fn()
})

describe('starting', () => {
  it('opens straight into a game with a score of zero and three pieces', () => {
    renderPage()

    expect(score()).toBe('0')
    expect(screen.getByTestId('blast-combo')).toHaveTextContent('0')
    for (const slot of [0, 1, 2]) expect(screen.getByTestId(`blast-piece-${slot}`)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^\d+행 \d+열/ })).toHaveLength(SIZE * SIZE)
  })

  it('shows the one-line hint the first time only, and a tap on a piece clears it for good', () => {
    const first = renderPage()
    expect(screen.getByText('블록을 책상에 놓고 가로·세로 한 줄을 정리해보세요.')).toBeInTheDocument()

    tapPiece(0)
    expect(screen.queryByText('블록을 책상에 놓고 가로·세로 한 줄을 정리해보세요.')).toBeNull()
    first.unmount()

    renderPage()
    expect(screen.queryByText('블록을 책상에 놓고 가로·세로 한 줄을 정리해보세요.')).toBeNull()
  })

  it('asks the server for a round without waiting for it', async () => {
    renderPage()

    await waitFor(() => expect(api.createDeskBlastRound).toHaveBeenCalledTimes(1))
  })

  it('plays on when the server cannot be reached', async () => {
    api.createDeskBlastRound.mockRejectedValue(new Error('down'))
    engine.next = state({})
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(3, 3))

    expect(score()).toBe('1')
  })

  it('goes home from the app bar', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '홈 화면으로 돌아가기' }))

    expect(screen.getByTestId('where')).toHaveTextContent('/')
  })
})

describe('placing by tapping', () => {
  beforeEach(() => {
    engine.next = state({})
  })

  it('puts the chosen piece on the tapped cell and scores one point per cell', () => {
    renderPage()

    tapPiece(2)
    expect(screen.getByRole('button', { name: /^블록 3/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(cell(4, 4))

    expect(score()).toBe('3')
    expect(cell(4, 3)).toHaveAccessibleName(/채워짐/)
    expect(cell(4, 4)).toHaveAccessibleName(/채워짐/)
    expect(cell(4, 5)).toHaveAccessibleName(/채워짐/)
    expect(screen.queryByTestId('blast-piece-2')).toBeNull()
  })

  it('does nothing when no piece is chosen', () => {
    renderPage()

    fireEvent.click(cell(4, 4))

    expect(score()).toBe('0')
  })

  it('tapping the same piece again lets go of it', () => {
    renderPage()

    tapPiece(0)
    tapPiece(0)
    fireEvent.click(cell(1, 1))

    expect(score()).toBe('0')
  })

  it('says so and keeps the piece when the spot is taken', () => {
    renderPage()
    tapPiece(0)
    fireEvent.click(cell(2, 2))
    tapPiece(1)

    fireEvent.click(cell(2, 2))

    expect(score()).toBe('1')
    expect(screen.getByText('그 자리에는 놓을 수 없어요.')).toBeInTheDocument()
    expect(screen.getByTestId('blast-piece-1')).toBeInTheDocument()
  })

  it('keeps a piece on the desk when tapped near the edge', () => {
    renderPage()

    tapPiece(2)
    fireEvent.click(cell(0, 0))

    expect(score()).toBe('3')
    expect(cell(0, 0)).toHaveAccessibleName(/채워짐/)
    expect(cell(0, 2)).toHaveAccessibleName(/채워짐/)
  })

  it('can also be done from the keyboard', () => {
    renderPage()

    fireEvent.keyDown(screen.getByTestId('blast-piece-0'), { key: 'Enter' })
    fireEvent.click(cell(5, 5))

    expect(score()).toBe('1')
  })
})

describe('placing by dragging', () => {
  beforeEach(() => {
    engine.next = state({})
  })

  it('drops the piece where its preview sits above the finger', () => {
    renderPage()

    dragTo(1, 3, 2, piece(2, ['##']))

    expect(score()).toBe('2')
    expect(cell(3, 2)).toHaveAccessibleName(/채워짐/)
    expect(cell(3, 3)).toHaveAccessibleName(/채워짐/)
    expect(cell(3, 4)).not.toHaveAccessibleName(/채워짐/)
  })

  it('shows a preview while dragging and takes it away on release', () => {
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    expect(screen.queryByTestId('blast-drag')).toBeNull()
    pointer(window, 'pointermove', 100, 300)
    expect(screen.getByTestId('blast-drag')).toBeInTheDocument()
    pointer(window, 'pointerup', 100, 300)

    expect(screen.queryByTestId('blast-drag')).toBeNull()
  })

  it('floats the preview above the finger', () => {
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 200, 300)
    const top = parseFloat(screen.getByTestId('blast-drag').style.top)

    expect(top).toBeLessThan(300 - 40)
  })

  it('does not place anything when released off the desk, and keeps the piece', () => {
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 200, 700)
    pointer(window, 'pointerup', 200, 700)

    expect(score()).toBe('0')
    expect(screen.getByTestId('blast-piece-0')).toBeInTheDocument()
  })

  it('does not place onto a taken cell', () => {
    renderPage()
    tapPiece(0)
    fireEvent.click(cell(3, 2))

    dragTo(1, 3, 2, piece(2, ['##']))

    expect(score()).toBe('1')
    expect(screen.getByTestId('blast-piece-1')).toBeInTheDocument()
  })

  it('treats a cancelled touch as no move', () => {
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 100, 300)
    pointer(window, 'pointercancel', 100, 300)

    expect(screen.queryByTestId('blast-drag')).toBeNull()
    expect(score()).toBe('0')
  })

  it('ignores a second finger while one is dragging', () => {
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500, 1)
    pointer(screen.getByTestId('blast-piece-1'), 'pointerdown', 250, 500, 2)
    pointer(window, 'pointermove', 100, 300, 2)

    expect(screen.queryByTestId('blast-drag')).toBeNull()
  })

  it('a small wobble is still a tap, not a drag', () => {
    renderPage()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 203, 502)
    pointer(window, 'pointerup', 203, 502)

    expect(screen.getByRole('button', { name: /^블록 1/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('blast-drag')).toBeNull()
  })
})

describe('clearing and combo', () => {
  it('clears a finished row, adds the line score, and starts a combo', () => {
    engine.next = state({ board: boardOf([...row(0, [0]), [7, 7]]) })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(score()).toBe(String(1 + 10))
    expect(screen.getByTestId('blast-combo')).toHaveTextContent('1')
    expect(cell(0, 3)).not.toHaveAccessibleName(/채워짐/)
    expect(screen.getByText('+11')).toBeInTheDocument()
  })

  it('shows the combo phrase from the second clear in a row', () => {
    engine.next = state({ board: boardOf([...row(0, [0]), [7, 7]]), combo: 1 })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(screen.getByText('2 COMBO')).toBeInTheDocument()
    expect(screen.getByText('정리 좀 치는데?')).toBeInTheDocument()
  })

  it('names the bigger combos with their own phrases', () => {
    engine.next = state({ board: boardOf([...row(0, [0]), [7, 7]]), combo: 4 })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(screen.getByText('5 COMBO')).toBeInTheDocument()
    expect(screen.getByText('책상만 전교 1등')).toBeInTheDocument()
  })

  it('says nothing special for a single clear', () => {
    engine.next = state({ board: boardOf([...row(0, [0]), [7, 7]]) })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(screen.queryByText(/COMBO/)).toBeNull()
  })

  it('celebrates an empty desk', () => {
    engine.next = state({ board: boardOf(row(0, [0])) })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(screen.getByText('책상이 텅 비었어요')).toBeInTheDocument()
  })

  it('highlights where a dragged piece would land and which line it would finish', () => {
    engine.next = state({ board: boardOf([...row(5, [3]), [7, 7]]) })
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 3 * 40 + 20, 5 * 40 + 40 + 56)

    expect(cell(5, 3).className).toContain('blast-cell--ghost')
    expect(cell(5, 0).className).toContain('blast-cell--will-clear')
    expect(cell(2, 2).className).not.toContain('blast-cell--ghost')
  })

  it('shows no landing spot while the piece is over a taken cell', () => {
    engine.next = state({ board: boardOf([[5, 3]]) })
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 3 * 40 + 20, 5 * 40 + 40 + 56)

    expect(document.querySelectorAll('.blast-cell--ghost')).toHaveLength(0)
  })
})

describe('the desk getting tidier', () => {
  it('removes clutter one item at a time as the score passes each mark, without touching the rules', () => {
    engine.next = state({ score: 0 })
    const view = renderPage()
    expect(screen.getByTestId('clutter-coffee')).toHaveAttribute('data-cleared', 'false')
    view.unmount()

    engine.next = state({ score: 1600 })
    renderPage()

    expect(screen.getByTestId('clutter-coffee')).toHaveAttribute('data-cleared', 'true')
    expect(screen.getByTestId('clutter-sticky')).toHaveAttribute('data-cleared', 'true')
    expect(screen.getByTestId('clutter-eraser')).toHaveAttribute('data-cleared', 'false')
    expect(screen.getByTestId('clutter-workbook')).toHaveAttribute('data-cleared', 'false')
  })

  it('keeps the clutter out of the way of play', () => {
    renderPage()

    expect(document.querySelector('.blast-clutter')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('the end', () => {
  beforeEach(() => {
    engine.next = lastMove()
  })

  const finish = async () => {
    tapPiece(0)
    fireEvent.click(cell(0, 1))
    return screen.findByRole('dialog', { name: '게임 결과' }, { timeout: 3000 })
  }

  it('shows the result card with the type, score, best combo, lines and play time', async () => {
    renderPage()

    const dialog = await finish()

    expect(within(dialog).getByTestId('blast-type')).toHaveTextContent('책상 방치형')
    expect(within(dialog).getByTestId('blast-final-score')).toHaveTextContent('41')
    expect(within(dialog).getByText('2콤보')).toBeInTheDocument()
    expect(within(dialog).getByText('3줄')).toBeInTheDocument()
    expect(within(dialog).getByText('플레이 시간')).toBeInTheDocument()
    expect(within(dialog).getByText('첫 기록이에요')).toBeInTheDocument()
    expect(within(dialog).getByText('최고 기록!')).toBeInTheDocument()
  })

  it('picks the type by score', async () => {
    engine.next = { ...lastMove(), score: 4999 }
    renderPage()

    const dialog = await finish()

    expect(within(dialog).getByTestId('blast-type')).toHaveTextContent('책상정리 고인물')
  })

  it('keeps the best score and compares the next game with it', async () => {
    renderPage()
    const dialog = await finish()
    expect(within(dialog).getByText('최고 기록!')).toBeInTheDocument()
    expect(window.localStorage.getItem('chak:desk-blast:best')).toContain('41')

    engine.next = { ...lastMove(), score: 10 }
    fireEvent.click(within(dialog).getByRole('button', { name: /다시 정리하기/ }))
    const again = await finish()

    expect(within(again).queryByText('최고 기록!')).toBeNull()
    expect(within(again).getByText('최고 기록까지 30점 남았어요')).toBeInTheDocument()
  })

  it('waits a moment so the last clear can play before the card covers the desk', async () => {
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 1))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(await screen.findByRole('dialog', { name: '게임 결과' }, { timeout: 3000 })).toBeInTheDocument()
  })

  it('sends the finished game to the server once, with what the server needs to check it', async () => {
    renderPage()
    await waitFor(() => expect(api.createDeskBlastRound).toHaveBeenCalled())
    await act(async () => undefined)

    await finish()

    await waitFor(() => expect(api.submitDeskBlastRound).toHaveBeenCalledTimes(1))
    const [roundId, body] = api.submitDeskBlastRound.mock.calls[0]!
    expect(roundId).toBe('round-1')
    expect(body).toMatchObject({ score: 41, lines: 3, bestCombo: 2, placements: 10 })
    expect(typeof body.playMs).toBe('number')
  })

  it('shows the rank when the server counted the game', async () => {
    api.submitDeskBlastRound.mockResolvedValue({
      score: 41,
      ranked: true,
      rank: { daily: 3, overall: 12, bestScoreToday: 41, bestScoreOverall: 41 },
    })
    renderPage()
    await act(async () => undefined)

    await finish()

    expect(await screen.findByText('오늘 3위 · 전체 12위')).toBeInTheDocument()
  })

  it('still shows the result when the server refuses or fails', async () => {
    api.submitDeskBlastRound.mockRejectedValue(new Error('nope'))
    renderPage()
    await act(async () => undefined)

    const dialog = await finish()

    expect(within(dialog).getByTestId('blast-final-score')).toHaveTextContent('41')
    expect(screen.queryByText(/위 · 전체/)).toBeNull()
  })

  it('does not send anything when there was no round to send it to', async () => {
    api.createDeskBlastRound.mockRejectedValue(new Error('down'))
    renderPage()
    await act(async () => undefined)

    await finish()

    expect(api.submitDeskBlastRound).not.toHaveBeenCalled()
  })

  it('starts a clean game from "다시 정리하기" and asks for a new round', async () => {
    renderPage()
    const dialog = await finish()
    engine.next = state({})

    fireEvent.click(within(dialog).getByRole('button', { name: /다시 정리하기/ }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(score()).toBe('0')
    expect(api.createDeskBlastRound).toHaveBeenCalledTimes(2)
  })

  it('goes home from the result', async () => {
    renderPage()
    const dialog = await finish()

    fireEvent.click(within(dialog).getByRole('button', { name: '홈 화면으로 돌아가기' }))

    expect(screen.getByTestId('where')).toHaveTextContent('/')
  })

  it('makes the share image as soon as the card appears and saves it on request', async () => {
    renderPage()
    const dialog = await finish()

    await waitFor(() => expect(share.renderBlastShareImage).toHaveBeenCalledTimes(1))
    expect(share.renderBlastShareImage.mock.calls[0]![0]).toMatchObject({
      score: 41,
      bestCombo: 2,
      lines: 3,
      typeName: '책상 방치형',
      newBest: true,
      look: 'arcade',
    })
    const save = await within(dialog).findByRole('button', { name: '이미지 저장' })
    fireEvent.click(save)

    expect(share.downloadBlob).toHaveBeenCalledTimes(1)
    expect(share.downloadBlob.mock.calls[0]![1]).toBe('chak-desk-blast.png')
  })

  it('hands the last desk to the share image: the board as it ended, the pieces on it, and the look', async () => {
    renderPage()
    await finish()

    await waitFor(() => expect(share.renderBlastShareImage).toHaveBeenCalledTimes(1))
    const data = share.renderBlastShareImage.mock.calls[0]![0]
    expect(data.board).toHaveLength(8)
    expect(data.board[0][1]).not.toBe(0)
    // The last move put the single piece at row 1, column 2 (0-based 0, 1).
    expect(data.placed).toEqual([{ id: 1, kind: 1, cells: [[0, 1]] }])
    expect(['arcade', 'objects']).toContain(data.look)
  })

  it('draws the share image in the look the player chose', async () => {
    window.localStorage.setItem('chak:desk-blast:look', 'objects')
    renderPage()
    await finish()

    await waitFor(() => expect(share.renderBlastShareImage).toHaveBeenCalled())
    expect(share.renderBlastShareImage.mock.calls[0]![0].look).toBe('objects')
  })

  it('says so when the image cannot be made, without breaking the card', async () => {
    share.renderBlastShareImage.mockRejectedValue(new Error('no canvas'))
    renderPage()
    const dialog = await finish()

    expect(await within(dialog).findByText('이미지를 만들지 못했어요')).toBeInTheDocument()
    expect(within(dialog).getByTestId('blast-final-score')).toBeInTheDocument()
  })

  it('offers sharing only where the browser can share a file', async () => {
    renderPage()
    const dialog = await finish()
    await within(dialog).findByRole('button', { name: '이미지 저장' })
    expect(within(dialog).queryByRole('button', { name: '공유하기' })).toBeNull()
  })

  it('shares the image through the browser when it can', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: shareFn })
    try {
      renderPage()
      const dialog = await finish()

      fireEvent.click(await within(dialog).findByRole('button', { name: '공유하기' }))

      await waitFor(() => expect(shareFn).toHaveBeenCalledTimes(1))
      expect(shareFn.mock.calls[0]![0].files[0].name).toBe('chak-desk-blast.png')
    } finally {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    }
  })

  it('does not complain when the person closes the share sheet', async () => {
    const shareFn = vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError'))
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: shareFn })
    try {
      renderPage()
      const dialog = await finish()

      fireEvent.click(await within(dialog).findByRole('button', { name: '공유하기' }))

      await waitFor(() => expect(shareFn).toHaveBeenCalled())
      expect(screen.queryByText(/공유하지 못했어요/)).toBeNull()
    } finally {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    }
  })

  it('refuses further moves once the game is over', async () => {
    renderPage()
    await finish()

    expect(screen.queryByTestId('blast-piece-1')).toBeInTheDocument()
    expect(screen.getByTestId('blast-piece-1')).toBeDisabled()
  })
})

describe('stationery on the desk', () => {
  it('names each waiting piece by the object it is', () => {
    engine.next = state({ hand: [piece(1, ['#'], 1), piece(2, ['###'], 3), piece(3, ['##', '##'], 6)] })
    renderPage()

    expect(screen.getByTestId('blast-piece-0')).toHaveAccessibleName('블록 1, 지우개 1칸')
    expect(screen.getByTestId('blast-piece-1')).toHaveAccessibleName('블록 2, 형광펜 3칸')
    expect(screen.getByTestId('blast-piece-2')).toHaveAccessibleName('블록 3, 포스트잇 4칸')
  })

  it('draws each waiting piece as its object', () => {
    engine.next = state({ hand: [piece(1, ['#'], 1), piece(2, ['###'], 3), piece(3, ['##', '##'], 6)] })
    renderPage()

    expect(screen.getByTestId('blast-piece-0').querySelector('svg')).toHaveAttribute('data-kind', 'eraser')
    expect(screen.getByTestId('blast-piece-1').querySelector('svg')).toHaveAttribute('data-kind', 'highlighter')
    expect(screen.getByTestId('blast-piece-2').querySelector('svg')).toHaveAttribute('data-kind', 'sticky')
  })

  it('draws a placed piece as one object over all its cells', () => {
    engine.next = state({ hand: [piece(1, ['###'], 3), piece(2, ['#'], 1), null] })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(4, 4))

    const art = screen.getByTestId('blast-art-highlighter')
    expect(art.tagName.toLowerCase()).toBe('svg')
    expect(art.getAttribute('style')).toContain('--row: 4')
    expect(art.getAttribute('style')).toContain('--col: 3')
    expect(art.getAttribute('style')).toContain('--cols: 3')
    expect(art.getAttribute('style')).toContain('--rows: 1')
    expect(document.querySelectorAll('.blast-art__piece')).toHaveLength(1)
  })

  it('keeps the object when the cells are tapped through it', () => {
    engine.next = state({ hand: [piece(1, ['##'], 2), piece(2, ['#'], 1), null] })
    renderPage()
    tapPiece(0)
    fireEvent.click(cell(2, 2))

    expect(cell(2, 1)).toHaveAccessibleName(/채워짐/)
    expect(screen.getByTestId('blast-art-clip')).toBeInTheDocument()
  })

  it('draws pieces that are still on the desk and none that were cleared away', () => {
    engine.next = state({
      board: boardOf([...row(0, [0]), [7, 7]]),
      hand: [piece(1, ['#'], 1), piece(2, ['##'], 2), null],
    })
    renderPage()
    tapPiece(1)
    fireEvent.click(cell(5, 5))
    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(screen.getByTestId('blast-art-clip')).toBeInTheDocument()
    expect(screen.queryByTestId('blast-art-eraser')).toBeNull()
  })

  it('shows the landing spot while dragging as the object, not as colored cells', () => {
    engine.next = state({ hand: [piece(1, ['##'], 2), null, null] })
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 100 + 40, 3 * 40 + 40 + 56)

    expect(screen.getByTestId('blast-art-ghost')).toHaveAttribute('data-kind', 'clip')
  })

  it('shows no landing object while the piece is over a taken cell', () => {
    engine.next = state({ board: boardOf([[5, 3]]) })
    renderPage()
    sizeBoard()

    pointer(screen.getByTestId('blast-piece-0'), 'pointerdown', 200, 500)
    pointer(window, 'pointermove', 3 * 40 + 20, 5 * 40 + 40 + 56)

    expect(screen.queryByTestId('blast-art-ghost')).toBeNull()
  })
})

describe('sound', () => {
  it('unlocks audio and ticks when a piece is picked up, before anything is placed', () => {
    renderPage()

    tapPiece(0)

    expect(sound.unlockAudio).toHaveBeenCalled()
    expect(sound.playPick).toHaveBeenCalledTimes(1)
    expect(sound.playPlace).not.toHaveBeenCalled()
  })

  it('sets a piece down with the size of the piece, and plays no clear when nothing cleared', () => {
    engine.next = state({})
    renderPage()

    tapPiece(2)
    fireEvent.click(cell(4, 4))

    expect(sound.playPlace).toHaveBeenCalledWith(3)
    expect(sound.playClear).not.toHaveBeenCalled()
  })

  it('plays the clear with its lines and combo', () => {
    engine.next = state({ board: boardOf([...row(0, [0]), [7, 7]]), combo: 2 })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(sound.playClear).toHaveBeenCalledWith(1, 3)
    expect(sound.playAllClear).not.toHaveBeenCalled()
  })

  it('plays the flourish instead of the plain clear for an empty desk', () => {
    engine.next = state({ board: boardOf(row(0, [0])) })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 0))

    expect(sound.playAllClear).toHaveBeenCalledTimes(1)
    expect(sound.playClear).not.toHaveBeenCalled()
  })

  it('marks a lost combo', () => {
    engine.next = state({ combo: 1, missStreak: 2 })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(6, 6))

    expect(sound.playComboBreak).toHaveBeenCalledTimes(1)
  })

  it('plays nothing for a move that was refused', () => {
    engine.next = state({})
    renderPage()
    tapPiece(0)
    fireEvent.click(cell(2, 2))
    sound.playPlace.mockClear()
    tapPiece(1)

    fireEvent.click(cell(2, 2))

    expect(sound.playPlace).not.toHaveBeenCalled()
  })

  it('plays the game over sound when the result card comes up, or the new best sound for a record', async () => {
    engine.next = state({
      board: boardOf(Array.from({ length: SIZE }, (_, r) => row(r)).flat().filter(([r, c]) => (r + c) % 2 === 0)),
      hand: [piece(1, ['#']), piece(2, ['##']), null],
      score: 40,
    })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 1))
    await screen.findByRole('dialog', { name: '게임 결과' }, { timeout: 3000 })

    expect(sound.playNewBest).toHaveBeenCalledTimes(1)
    expect(sound.playGameOver).not.toHaveBeenCalled()
  })

  it('plays the plain game over sound when it is not a record', async () => {
    window.localStorage.setItem('chak:desk-blast:best', JSON.stringify({ version: 1, best: 9000 }))
    engine.next = state({
      board: boardOf(Array.from({ length: SIZE }, (_, r) => row(r)).flat().filter(([r, c]) => (r + c) % 2 === 0)),
      hand: [piece(1, ['#']), piece(2, ['##']), null],
      score: 40,
    })
    renderPage()

    tapPiece(0)
    fireEvent.click(cell(0, 1))
    await screen.findByRole('dialog', { name: '게임 결과' }, { timeout: 3000 })

    expect(sound.playGameOver).toHaveBeenCalledTimes(1)
    expect(sound.playNewBest).not.toHaveBeenCalled()
  })

  it('has a switch to turn the sound off and on again', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '효과음 끄기' }))
    expect(sound.setMuted).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('button', { name: '효과음 켜기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '효과음 켜기' }))
    expect(sound.setMuted).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('button', { name: '효과음 끄기' })).toBeInTheDocument()
  })

  it('starts with the switch off when the device was muted', () => {
    sound.muted = true

    renderPage()

    expect(screen.getByRole('button', { name: '효과음 켜기' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('top right corner', () => {
  it('has the sound switch and the dark/light switch in the app bar, and none between the score and the combo', () => {
    renderPage()

    const appBar = document.querySelector('.ds-app-bar') as HTMLElement
    const stats = document.querySelector('.blast-stats') as HTMLElement
    expect(within(appBar).getByRole('button', { name: '효과음 끄기' })).toBeInTheDocument()
    expect(within(appBar).getByRole('button', { name: '라이트 모드로 바꾸기' })).toBeInTheDocument()
    expect(within(stats).queryAllByRole('button')).toHaveLength(0)
  })

  it('shows a moon in the dark look and a sun in the light one', () => {
    renderPage()
    const trailing = document.querySelector('.ds-app-bar__side--trailing') as HTMLElement
    expect(trailing.querySelector('svg.lucide-moon')).not.toBeNull()
    expect(trailing.querySelector('svg.lucide-sun')).toBeNull()

    fireEvent.click(within(trailing).getByRole('button', { name: '라이트 모드로 바꾸기' }))

    expect(trailing.querySelector('svg.lucide-sun')).not.toBeNull()
    expect(trailing.querySelector('svg.lucide-moon')).toBeNull()
  })
})

describe('looks', () => {
  it('starts as the night desk, dark all the way up to the app bar', () => {
    renderPage()

    expect(document.querySelector('.blast-page')).toHaveAttribute('data-look', 'arcade')
    expect(document.querySelector('.app-shell')).toHaveClass('blast-look-arcade')
  })

  it('switches to the cream desk with the button, and remembers it', () => {
    const first = renderPage()

    fireEvent.click(screen.getByRole('button', { name: /(라이트|다크) 모드로 바꾸기/ }))

    expect(document.querySelector('.blast-page')).toHaveAttribute('data-look', 'objects')
    expect(document.querySelector('.app-shell')).toHaveClass('blast-look-objects')
    expect(screen.getByRole('button', { name: '다크 모드로 바꾸기' })).toBeInTheDocument()
    first.unmount()

    renderPage()
    expect(document.querySelector('.blast-page')).toHaveAttribute('data-look', 'objects')
  })

  it('opens in the look named in the address', () => {
    window.localStorage.setItem('chak:desk-blast:look', 'arcade')

    renderPage('/minigame/desk-blast?look=objects')

    expect(document.querySelector('.blast-page')).toHaveAttribute('data-look', 'objects')
  })

  it('plays the same in either look', () => {
    engine.next = state({})
    renderPage('/minigame/desk-blast?look=objects')

    tapPiece(0)
    fireEvent.click(cell(3, 3))

    expect(score()).toBe('1')
  })
})
