import { TagOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface TagFilterProps {
  tags: string[]
  activeTag: string | null
  onTagClick: (tag: string | null) => void
}

export const TagFilter: FC<TagFilterProps> = ({ tags, activeTag, onTagClick }) => {
  const { t } = useTranslation()

  if (tags.length === 0) return null

  return (
    <Container>
      <TagOutlined style={{ fontSize: 12, color: 'var(--color-icon)' }} />
      <AllTag $active={activeTag === null} onClick={() => onTagClick(null)}>
        {t('memos.all_tags')}
      </AllTag>
      {tags.map((tag) => (
        <StyledTag key={tag} $active={activeTag === tag} onClick={() => onTagClick(tag)}>
          {tag}
        </StyledTag>
      ))}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-bottom: 0.5px solid var(--color-border);
`

const AllTag = styled.span<{ $active: boolean }>`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-background-soft)')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--color-text)')};
  border: 0.5px solid ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-border)')};
  transition: all 0.2s;
  &:hover {
    border-color: var(--color-primary);
  }
`

const StyledTag = styled.span<{ $active: boolean }>`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-background-soft)')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--color-text)')};
  border: 0.5px solid ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-border)')};
  transition: all 0.2s;
  &:hover {
    border-color: var(--color-primary);
  }
`
