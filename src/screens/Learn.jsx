import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { LESSONS } from '../data/lessons.js'
import { money } from '../utils/format.js'
import LessonModal from '../components/LessonModal.jsx'

export default function Learn({ onToast }) {
  const { isLessonDone, lessonsDone } = useApp()
  const [active, setActive] = useState(null)
  const doneCount = lessonsDone.length

  return (
    <div className="page">
      <h2 style={{ margin: '6px 4px 12px' }}>Learn &amp; Earn 🎓</h2>

      <div className="info-box" style={{ marginBottom: 14 }}>
        Finish a lesson, pass the quiz, and earn a badge plus <b>bonus cash</b> to invest! 💰
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Your badges ({doneCount}/{LESSONS.length})
        </div>
        <div className="badges">
          {LESSONS.map((l) => (
            <div key={l.id} className={`badge ${isLessonDone(l.id) ? '' : 'locked'}`} title={l.title}>
              {l.badge}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 6 }}>
        {LESSONS.map((l) => {
          const done = isLessonDone(l.id)
          return (
            <div key={l.id} className="lesson" onClick={() => setActive(l)}>
              <div className="ic">{l.icon}</div>
              <div className="row-main">
                <div className="row-name">{l.title}</div>
                <div className="row-sub">{l.summary}</div>
              </div>
              <div className="row-right">
                {done ? (
                  <span className="pill up">✅ Done</span>
                ) : (
                  <span className="reward-pill">Earn {money(l.reward)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {active && (
        <LessonModal lesson={active} onClose={() => setActive(null)} onToast={onToast} />
      )}
    </div>
  )
}
