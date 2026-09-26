import type { Direction } from './types'

export function ascDesc<T>(items: readonly T[], direction: Direction, repeatTurn: boolean): T[] {
  const up = [...items]
  const down = [...items].reverse()
  const turn = repeatTurn ? 0 : 1
  switch (direction) {
    case 'up':
      return up
    case 'down':
      return down
    case 'upDown':
      return [...up, ...down.slice(turn)]
    case 'downUp':
      return [...down, ...up.slice(turn)]
  }
}
