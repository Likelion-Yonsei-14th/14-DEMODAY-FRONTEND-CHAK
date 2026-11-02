// Fails a pull request that changes the 수험생 커리어 시뮬레이터 without a new Patch Note.
//
//   node scripts/check-exam-career-patch-notes.mjs <base-ref>
//
// Changes to tests only do not need a note. Writing guide:
// src/features/minigame/examCareer/CLAUDE.md
import { execFileSync } from 'node:child_process'

const GAME_DIR = 'src/features/minigame/examCareer/'
const NOTES_FILE = `${GAME_DIR}examCareerPatchNotes.ts`
const GUIDE = `${GAME_DIR}CLAUDE.md`

const base = process.argv[2]
if (!base) {
  console.error('Usage: node scripts/check-exam-career-patch-notes.mjs <base-ref>')
  process.exit(2)
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })

/** The newest version in a copy of the notes file, or null when there is none. */
function latestVersion(source) {
  return source.match(/version:\s*'(\d+\.\d+\.\d+)'/)?.[1] ?? null
}

function readAt(ref, path) {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

const changed = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean)
const gameChanges = changed.filter(
  (path) => path.startsWith(GAME_DIR) && path !== NOTES_FILE && path !== GUIDE && !/\.test\.tsx?$/.test(path),
)

if (gameChanges.length === 0) {
  console.log('Patch Note: 게임 코드 변경이 없어 건너뜁니다.')
  process.exit(0)
}

const before = latestVersion(readAt(base, NOTES_FILE) ?? '')
const after = latestVersion(readAt('HEAD', NOTES_FILE) ?? '')

if (after && after !== before) {
  console.log(`Patch Note: v${before ?? '-'} → v${after}`)
  process.exit(0)
}

console.error(
  [
    '수험생 커리어 시뮬레이터 코드가 바뀌었지만 Patch Note에 새 버전이 없어요.',
    '',
    ...gameChanges.map((path) => `  - ${path}`),
    '',
    `${NOTES_FILE} 맨 위에 이 PR의 버전과 바뀐 점을 추가해 주세요.`,
    `작성 방법: ${GUIDE}`,
  ].join('\n'),
)
process.exit(1)
