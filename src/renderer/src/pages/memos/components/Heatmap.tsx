import type { MemoEntry } from '@renderer/types'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface HeatmapProps {
  memos: MemoEntry[]
}

const WEEKS = 20
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const Heatmap: FC<HeatmapProps> = ({ memos }) => {
  const { t } = useTranslation()

  const { grid, maxCount } = useMemo(() => {
    const today = dayjs().endOf('day')
    const start = today.subtract(WEEKS * 7 - 1, 'day').startOf('day')

    const countMap = new Map<string, number>()
    memos.forEach((memo) => {
      const key = dayjs(memo.createdAt).format('YYYY-MM-DD')
      countMap.set(key, (countMap.get(key) || 0) + 1)
    })

    const grid: { date: dayjs.Dayjs; count: number }[][] = []
    let currentWeek: { date: dayjs.Dayjs; count: number }[] = []

    for (let i = 0; i < WEEKS * 7; i++) {
      const date = start.add(i, 'day')
      const key = date.format('YYYY-MM-DD')
      const count = countMap.get(key) || 0
      currentWeek.push({ date, count })
      if (currentWeek.length === 7) {
        grid.push(currentWeek)
        currentWeek = []
      }
    }

    const maxCount = Math.max(...Array.from(countMap.values()), 1)
    return { grid, maxCount }
  }, [memos])

  const getIntensity = (count: number) => {
    if (count === 0) return 0
    if (count <= maxCount * 0.25) return 1
    if (count <= maxCount * 0.5) return 2
    if (count <= maxCount * 0.75) return 3
    return 4
  }

  if (memos.length === 0) return null

  return (
    <Container>
      <Title>{t('memos.heatmap.title')}</Title>
      <Grid>
        {DAYS.map((day, rowIndex) => (
          <Row key={day}>
            <DayLabel>{day}</DayLabel>
            {grid.map((week, colIndex) => {
              const cell = week[rowIndex]
              if (!cell) return <Cell key={`${colIndex}-${rowIndex}`} $intensity={0} />
              return (
                <Cell
                  key={cell.date.format('YYYY-MM-DD')}
                  $intensity={getIntensity(cell.count)}
                  title={`${cell.date.format('YYYY-MM-DD')}: ${cell.count} ${t('memos.heatmap.memos')}`}
                />
              )
            })}
          </Row>
        ))}
      </Grid>
    </Container>
  )
}

const Container = styled.div`
  padding: 16px 0;
  overflow-x: auto;
`

const Title = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
  margin-bottom: 10px;
`

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`

const DayLabel = styled.div`
  width: 20px;
  font-size: 9px;
  color: var(--color-text-3);
  text-align: right;
  padding-right: 3px;
  flex-shrink: 0;
`

const Cell = styled.div<{ $intensity: number }>`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background-color: ${({ $intensity }) => {
    const colors = [
      'var(--color-background-mute)',
      'rgba(34, 197, 94, 0.25)',
      'rgba(34, 197, 94, 0.5)',
      'rgba(34, 197, 94, 0.75)',
      'rgb(34, 197, 94)'
    ]
    return colors[$intensity]
  }};
  cursor: pointer;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.3);
  }
`
