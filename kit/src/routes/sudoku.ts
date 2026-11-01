export function decode(task: string) {
  const parts = task.split(';')

  // =========================
  // puzzle
  // =========================
  const values = Array<number | undefined>(81).fill(undefined)
  let index = 0
  const encoded = parts[0]

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i]

    if (char >= '0' && char <= '9') {
      let num = ''

      while (
        i < encoded.length &&
        encoded[i] >= '0' &&
        encoded[i] <= '9'
      ) {
        num += encoded[i++]
      }

      values[index++] = parseInt(num, 10)

      i--
    } else if (char !== '_') {
      // a=1, b=2, ..., z=26
      index += char.charCodeAt(0) - 96
    }
  }

  // =========================
  // areaGrid
  // =========================
  let areaGrid

  if (parts.length > 1) {
    // Jigsaw
    const areas = parts[1].split(',').map(Number)

    if (areas.length !== 81) {
      throw new Error('Invalid area grid')
    }

    areaGrid = Array.from(
      {length: 9},
      (_, row) => areas.slice(row * 9, row * 9 + 9)
    )
  }

  return {
    puzzle: values,
    areaGrid,
  }
}

export function encode(board: (number | null | undefined)[]): string {
  let out = ''
  let skip = 0
  let prevDigit = false

  for (let i = 0; i < 81; i++) {
    const v = board[i]
    if (v && v >= 1 && v <= 9) {
      while (skip > 0) {
        const step = Math.min(skip, 26)
        out += String.fromCharCode(96 + step)
        skip -= step
      }
      if (prevDigit) out += '_'
      out += String(v)
      prevDigit = true
    } else {
      skip++
      prevDigit = false
    }
  }

  while (skip > 0) {
    const step = Math.min(skip, 26)
    out += String.fromCharCode(96 + step)
    skip -= step
  }

  return out
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function countSolutions(board: (number | undefined)[], limit = 2): number {
  const rowMask = new Int32Array(9)
  const colMask = new Int32Array(9)
  const boxMask = new Int32Array(9)

  for (let i = 0; i < 81; i++) {
    const v = board[i]
    if (!v) continue
    const r = (i / 9) | 0
    const c = i % 9
    const b = ((r / 3) | 0) * 3 + ((c / 3) | 0)
    const bit = 1 << v
    if ((rowMask[r] & bit) || (colMask[c] & bit) || (boxMask[b] & bit)) return 0
    rowMask[r] |= bit
    colMask[c] |= bit
    boxMask[b] |= bit
  }

  let solutions = 0

  function dfs(): void {
    let idx = -1
    let candidates = 0
    let bestLen = 10

    for (let i = 0; i < 81; i++) {
      if (board[i]) continue
      const r = (i / 9) | 0
      const c = i % 9
      const b = ((r / 3) | 0) * 3 + ((c / 3) | 0)
      const mask = 0x3fe & ~(rowMask[r] | colMask[c] | boxMask[b])
      if (mask === 0) return
      let count = 0
      for (let m = mask; m; m &= m - 1) count++
      if (count < bestLen) {
        bestLen = count
        idx = i
        candidates = mask
        if (count === 1) break
      }
    }

    if (idx === -1) {
      solutions++
      return
    }

    const r = (idx / 9) | 0
    const c = idx % 9
    const b = ((r / 3) | 0) * 3 + ((c / 3) | 0)

    for (let m = candidates; m && solutions < limit; m &= m - 1) {
      const bit = m & -m
      const num = Math.clz32(bit) ^ 31
      board[idx] = num
      rowMask[r] |= bit
      colMask[c] |= bit
      boxMask[b] |= bit
      dfs()
      rowMask[r] ^= bit
      colMask[c] ^= bit
      boxMask[b] ^= bit
      board[idx] = undefined
    }
  }

  dfs()
  return solutions
}

export function generate(level = 3): (number | undefined)[] {
  const targetClues = [44, 36, 31, 26][level] ?? 26
  const board = Array<number | undefined>(81).fill(undefined)

  function fill(idx: number): boolean {
    if (idx === 81) return true
    const r = (idx / 9) | 0
    const c = idx % 9
    const br = ((r / 3) | 0) * 3
    const bc = ((c / 3) | 0) * 3
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
    outer: for (const n of nums) {
      for (let i = 0; i < 9; i++) {
        if (board[r * 9 + i] === n || board[i * 9 + c] === n) continue outer
        const rr = br + ((i / 3) | 0)
        const cc = bc + (i % 3)
        if (board[rr * 9 + cc] === n) continue outer
      }
      board[idx] = n
      if (fill(idx + 1)) return true
      board[idx] = undefined
    }
    return false
  }

  fill(0)
  const indices = shuffle(Array.from({length: 81}, (_, i) => i))
  let clues = 81
  for (const idx of indices) {
    if (clues <= targetClues) break
    const backup = board[idx]
    board[idx] = undefined
    if (countSolutions(board, 2) !== 1) {
      board[idx] = backup
    } else {
      clues--
    }
  }

  return board
}

/**
 * 校验一维数独数组并找出所有违反行、列、宫规则的重复数字单元格索引
 * @param board 长度为 81 的一维数独数组（1-9 表示已填数字，0 或 null/undefined 表示空格）
 * @returns 包含所有重复数字单元格索引的 Set 集合
 */
export function duplicate(board: (number | null | undefined)[]): Set<number> {
  // 记录每个 [行/列/宫][数字 1-9] 上一次出现的单元格索引，未出现初始化为 -1
  const seenRow: number[][] = Array.from({length: 9}, () => Array(10).fill(-1))
  const seenCol: number[][] = Array.from({length: 9}, () => Array(10).fill(-1))
  const seenBox: number[][] = Array.from({length: 9}, () => Array(10).fill(-1))

  const duplicateIndices = new Set<number>()

  for (let i = 0; i < 81; i++) {
    const num = board[i]

    // 过滤非数字、空格（0）或非法越界数字
    if (!num || num < 1 || num > 9) {
      continue
    }

    const r = Math.floor(i / 9)
    const c = i % 9
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)

    // 检查行重复
    if (seenRow[r][num] !== -1) {
      duplicateIndices.add(seenRow[r][num]) // 添加首次出现该数字的索引
      duplicateIndices.add(i)               // 添加当前重复的索引
    } else {
      seenRow[r][num] = i
    }

    // 检查列重复
    if (seenCol[c][num] !== -1) {
      duplicateIndices.add(seenCol[c][num])
      duplicateIndices.add(i)
    } else {
      seenCol[c][num] = i
    }

    // 检查宫重复
    if (seenBox[b][num] !== -1) {
      duplicateIndices.add(seenBox[b][num])
      duplicateIndices.add(i)
    } else {
      seenBox[b][num] = i
    }
  }

  return duplicateIndices
}
