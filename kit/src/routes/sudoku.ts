export function decode(task: string) {
  const parts = task.split(';')

  // =========================
  // puzzle
  // =========================
  const values = []
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
