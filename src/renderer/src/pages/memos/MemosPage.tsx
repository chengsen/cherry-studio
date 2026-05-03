import { SearchOutlined } from '@ant-design/icons'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import type { MemoEntry } from '@renderer/types'
import { Input } from 'antd'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { DailyReview } from './components/DailyReview'
import { Heatmap } from './components/Heatmap'
import { MemosInput } from './components/MemosInput'
import { MemosList } from './components/MemosList'
import { RelatedMemos } from './components/RelatedMemos'
import { TagFilter } from './components/TagFilter'
import { useMemos } from './hooks/useMemos'

const MemosPage: FC = () => {
  const { t } = useTranslation()
  const { memos, addMemo, updateMemo, deleteMemo, allTags } = useMemos()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [editingMemo, setEditingMemo] = useState<MemoEntry | null>(null)

  const filteredMemos = useMemo(() => {
    let result = memos
    if (activeTag) {
      result = result.filter(
        (m) =>
          m.tags.includes(activeTag) ||
          m.tags.some((t) => t.startsWith(`${activeTag}/`) || activeTag.startsWith(`${t}/`))
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) => m.content.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [memos, activeTag, search])

  const tagStats = useMemo(() => {
    const map = new Map<string, number>()
    memos.forEach((m) => m.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [memos])

  const handleSave = async (content: string) => {
    if (editingMemo) {
      await updateMemo(editingMemo.id, content)
      setEditingMemo(null)
    } else {
      await addMemo(content)
    }
  }

  const handleEdit = (memo: MemoEntry) => {
    setEditingMemo(memo)
  }

  return (
    <Container>
      <Navbar>
        <NavbarCenter>{t('memos.title')}</NavbarCenter>
      </Navbar>
      <MainLayout>
        <ContentArea>
          <CenterColumn>
            <MemosInput onSave={handleSave} editingMemo={editingMemo} onCancelEdit={() => setEditingMemo(null)} />
            <Controls>
              <SearchInput
                prefix={<SearchOutlined />}
                placeholder={t('memos.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
              <TagFilter tags={allTags} activeTag={activeTag} onTagClick={setActiveTag} />
            </Controls>
            <MemosList memos={filteredMemos} onDelete={deleteMemo} onEdit={handleEdit} onTagClick={setActiveTag} />
          </CenterColumn>
        </ContentArea>
        <Sidebar>
          <SidebarSection>
            <SectionTitle>{t('memos.heatmap.title')}</SectionTitle>
            <Heatmap memos={memos} />
          </SidebarSection>
          <SidebarSection>
            <SectionTitle>{t('memos.tag_stats')}</SectionTitle>
            <TagStatsList>
              {tagStats.slice(0, 15).map(([tag, count]) => (
                <TagStatItem
                  key={tag}
                  $active={activeTag === tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}>
                  <TagName>#{tag}</TagName>
                  <TagCount>{count}</TagCount>
                </TagStatItem>
              ))}
            </TagStatsList>
          </SidebarSection>
          <DailyReview memos={memos} />
          <RelatedMemos memos={memos} activeTag={activeTag} />
        </Sidebar>
      </MainLayout>
    </Container>
  )
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const MainLayout = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
`

const CenterColumn = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  padding: 0 16px 40px;
`

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 0.5px solid var(--color-border);
`

const SearchInput = styled(Input)`
  font-size: 13px;
`

const Sidebar = styled.div`
  width: 280px;
  flex-shrink: 0;
  border-left: 0.5px solid var(--color-border);
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 960px) {
    display: none;
  }
`

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
`

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-2);
  margin-bottom: 10px;
`

const TagStatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const TagStatItem = styled.div<{ $active: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--color-text)')};
  transition: all 0.2s;

  &:hover {
    background-color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-background-soft)')};
  }
`

const TagName = styled.span`
  font-size: 13px;
  word-break: break-all;
`

const TagCount = styled.span`
  font-size: 12px;
  color: inherit;
  opacity: 0.7;
  flex-shrink: 0;
  margin-left: 8px;
`

export default MemosPage
