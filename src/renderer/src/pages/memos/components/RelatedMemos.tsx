import type { MemoEntry } from '@renderer/types'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface RelatedMemosProps {
  memos: MemoEntry[]
  currentMemoId?: string
  activeTag: string | null
}

export const RelatedMemos: FC<RelatedMemosProps> = ({ memos, currentMemoId, activeTag }) => {
  const { t } = useTranslation()

  const related = useMemo(() => {
    if (!activeTag) return []
    return memos.filter(
      (m) =>
        m.id !== currentMemoId &&
        m.tags.some((t) => t === activeTag || t.startsWith(`${activeTag}/`) || activeTag.startsWith(`${t}/`))
    )
  }, [memos, currentMemoId, activeTag])

  if (related.length === 0) return null

  return (
    <Container>
      <Title>
        {t('memos.related.title')} · #{activeTag}
      </Title>
      <List>
        {related.slice(0, 5).map((memo) => (
          <RelatedItem key={memo.id}>
            <RelatedContent>{memo.content}</RelatedContent>
          </RelatedItem>
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
  gap: 6px;
`

const RelatedItem = styled.div`
  padding: 8px 10px;
  background-color: var(--color-background-soft);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-background-mute);
  }
`

const RelatedContent = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text);
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`
