import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { MemoEntry } from '@renderer/types'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { ExportToNotesButton } from './ExportToNotesButton'

interface MemoCardProps {
  memo: MemoEntry
  onDelete: (id: string) => void
  onEdit: (memo: MemoEntry) => void
  onTagClick: (tag: string) => void
}

export const MemoCard: FC<MemoCardProps> = ({ memo, onDelete, onEdit, onTagClick }) => {
  const { t } = useTranslation()

  const formatTime = (ts: number) => {
    return dayjs(ts).format('HH:mm')
  }

  const renderContent = (content: string) => {
    const parts = content.split(/(#[\w/一-龥]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <TagLink key={i} onClick={() => onTagClick(part.slice(1))}>
            {part}
          </TagLink>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <CardContainer>
      <Content>{renderContent(memo.content)}</Content>
      <Footer>
        <Time>{formatTime(memo.createdAt)}</Time>
        <Actions>
          <ExportToNotesButton memo={memo} />
          <ActionBtn title={t('memos.edit')} onClick={() => onEdit(memo)}>
            <EditOutlined />
          </ActionBtn>
          <ActionBtn title={t('memos.delete')} onClick={() => onDelete(memo.id)}>
            <DeleteOutlined />
          </ActionBtn>
        </Actions>
      </Footer>
    </CardContainer>
  )
}

const CardContainer = styled.div`
  padding: 14px 16px;
  border-radius: 8px;
  background-color: var(--color-background-soft);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-background-mute);
  }
`

const Content = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
`

const TagLink = styled.span`
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`

const Time = styled.span`
  font-size: 12px;
  color: var(--color-text-3);
`

const Actions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${CardContainer}:hover & {
    opacity: 1;
  }
`

const ActionBtn = styled.button`
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 0;

  &:hover {
    background-color: var(--color-background);
    color: var(--color-text);
  }
`
