import { describe, expect, test } from 'vitest'

import { extractTags } from '../utils'

describe('extractTags', () => {
  test('should extract simple hashtags', () => {
    const result = extractTags('Hello #world this is #test')
    expect(result).toEqual(['test', 'world'])
  })

  test('should extract Chinese hashtags', () => {
    const result = extractTags('今天#天气真好，#心情不错')
    expect(result).toEqual(['天气真好', '心情不错'])
  })

  test('should deduplicate tags', () => {
    const result = extractTags('#same #same #same')
    expect(result).toEqual(['same'])
  })

  test('should return empty array when no tags', () => {
    const result = extractTags('No tags here')
    expect(result).toEqual([])
  })

  test('should return empty array for empty string', () => {
    const result = extractTags('')
    expect(result).toEqual([])
  })

  test('should extract mixed Chinese and English tags', () => {
    const result = extractTags('#hello #你好 #world #世界')
    expect(result).toEqual(['hello', 'world', '世界', '你好'])
  })

  test('should stop at special characters', () => {
    const result = extractTags('#tag! #tag@ #tag#nested')
    expect(result).toEqual(['nested', 'tag'])
  })

  test('should sort tags alphabetically', () => {
    const result = extractTags('#zebra #apple #mango')
    expect(result).toEqual(['apple', 'mango', 'zebra'])
  })

  test('should extract multi-level tags', () => {
    const result = extractTags('#工作/项目A #生活/旅行')
    expect(result).toEqual(['工作/项目A', '生活/旅行'])
  })

  test('should extract mixed single and multi-level tags', () => {
    const result = extractTags('#tag #工作/项目A #simple')
    expect(result).toEqual(['simple', 'tag', '工作/项目A'])
  })
})
