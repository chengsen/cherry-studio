import db from '@renderer/databases'
import type { MemoEntry } from '@renderer/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { extractTags } from '../utils'

const MEMOS_SETTINGS_KEY = 'memo:entries'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function useMemos() {
  const [memos, setMemos] = useState<MemoEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    db.settings
      .get(MEMOS_SETTINGS_KEY)
      .then((row) => {
        if (cancelled) return
        const entries = row?.value as MemoEntry[] | undefined
        setMemos(entries || [])
      })
      .catch(() => {
        if (!cancelled) setMemos([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(async (next: MemoEntry[]) => {
    await db.settings.put({ id: MEMOS_SETTINGS_KEY, value: next })
  }, [])

  const addMemo = useCallback(
    async (content: string, manualTags: string[] = []) => {
      const extracted = extractTags(content)
      const allTags = [...new Set([...manualTags, ...extracted])].sort()
      const now = Date.now()
      const entry: MemoEntry = {
        id: generateId(),
        content: content.trim(),
        tags: allTags,
        createdAt: now,
        updatedAt: now
      }
      const next = [entry, ...memos]
      setMemos(next)
      await persist(next)
      return entry
    },
    [memos, persist]
  )

  const updateMemo = useCallback(
    async (id: string, content: string, manualTags: string[] = []) => {
      const extracted = extractTags(content)
      const allTags = [...new Set([...manualTags, ...extracted])].sort()
      const next = memos.map((m) =>
        m.id === id ? { ...m, content: content.trim(), tags: allTags, updatedAt: Date.now() } : m
      )
      setMemos(next)
      await persist(next)
    },
    [memos, persist]
  )

  const deleteMemo = useCallback(
    async (id: string) => {
      const next = memos.filter((m) => m.id !== id)
      setMemos(next)
      await persist(next)
    },
    [memos, persist]
  )

  const allTags = useMemo(() => {
    const set = new Set<string>()
    memos.forEach((m) => m.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [memos])

  return {
    memos,
    loading,
    addMemo,
    updateMemo,
    deleteMemo,
    allTags
  }
}
