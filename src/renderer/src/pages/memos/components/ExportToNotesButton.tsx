import { ExportOutlined } from '@ant-design/icons'
import { addNote, resolveNotesPath } from '@renderer/services/NotesService'
import type { MemoEntry } from '@renderer/types'
import { Button, message, Tooltip } from 'antd'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

interface ExportToNotesButtonProps {
  memo: MemoEntry
  notesPath?: string
}

export const ExportToNotesButton: FC<ExportToNotesButtonProps> = ({ memo, notesPath }) => {
  const { t } = useTranslation()

  const handleExport = async () => {
    try {
      const resolved = await resolveNotesPath(notesPath || '')
      const dateStr = new Date(memo.createdAt).toISOString().replace(/[:T]/g, '-').slice(0, 19)
      const fileName = `memo_${dateStr}`

      const tagsLine = memo.tags.length > 0 ? `Tags: ${memo.tags.map((t) => `#${t}`).join(' ')}\n\n` : ''
      const content = `${tagsLine}${memo.content}`

      await addNote(fileName, content, resolved.path)
      message.success(t('memos.export_success'))
    } catch (error) {
      message.error(t('memos.export_failed'))
    }
  }

  return (
    <Tooltip title={t('memos.export_to_notes')}>
      <Button type="text" size="small" icon={<ExportOutlined />} onClick={handleExport} />
    </Tooltip>
  )
}
