import { useCallback, useEffect, useState } from 'react'
import { sanitizeSettings, type Settings } from '../../engine/settings'
import { settingsFromQuery, settingsToQuery } from '../../engine/url'

export type UpdateSettings = (recipe: (draft: Settings) => void) => void

/** Settings kept in the URL query string, so that every exercise can be shared or bookmarked. */
export function useSettings(): [Settings, UpdateSettings] {
  const [settings, setSettings] = useState(() => settingsFromQuery(window.location.search))

  const update = useCallback<UpdateSettings>((recipe) => {
    setSettings((current) => {
      const draft = structuredClone(current)
      recipe(draft)
      return sanitizeSettings(draft)
    })
  }, [])

  useEffect(() => {
    const query = settingsToQuery(settings)
    window.history.replaceState(null, '', query ? '?' + query : window.location.pathname)
  }, [settings])

  return [settings, update]
}
