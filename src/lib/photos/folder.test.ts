import { describe, expect, it } from 'vitest'
import { filterFolderFiles } from './folder'
import { file } from '../../test/factories'

describe('filterFolderFiles', () => {
  it('keeps only top-level JPEGs, case-insensitively', () => {
    const files = [
      file('one.JPG', 'Trip/one.JPG'),
      file('two.jpeg', 'Trip/two.jpeg'),
      file('nested.jpg', 'Trip/sub/nested.jpg'),
      file('notes.txt', 'Trip/notes.txt'),
    ]

    expect(filterFolderFiles(files).map(({ file }) => file.name)).toEqual(['one.JPG', 'two.jpeg'])
  })
})

