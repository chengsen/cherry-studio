import db from '@renderer/databases'
import { extractTags } from '@renderer/pages/memos/utils'
import type { MemoEntry } from '@renderer/types'
import { isEmpty } from 'lodash'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const MEMOS_SETTINGS_KEY = 'memo:entries'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

interface Props {
  onSaved?: () => void
}

const MemoWindow: FC<Props> = ({ onSaved }) => {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    const trimmed = content.trim()
    if (isEmpty(trimmed)) return

    setSaving(true)
    try {
      const row = await db.settings.get(MEMOS_SETTINGS_KEY)
      const entries = (row?.value as MemoEntry[] | undefined) || []
      const now = Date.now()
      const entry: MemoEntry = {
        id: generateId(),
        content: trimmed,
        tags: extractTags(trimmed),
        createdAt: now,
        updatedAt: now
      }
      const next = [entry, ...entries]
      await db.settings.put({ id: MEMOS_SETTINGS_KEY, value: next })

      window.toast.success(t('memos.save_success'))
      setContent('')
      onSaved?.()
    } catch {
      window.toast.error(t('memos.save_failed'))
    } finally {
      setSaving(false)
    }
  }, [content, onSaved, t])

  useHotkeys(
    'mod+enter',
    (e) => {
      e.preventDefault()
      void handleSave()
    },
    [handleSave]
  )

  return (
    <Container>
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('memos.placeholder')}
        disabled={saving}
      />
      <SaveButton disabled={isEmpty(content.trim()) || saving} onClick={() => void handleSave()}>
        {t('memos.save')}
      </SaveButton>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px;
  gap: 10px;
  overflow: hidden;
  -webkit-app-region: none;
`

const TextArea = styled.textarea`
  flex: 1;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background-soft);
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  resize: none;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: var(--color-text-3);
  }

  &:focus {
    border-color: var(--color-primary);
  }
`

const SaveButton = styled.button<{ disabled: boolean }>`
  align-self: flex-end;
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  background-color: ${({ disabled }) => (disabled ? 'var(--color-background-mute)' : 'var(--color-primary)')};
  color: ${({ disabled }) => (disabled ? 'var(--color-text-3)' : '#fff')};
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
`

export default MemoWindow
