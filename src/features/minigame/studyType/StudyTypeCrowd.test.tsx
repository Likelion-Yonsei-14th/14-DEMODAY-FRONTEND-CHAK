import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StudyTypeCrowd } from './StudyTypeCrowd'

const stats = vi.fn()

vi.mock('@/api/minigames', () => ({ fetchStudyTypeStats: () => stats() }))

const codes = ['PSA', 'PSN', 'PFA', 'PFN', 'LSA', 'LSN', 'LFA', 'LFN']
const distribution = codes.map((code, index) => ({ code, count: 8 - index, percent: (8 - index) * 2.8 }))

describe('study type crowd', () => {
  it('shows how common my type is next to the others', async () => {
    stats.mockResolvedValue({ total: 36, myCode: null, distribution })
    render(<StudyTypeCrowd typeCode="PSA" />)

    expect(await screen.findByText('다른 수험생들은 어떤 유형일까?')).toBeInTheDocument()
    expect(screen.getByText(/36명 중/)).toHaveTextContent('22.4%')
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
  })

  it('stays out of the way when there are no numbers or the server is down', async () => {
    stats.mockResolvedValue({ total: 0, myCode: null, distribution: [] })
    const empty = render(<StudyTypeCrowd typeCode="PSA" />)
    await Promise.resolve()
    expect(empty.container).toBeEmptyDOMElement()

    stats.mockRejectedValue(new Error('offline'))
    const down = render(<StudyTypeCrowd typeCode="PSA" />)
    await Promise.resolve()
    expect(down.container).toBeEmptyDOMElement()
  })
})
