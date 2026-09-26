import type { RefObject } from 'react'

/** Scrollable sheet holding the alphaTab rendering. */
export function TabView({
  container,
  scroller,
}: {
  container: RefObject<HTMLDivElement | null>
  scroller: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="sheet" ref={scroller}>
      <div ref={container} />
    </div>
  )
}
