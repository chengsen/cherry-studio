import { SendOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { extractTags } from '../utils'

interface MemosInputProps {
  onSave: (content: string) => void
  editingMemo?: { id: string; content: string } | null
  onCancelEdit?: () => void
}

export const MemosInput: FC<MemosInputProps> = ({ onSave, editingMemo, onCancelEdit }) => {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editingMemo) {
      setContent(editingMemo.content)
      textareaRef.current?.focus()
    } else {
      setContent('')
    }
  }, [editingMemo])

  const handleSave = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSave(trimmed)
    setContent('')
    textareaRef.current?.focus()
  }, [content, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave]
  )

  const extractedTags = extractTags(content)

  return (
    <Container>
      <InputArea>
        <StyledTextArea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('memos.placeholder')}
          rows={editingMemo ? 4 : 2}
        />
        <SendButton onClick={handleSave} disabled={!content.trim()}>
          <SendOutlined />
        </SendButton>
      </InputArea>
      {extractedTags.length > 0 && (
        <TagHint>
          {extractedTags.map((tag) => (
            <TagBadge key={tag}>#{tag}</TagBadge>
          ))}
        </TagHint>
      )}
      {editingMemo && (
        <EditHint>
          {t('memos.editing')} · <CancelLink onClick={onCancelEdit}>{t('common.cancel')}</CancelLink>
        </EditHint>
      )}
    </Container>
  )
}

const Container = styled.div`
  padding: 16px 20px;
  border-top: 0.5px solid var(--color-border);
  background-color: var(--color-background);
`

const InputArea = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 10px;
`

const StyledTextArea = styled.textarea`
  flex: 1;
  min-height: 56px;
  max-height: 200px;
  padding: 12px 14px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background-soft);
  border: 0.5px solid var(--color-border);
  border-radius: 12px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;

  &::placeholder {
    color: var(--color-text-3);
  }

  &:focus {
    border-color: var(--color-primary);
  }
`

const SendButton = styled.button<{ disabled: boolean }>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background-color: ${({ disabled }) => (disabled ? 'var(--color-background-mute)' : 'var(--color-primary)')};
  color: ${({ disabled }) => (disabled ? 'var(--color-text-3)' : '#fff')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
`

const TagHint = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-left: 2px;
`

const TagBadge = styled.span`
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
`

const EditHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-3);
  padding-left: 2px;
`

const CancelLink = styled.span`
  color: var(--color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`
