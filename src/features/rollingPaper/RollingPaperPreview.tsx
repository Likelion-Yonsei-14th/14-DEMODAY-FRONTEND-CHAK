import { getPenColor, getStampGlyph, noteTilt } from './rollingPaper'
import './RollingPaperPages.css'

const sampleNotes = [
  { id: 'sample-1', text: '3년 동안 고마웠어! 대학 가서도 꼭 보자', author: '민지', pen: 'blue', stamp: 'heart', x: 29, y: 18 },
  { id: 'sample-2', text: '야자 끝나고 먹던 컵라면 평생 못 잊어', author: '현우', pen: 'red', stamp: 'star', x: 71, y: 30 },
  { id: 'sample-3', text: '수능 끝났다!! 올해 진짜 수고했어 🎉', author: '서연', pen: 'green', stamp: 'cap', x: 30, y: 80 },
  { id: 'sample-4', text: '우리 반 최고 분위기 메이커', author: '도윤', pen: 'purple', stamp: 'smile', x: 70, y: 74 },
]

/** A filled-in sample paper for the start screen. Decorative only. */
export function RollingPaperPreview() {
  return (
    <div className="rolling-paper rolling-paper--preview" aria-hidden>
      <span className="rolling-paper__caption rolling-paper__caption--left">3학년 2반</span>
      <div className="rolling-paper__name">
        <small>To.</small>
        <strong>지수</strong>
        <span>올 한 해 고마웠어!</span>
      </div>
      {sampleNotes.map((note) => (
        <article
          key={note.id}
          className="rolling-note"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            color: getPenColor(note.pen),
            transform: `translate(-50%, -50%) rotate(${noteTilt(note.id)}deg)`,
          }}
        >
          <p>{note.text}</p>
          <span className="rolling-note__sign">
            {getStampGlyph(note.stamp)} — {note.author}
          </span>
        </article>
      ))}
    </div>
  )
}
