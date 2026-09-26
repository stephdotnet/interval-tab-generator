/**
 * Prints what the engine generates for a set of settings, given as the app's query string.
 *
 *   npm run peek -- "deg=1,2,3,4,5,6,7&nav=bestPath&dir=up"
 *   npm run peek -- --compare "deg=1,2,3,4,5,6,7&dir=up"
 *
 * Notes are written "string:fret", strings numbered like a tab (1 = highest).
 */
import { compareBestPaths, describeExercise } from '../src/engine/debug/describe'
import { settingsFromQuery } from '../src/engine/url'

const args = process.argv.slice(2)
const compare = args.includes('--compare')
const query = (args.find((a) => !a.startsWith('--')) ?? '').replace(/^.*\?/, '')
const settings = settingsFromQuery(query)

console.log(compare ? compareBestPaths(settings) : describeExercise(settings))
