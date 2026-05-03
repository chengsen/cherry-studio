import type { MemoEntry } from '@renderer/types'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { MemoCard } from './MemoCard'

interface MemosListProps {
  memos: MemoEntry[]
  onDelete: (id: string) => void
  onEdit: (memo: MemoEntry) => void
  onTagClick: (tag: string) => void
}

function getDateLabel(ts: number, t: (key: string) => string): string {
  const d = dayjs(ts)
  if (d.isSame(dayjs(), 'day')) return t('memos.date.today')
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return t('memos.date.yesterday')
  return d.format('YYYY/MM/DD')
}

export const MemosList: FC<MemosListProps> = ({ memos, onDelete, onEdit, onTagClick }) => {
  const { t } = useTranslation()

  const grouped = useMemo(() => {
    const groups: Record<string, MemoEntry[]> = {}
    memos.forEach((memo) => {
      const key = dayjs(memo.createdAt).startOf('day').valueOf().toString()
      if (!groups[key]) groups[key] = []
      groups[key].push(memo)
    })
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]))
  }, [memos])

  if (memos.length === 0) {
    return (
      <EmptyState>
        <EmptyText>{t('memos.empty')}</EmptyText>
      </EmptyState>
    )
  }

  return (
    <ListContainer>
      {grouped.map(([dateKey, dayMemos]) => (
        <DateGroup key={dateKey}>
          <DateHeader>{getDateLabel(Number(dateKey), t)}</DateHeader>
          <Cards>
            {dayMemos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} onDelete={onDelete} onEdit={onEdit} onTagClick={onTagClick} />
            ))}
          </Cards>
        </DateGroup>
      ))}
    </ListContainer>
  )
}

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 12px 0;
  overflow-y: auto;
  flex: 1;
`

const DateGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DateHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-2);
  padding: 0 4px;
  position: sticky;
  top: 0;
  background-color: var(--color-background);
  z-index: 1;
  padding-top: 4px;
  padding-bottom: 4px;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-text-3);
`

const EmptyText = styled.div`
  font-size: 14px;
`
