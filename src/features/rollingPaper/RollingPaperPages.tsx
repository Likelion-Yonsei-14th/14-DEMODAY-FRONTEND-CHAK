import {
  forwardRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import {
  ArrowLeft,
  Check,
  Download,
  Lock,
  PencilLine,
  Settings,
  Share2,
  Trash2,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AppBar,
  BottomSheet,
  Button,
  IconButton,
  useFeedback,
} from '@/design-system'
import { useHomePath } from '@/app/homePath'
import { classroomZoneLabels } from '@/features/classroom/classroomCabinet'
import { ClassroomScene } from '@/features/classroom/ClassroomScene'
import { AppShell } from '@/layout/AppShell'
import { usePrototypeStore } from '@/store/prototypeStore'
import type {
  RollingPaperBoardEntry,
  RollingPaperClass,
  RollingPaperLocker,
  RollingPaperNote,
} from '@/types'
import {
  clampNotePosition,
  countNotesOnMyPaper,
  findMyNote,
  hasWrittenOn,
  getPenColor,
  getStampGlyph,
  isOwnPaperOpen,
  isPersonalPaper,
  isRollingPaperEnded,
  PAPER_GREETING,
  getRevealMode,
  getPaperDesign,
  noteAuthorName,
  notesOnPaper,
  noteTilt,
  ROLLING_PAPER_NOTE_MAX,
  rollingPaperPens,
  rollingPaperStamps,
} from './rollingPaper'
import {
  rollingPaperClassPath,
  shareRollingPaperInvite,
} from './rollingPaperShare'
import { paperDesignSurface } from './paperDesignSurface'
import {
  addRollingPaperBoardEntry,
  removeRollingPaperBoardEntry,
  removeRollingPaperNote,
  rollingPaperErrorMessage,
  saveRollingPaperNote,
} from './rollingPaperActions'
import { RollingPaperLoadState } from './RollingPaperLoadState'
import { useRollingPaperLoad } from './useRollingPaperLoad'
import { getTextBounds } from '@/features/composer/backgroundAssets'
import '@/features/classroom/Classroom.css'
import './RollingPaperPages.css'

type Position = { x: number; y: number }

const paperPath = (classId: string, lockerId: string) =>
  `${rollingPaperClassPath(classId)}/paper/${lockerId}`

/** The class template: walk the classroom and open a friend's locker to write. */
export function RollingPaperClassPage() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const homePath = useHomePath()
  const paperClass = usePrototypeStore((state) => state.rollingPaperClass)
  const member = usePrototypeStore((state) => state.rollingPaperMember)
  const { showToast } = useFeedback()
  const [camera, setCamera] = useState(2)
  const [listOpen, setListOpen] = useState(false)
  const [boardOpen, setBoardOpen] = useState(false)
  const load = useRollingPaperLoad(classId)

  if (load.status !== 'ready') {
    return <RollingPaperLoadState status={load.status} onRetry={load.retry} />
  }
  if (!member) {
    return (
      <Navigate
        to={`${rollingPaperClassPath(classId ?? paperClass.id)}/join`}
        replace
      />
    )
  }

  const id = classId ?? paperClass.id
  if (isPersonalPaper(paperClass)) {
    // A personal paper has no classroom: open its one paper.
    const ownerLocker = paperClass.lockers[0]
    return ownerLocker ? <Navigate to={paperPath(id, ownerLocker.id)} replace /> : <Navigate to={homePath} replace />
  }
  const myLocker = paperClass.lockers.find(
    (locker) => locker.id === member.lockerId,
  )
  const friends = paperClass.lockers.filter(
    (locker) => locker.id !== member.lockerId,
  )
  const wrote = (lockerId: string) =>
    hasWrittenOn(paperClass, lockerId, member.lockerId)
  const invite = () => shareRollingPaperInvite(id, paperClass.name, showToast)
  const openPaper = (lockerId: string) => navigate(paperPath(id, lockerId))
  const boardEntries = paperClass.boardEntries ?? []

  const boardContent = (
    <>
      <span className="classroom-map__chalk-date">
        {/* Like a real board: today's date in the corner */}
        {new Intl.DateTimeFormat('ko-KR', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        }).format(new Date())}
      </span>
      <span className="classroom-map__chalk">
        <span className="classroom-map__chalk-title">
          {paperClass.name}, 올 한 해 수고했어!
        </span>
        {boardEntries.slice(-BOARD_VISIBLE_LINES).map((entry) => (
          <span key={entry.id} className="classroom-map__chalk-note">
            {entry.text}
          </span>
        ))}
        {paperClass.endedAt && (
          <span className="classroom-map__chalk-note">
            롤링페이퍼 종료! 각자 열어 보세요
          </span>
        )}
        {boardEntries.length === 0 && (
          <span className="classroom-map__chalk-note">
            칠판을 눌러 반 친구들에게 한마디 적어요
          </span>
        )}
      </span>
    </>
  )

  return (
    <AppShell
      surface="transparent"
      contentClassName="classroom-map-shell"
      appBar={
        <AppBar
          title={`${paperClass.name} 롤링페이퍼`}
          subtitle={`${member.displayName} · ${classroomZoneLabels[camera]}`}
          transparent
          leading={
            <IconButton
              label="홈으로 돌아가기"
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={() => navigate(homePath)}
            />
          }
          trailing={
            <div className="classroom-map__app-actions">
              <IconButton
                label="친구 초대하기"
                icon={<Share2 size={20} aria-hidden />}
                onClick={invite}
              />
              <IconButton
                label="롤링페이퍼 설정"
                icon={<Settings size={20} aria-hidden />}
                onClick={() => navigate(`${rollingPaperClassPath(id)}/settings`)}
              />
            </div>
          }
        />
      }
    >
      <main className="classroom-map">
        <p className="classroom-map__hint">
          친구 사물함을 누르면 롤링페이퍼가 펼쳐져요.
        </p>

        <ClassroomScene
          ariaLabel="롤링페이퍼 교실"
          camera={camera}
          onCameraChange={setCamera}
          lockers={[...(myLocker ? [myLocker] : []), ...friends].map(
            (locker) => {
              const mine = locker.id === member.lockerId
              return {
                id: locker.id,
                name: locker.studentName,
                mine,
                tag: mine
                  ? `★ ${locker.studentName}`
                  : wrote(locker.id)
                    ? `✓ ${locker.studentName}`
                    : locker.studentName,
              }
            },
          )}
          onLockerClick={openPaper}
          emptyLockerLabel="빈 사물함 · 친구 초대하기"
          onEmptyLockerClick={invite}
          onShowAllLockers={() => setListOpen(true)}
          showAllLabel="롤링페이퍼 전체 보기"
          blackboard={
            // Anyone in the class can chalk a line on the board.
            <button
              type="button"
              className="classroom-map__blackboard"
              aria-label="칠판 보기, 한마디 쓰기"
              onClick={() => setBoardOpen(true)}
            >
              {boardContent}
            </button>
          }
        />

        {boardOpen && (
          <BoardSheet
            classId={id}
            myLockerId={member.lockerId}
            onClose={() => setBoardOpen(false)}
          />
        )}

        <BottomSheet
          open={listOpen}
          onClose={() => setListOpen(false)}
          title={`${paperClass.name} 롤링페이퍼`}
          description="친구 롤링페이퍼를 골라 한마디 남겨요."
        >
          <div className="rolling-paper-list">
            {myLocker && (
              <button
                type="button"
                className="rolling-paper-mine"
                onClick={() => openPaper(myLocker.id)}
              >
                <MiniPaper
                  className="rolling-paper-mine__paper"
                  designId={myLocker.paperDesign}
                >
                  <span>To.</span>
                  <strong>{myLocker.studentName}</strong>
                </MiniPaper>
                <span className="rolling-paper-mine__body">
                  <small>내 롤링페이퍼</small>
                  <strong>
                    {isOwnPaperOpen(paperClass)
                      ? '지금 열어볼 수 있어요'
                      : '종료될 때까지 비밀이에요'}
                  </strong>
                  {!isOwnPaperOpen(paperClass) && (
                    <span>
                      <Lock size={12} aria-hidden />
                      만든 사람이 종료하면 열려요
                    </span>
                  )}
                </span>
              </button>
            )}

            {friends.length === 0 ? (
              <p className="rolling-paper-list__empty">
                아직 친구가 없어요. 초대하면 친구 사물함에도 롤링페이퍼가 걸려요.
              </p>
            ) : (
              <div className="rolling-paper-list__grid">
                {friends.map((locker, index) => (
                  <FriendPaperCard
                    key={locker.id}
                    locker={locker}
                    index={index}
                    written={wrote(locker.id)}
                    onClick={() => openPaper(locker.id)}
                  />
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Share2 size={17} aria-hidden />}
              onClick={invite}
            >
              친구 초대하기
            </Button>
          </div>
        </BottomSheet>
      </main>
    </AppShell>
  )
}

const BOARD_ENTRY_MAX = 30
const BOARD_VISIBLE_LINES = 3

/** The classroom board: everyone's lines, and a field to chalk my own. */
function BoardSheet({
  classId,
  myLockerId,
  onClose,
}: {
  classId: string
  myLockerId: string
  onClose: () => void
}) {
  const entries = usePrototypeStore(
    (state) => state.rollingPaperClass.boardEntries,
  )
  const [busy, setBusy] = useState(false)
  const lockers = usePrototypeStore((state) => state.rollingPaperClass.lockers)
  const { showToast } = useFeedback()
  const [text, setText] = useState('')
  const authorName = (entry: RollingPaperBoardEntry) =>
    lockers.find((locker) => locker.id === entry.authorLockerId)?.studentName ??
    entry.authorName

  const write = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await addRollingPaperBoardEntry(classId, text)
      setText('')
      showToast('칠판에 적었어요.')
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const wipe = async (entryId: string) => {
    try {
      await removeRollingPaperBoardEntry(classId, entryId)
      showToast('칠판에서 지웠어요.')
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="우리 반 칠판"
      description={`누구나 한 줄씩 적을 수 있어요. 교실 칠판에는 최근 ${BOARD_VISIBLE_LINES}줄이 보여요.`}
    >
      <div className="rolling-board">
        {entries && entries.length > 0 ? (
          <ul className="rolling-board__entries">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id}>
                <p>{entry.text}</p>
                <span>— {authorName(entry)}</span>
                {entry.authorLockerId === myLockerId && (
                  <button
                    type="button"
                    aria-label="내 글 지우기"
                    onClick={() => wipe(entry.id)}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rolling-board__empty">아직 칠판이 비어 있어요. 첫 줄을 적어 보세요.</p>
        )}

        <div className="rolling-board__write">
          <input
            value={text}
            maxLength={BOARD_ENTRY_MAX}
            placeholder="3년 동안 고생 많았다!"
            aria-label="칠판에 적을 말"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) write()
            }}
          />
          <Button variant="brand" size="m" disabled={!text.trim()} loading={busy} onClick={write}>
            적기
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

/** A small paper painted with its owner's letter design. */
function MiniPaper({
  designId,
  className,
  children,
}: {
  designId?: string
  className: string
  children: ReactNode
}) {
  const surface = paperDesignSurface(designId)
  return (
    <span
      className={[className, surface.className].filter(Boolean).join(' ')}
      style={surface.style}
      aria-hidden
    >
      {children}
    </span>
  )
}

function FriendPaperCard({
  locker,
  index,
  written,
  onClick,
}: {
  locker: RollingPaperLocker
  index: number
  written: boolean
  onClick: () => void
}) {
  const surface = paperDesignSurface(locker.paperDesign)
  return (
    <button
      type="button"
      className={[
        'rolling-paper-card',
        written ? 'rolling-paper-card--written' : '',
        surface.className,
      ].filter(Boolean).join(' ')}
      style={{
        ...surface.style,
        '--card-tilt': `${index % 2 ? 1.2 : -1.2}deg`,
      } as React.CSSProperties}
      onClick={onClick}
      aria-label={`${locker.studentName}의 롤링페이퍼${written ? ', 내가 썼어요' : ''}`}
    >
      <span className="rolling-paper-card__name">{locker.studentName}</span>
      <span className="rolling-paper-card__badge">
        {written ? (
          <>
            <Check size={12} aria-hidden />
            썼어요
          </>
        ) : (
          <>
            <PencilLine size={12} aria-hidden />
            쓰러 가기
          </>
        )}
      </span>
    </button>
  )
}

/** Spots tried, in order, when the writer uses the button instead of touching the paper. */
const FALLBACK_SPOTS: Position[] = [
  { x: 30, y: 16 }, { x: 70, y: 16 }, { x: 30, y: 84 }, { x: 70, y: 84 },
  { x: 25, y: 36 }, { x: 75, y: 36 }, { x: 25, y: 64 }, { x: 75, y: 64 },
  { x: 50, y: 10 }, { x: 50, y: 90 },
]

const findFreeSpot = (
  notes: RollingPaperNote[],
  designId?: string,
): Position => {
  const spots = FALLBACK_SPOTS.map((spot) =>
    clampNotePosition(spot.x, spot.y, designId),
  )
  return (
    spots.find((spot) =>
      notes.every(
        (note) => Math.abs(note.x - spot.x) > 30 || Math.abs(note.y - spot.y) > 14,
      ),
    ) ?? clampNotePosition(50, 88, designId)
  )
}

export function RollingPaperPage() {
  const navigate = useNavigate()
  const homePath = useHomePath()
  const { classId, lockerId } = useParams()
  const paperClass = usePrototypeStore((state) => state.rollingPaperClass)
  const member = usePrototypeStore((state) => state.rollingPaperMember)
  const [pending, setPending] = useState<Position | null>(null)
  const [saving, setSaving] = useState(false)
  const [paperNode, setPaperNode] = useState<HTMLDivElement | null>(null)
  const { showToast } = useFeedback()
  const load = useRollingPaperLoad(classId, lockerId)

  if (load.status !== 'ready') {
    return <RollingPaperLoadState status={load.status} onRetry={load.retry} />
  }
  if (!member) {
    return (
      <Navigate
        to={`${rollingPaperClassPath(classId ?? paperClass.id)}/join`}
        replace
      />
    )
  }

  const id = classId ?? paperClass.id
  const locker = paperClass.lockers.find((item) => item.id === lockerId)
  if (!locker) {
    return <Navigate to={rollingPaperClassPath(id)} replace />
  }

  const mine = locker.id === member.lockerId
  const notes = notesOnPaper(paperClass, locker.id)
  const myNote = mine
    ? undefined
    : findMyNote(paperClass, locker.id, member.lockerId)
  const sealed = mine && !isOwnPaperOpen(paperClass)
  const ended = isRollingPaperEnded(paperClass)
  // Friends write until the creator ends the rolling paper.
  const writable = !mine && !ended
  const personal = isPersonalPaper(paperClass)
  // A personal paper has no classroom to go back to.
  const backToClass = () => navigate(personal ? homePath : rollingPaperClassPath(id))
  const shareMine = () => shareRollingPaperInvite(id, paperClass.name, showToast, true)

  const saveImage = async () => {
    if (!paperNode) return
    setSaving(true)
    try {
      const [{ toPng }, { buildFontEmbedCSS }, { downloadDataUrl }] =
        await Promise.all([
          import('html-to-image'),
          import('@/features/ads/captureFonts'),
          import('@/features/admin/ads/adPreviewImage'),
        ])
      const fontEmbedCSS = await buildFontEmbedCSS(
        paperNode.textContent ?? '',
      ).catch(() => '')
      const dataUrl = await toPng(paperNode, {
        pixelRatio: 2,
        fontEmbedCSS,
        backgroundColor: getComputedStyle(paperNode).backgroundColor,
      })
      downloadDataUrl(
        dataUrl,
        `${paperClass.name}-${locker.studentName}-롤링페이퍼.png`.replace(
          /[\\/:*?"<>|]/g,
          '',
        ),
      )
    } catch {
      showToast('이미지를 만들지 못했어요. 다시 눌러 주세요.')
    } finally {
      setSaving(false)
    }
  }

  const fixedAction = sealed && personal ? (
    <Button
      variant="brand"
      fullWidth
      leadingIcon={<Share2 size={18} aria-hidden />}
      onClick={shareMine}
    >
      내 롤링페이퍼 링크 보내기
    </Button>
  ) : sealed ? (
    <Button
      variant="brand"
      fullWidth
      leadingIcon={<PencilLine size={18} aria-hidden />}
      onClick={backToClass}
    >
      친구들 롤링페이퍼 쓰러 가기
    </Button>
  ) : mine && personal && notes.length === 0 ? (
    <Button
      variant="brand"
      fullWidth
      leadingIcon={<Share2 size={18} aria-hidden />}
      onClick={shareMine}
    >
      내 롤링페이퍼 링크 보내기
    </Button>
  ) : mine ? (
    <Button
      variant="brand"
      fullWidth
      loading={saving}
      disabled={notes.length === 0}
      leadingIcon={<Download size={18} aria-hidden />}
      onClick={saveImage}
    >
      이미지로 간직하기
    </Button>
  ) : ended ? (
    <Button variant="secondary" fullWidth onClick={backToClass}>
      {personal ? '홈으로 가기' : '교실로 돌아가기'}
    </Button>
  ) : (
    <Button
      variant="brand"
      fullWidth
      leadingIcon={<PencilLine size={18} aria-hidden />}
      onClick={() =>
        setPending(myNote ? { x: myNote.x, y: myNote.y } : findFreeSpot(notes, locker.paperDesign))
      }
    >
      {myNote ? '내 한마디 고치기' : `${locker.studentName}에게 한마디 쓰기`}
    </Button>
  )

  return (
    <AppShell
      surface="base"
      contentClassName="rolling-paper-shell"
      appBar={
        <AppBar
          title={mine ? '내 롤링페이퍼' : `${locker.studentName}의 롤링페이퍼`}
          subtitle={paperClass.name}
          leading={
            <IconButton
              label={personal ? '홈으로' : '교실로 돌아가기'}
              icon={<ArrowLeft size={21} aria-hidden />}
              onClick={backToClass}
            />
          }
          trailing={
            personal && mine ? (
              <>
                <IconButton
                  label="링크 보내기"
                  icon={<Share2 size={20} aria-hidden />}
                  onClick={shareMine}
                />
                <IconButton
                  label="설정"
                  icon={<Settings size={20} aria-hidden />}
                  onClick={() => navigate(`${rollingPaperClassPath(id)}/settings`)}
                />
              </>
            ) : undefined
          }
        />
      }
      fixedAction={fixedAction}
    >
      <main className="rolling-paper-page">
        {sealed ? (
          <SealedPaper
            noteCount={countNotesOnMyPaper(paperClass, member.lockerId)}
            personal={personal}
          />
        ) : (
          <>
            {writable && (
              <p className="rolling-paper-page__hint">
                {myNote
                  ? '내 글을 누르면 고칠 수 있고, 빈 곳을 누르면 그 자리로 옮겨요.'
                  : '종이의 빈 곳을 눌러 그 자리에 한마디를 남겨요.'}
              </p>
            )}
            <RollingPaperSheet
              ref={setPaperNode}
              paperClass={paperClass}
              locker={locker}
              notes={notes}
              myLockerId={member.lockerId}
              pending={pending}
              onTouch={writable ? setPending : undefined}
              onTouchOthersNote={() =>
                showToast('다른 친구 글 위에는 쓸 수 없어요. 빈 곳을 눌러 주세요.')
              }
            />
            {!mine && personal && (
              <p className="rolling-paper-page__hint">
                흐리게 보이는 글은 다른 사람이 남긴 한마디예요. {locker.studentName}만 읽을 수 있어요.
              </p>
            )}
            {!mine && (
              <p className="rolling-paper-page__hint">
                {ended
                  ? '롤링페이퍼가 종료돼서 더 이상 쓸 수 없어요.'
                  : getRevealMode(paperClass) === 'instant'
                    ? `${locker.studentName}도 바로 볼 수 있어요.`
                    : `${locker.studentName}에게는 롤링페이퍼가 종료되면 공개돼요.`}
              </p>
            )}
          </>
        )}
      </main>

      {writable && (
        <NoteWriterSheet
          key={myNote?.id ?? 'new'}
          open={pending !== null}
          position={pending}
          onClose={() => setPending(null)}
          recipientName={locker.studentName}
          classId={id}
          paperLockerId={locker.id}
          existing={myNote}
        />
      )}
    </AppShell>
  )
}

function SealedPaper({ noteCount, personal }: { noteCount: number; personal: boolean }) {
  return (
    <section className="rolling-paper-sealed">
      <div className="rolling-paper-sealed__roll" aria-hidden>
        <span className="rolling-paper-sealed__ribbon" />
        <span className="rolling-paper-sealed__knot" />
      </div>
      <h1>
        {noteCount > 0
          ? `친구 ${noteCount}명이 한마디를 남겼어요`
          : '친구들이 곧 채워 줄 거예요'}
      </h1>
      <p>
        {personal
          ? '설정에서 롤링페이퍼를 종료하면 리본이 풀려요.'
          : '반을 만든 사람이 롤링페이퍼를 종료하면 리본이 풀려요.'}
        <br />
        누가 뭐라고 썼는지는 그때까지 비밀이에요.
      </p>
    </section>
  )
}

type SheetProps = {
  paperClass: RollingPaperClass
  locker: RollingPaperLocker
  notes: RollingPaperNote[]
  myLockerId: string
  /** Where the writer just touched, while the writer sheet is open. */
  pending?: Position | null
  /** Touching the paper picks the spot to write; omitted on my own paper. */
  onTouch?: (position: Position) => void
  onTouchOthersNote?: () => void
}

const RollingPaperSheet = forwardRef<HTMLDivElement, SheetProps>(
  function RollingPaperSheet(
    {
      paperClass,
      locker,
      notes,
      myLockerId,
      pending,
      onTouch,
      onTouchOthersNote,
    },
    ref,
  ) {
    const touchPaper = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!onTouch) return
      const rect = event.currentTarget.getBoundingClientRect()
      onTouch(
        clampNotePosition(
          ((event.clientX - rect.left) / rect.width) * 100,
          ((event.clientY - rect.top) / rect.height) * 100,
          locker.paperDesign,
        ),
      )
    }

    // The owner's letter design, with captions kept inside its writable area.
    const surface = paperDesignSurface(locker.paperDesign)
    const bounds = getTextBounds(getPaperDesign(locker.paperDesign))

    return (
      <div
        ref={ref}
        className={[
          'rolling-paper',
          onTouch ? 'rolling-paper--writable' : '',
          surface.className,
        ].filter(Boolean).join(' ')}
        style={{
          ...surface.style,
          '--paper-top': `${bounds.top}%`,
          '--paper-left': `${bounds.left}%`,
          '--paper-right': `${100 - bounds.right}%`,
        } as React.CSSProperties}
        onClick={touchPaper}
      >
        <span className="rolling-paper__caption rolling-paper__caption--left">
          {paperClass.name}
        </span>

        <div className="rolling-paper__name" aria-hidden={Boolean(onTouch)}>
          <small>To.</small>
          <strong>{locker.studentName}</strong>
          <span>{PAPER_GREETING}</span>
        </div>

        {notes.map((note) => {
          const isMine = note.authorLockerId === myLockerId
          const stamp = getStampGlyph(note.stamp)
          // While moving my note, show it at the new spot instead.
          if (isMine && pending) return null
          if (note.hidden) {
            // Someone else's note on a personal paper: only its spot is known, drawn blurred.
            return (
              <article
                key={note.id}
                className="rolling-note rolling-note--hidden"
                aria-label="다른 사람이 남긴 한마디(주인만 볼 수 있어요)"
                style={{
                  left: `${note.x}%`,
                  top: `${note.y}%`,
                  color: getPenColor(note.pen),
                  transform: `translate(-50%, -50%) rotate(${noteTilt(note.id)}deg)`,
                }}
                onClick={(event) => {
                  if (!onTouch) return
                  event.stopPropagation()
                  onTouchOthersNote?.()
                }}
              >
                <p aria-hidden>{hiddenNoteFiller(note.id)}</p>
                <span className="rolling-note__sign" aria-hidden>
                  — ○○○
                </span>
              </article>
            )
          }
          return (
            <article
              key={note.id}
              className={[
                'rolling-note',
                isMine ? 'rolling-note--mine' : '',
              ].filter(Boolean).join(' ')}
              style={{
                left: `${note.x}%`,
                top: `${note.y}%`,
                color: getPenColor(note.pen),
                transform: `translate(-50%, -50%) rotate(${noteTilt(note.id)}deg)`,
              }}
              onClick={(event) => {
                if (!onTouch) return
                event.stopPropagation()
                if (isMine) onTouch({ x: note.x, y: note.y })
                else onTouchOthersNote?.()
              }}
            >
              <p>{note.text}</p>
              <span className="rolling-note__sign">
                {stamp && <span aria-hidden>{stamp} </span>}—{' '}
                {noteAuthorName(paperClass, note)}
              </span>
            </article>
          )
        })}

        {pending && (
          <span
            className="rolling-paper__pending"
            style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
            aria-hidden
          >
            <PencilLine size={16} />
            여기에 쓸게요
          </span>
        )}

        {notes.length === 0 && !onTouch && (
          <p className="rolling-paper__empty">아직 비어 있어요.</p>
        )}
      </div>
    )
  },
)

/** Placeholder scribble under the blur, so hidden notes look like real lines of different lengths. */
function hiddenNoteFiller(id: string) {
  const lines = ['올해 정말 고마웠어 내년에도', '수능 끝난 거 축하해 우리', '항상 응원해 진짜로', '너랑 같은 반이라 좋았어 올해']
  return lines[Math.abs(noteTilt(id) * 10 | 0) % lines.length]
}

function NoteWriterSheet({
  open,
  position,
  onClose,
  recipientName,
  classId,
  paperLockerId,
  existing,
}: {
  open: boolean
  position: Position | null
  onClose: () => void
  recipientName: string
  classId: string
  paperLockerId: string
  existing?: RollingPaperNote
}) {
  const [busy, setBusy] = useState(false)
  const authorName = usePrototypeStore(
    (state) => state.rollingPaperMember?.displayName ?? '',
  )
  const { showToast } = useFeedback()
  const [text, setText] = useState(existing?.text ?? '')
  const [pen, setPen] = useState<string>(existing?.pen ?? rollingPaperPens[0].id)
  const [stamp, setStamp] = useState<string>(
    existing?.stamp ?? rollingPaperStamps[0].id,
  )

  const save = async () => {
    if (!text.trim() || !position || busy) return
    setBusy(true)
    try {
      await saveRollingPaperNote(classId, paperLockerId, { text, pen, stamp, ...position })
      showToast(
        existing
          ? '내 한마디를 고쳤어요.'
          : `${recipientName}의 롤링페이퍼에 남겼어요.`,
      )
      onClose()
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (busy) return
    setBusy(true)
    try {
      await removeRollingPaperNote(classId, paperLockerId)
      showToast('내 한마디를 지웠어요.')
      onClose()
    } catch (error) {
      showToast(rollingPaperErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const glyph = getStampGlyph(stamp)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`${recipientName}에게 한마디`}
      description="고른 자리에 이 펜으로 적혀요."
    >
      <div className="rolling-writer">
        <div className="rolling-writer__preview" style={{ color: getPenColor(pen) }}>
          <textarea
            value={text}
            maxLength={ROLLING_PAPER_NOTE_MAX}
            placeholder="같이 보낸 시간 중에 제일 기억나는 거 하나!"
            aria-label="한마디"
            autoFocus
            onChange={(event) => setText(event.target.value)}
          />
          <span className="rolling-writer__sign">
            {glyph && <span aria-hidden>{glyph} </span>}— {authorName}
          </span>
          <small>
            {text.length}/{ROLLING_PAPER_NOTE_MAX}
          </small>
        </div>

        <fieldset className="rolling-writer__options">
          <legend>펜 색</legend>
          <div className="rolling-writer__pens">
            {rollingPaperPens.map((item) => (
              <button
                type="button"
                key={item.id}
                className="rolling-writer__pen"
                style={{ '--pen-color': item.value } as React.CSSProperties}
                aria-label={item.label}
                aria-pressed={pen === item.id}
                onClick={() => setPen(item.id)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="rolling-writer__options">
          <legend>낙서</legend>
          <div className="rolling-writer__stamps">
            {rollingPaperStamps.map((item) => (
              <button
                type="button"
                key={item.id}
                className="rolling-writer__stamp"
                aria-label={item.label}
                aria-pressed={stamp === item.id}
                onClick={() => setStamp(item.id)}
              >
                {item.glyph || '없음'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="rolling-writer__actions">
          {existing && (
            <Button
              variant="tertiary"
              disabled={busy}
              leadingIcon={<Trash2 size={16} aria-hidden />}
              onClick={remove}
            >
              지우기
            </Button>
          )}
          <Button
            variant="brand"
            fullWidth
            disabled={!text.trim()}
            loading={busy}
            onClick={save}
          >
            {existing ? '고친 내용 남기기' : '여기에 남기기'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
