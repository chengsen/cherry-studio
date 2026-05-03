import type { MemoEntry } from '@renderer/types'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface DailyReviewProps {
  memos: MemoEntry[]
}

export const DailyReview: FC<DailyReviewProps> = ({ memos }) => {
  const { t } = useTranslation()

  const pastMemos = useMemo(() => {
    const today = dayjs()
    const currentMonth = today.month()
    const currentDate = today.date()

    return memos.filter((memo) => {
      const d = dayjs(memo.createdAt)
      return d.month() === currentMonth && d.date() === currentDate && d.year() !== today.year()
    })
  }, [memos])

  if (pastMemos.length === 0) return null

  return (
    <Container>
      <Title>{t('memos.daily_review.title')}</Title>
      <List>
        {pastMemos.map((memo) => (
          <ReviewItem key={memo.id}>
            <ReviewYear>{dayjs(memo.createdAt).year()}</ReviewYear>
            <ReviewContent>{memo.content}</ReviewContent>
          </ReviewItem>
        ))}
      </List>
    </Container>
  )
}

const Container = styled.div`
  padding: 16px 0;
  border-top: 0.5px solid var(--color-border);
`

const Title = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
  margin-bottom: 10px;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ReviewItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 10px;
  background-color: var(--color-background-soft);
  border-radius: 6px;
`

const ReviewYear = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
  min-width: 36px;
`

const ReviewContent = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text);
  word-break: break-word;
`
