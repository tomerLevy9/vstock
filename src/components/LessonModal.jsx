import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { money } from '../utils/format.js'

// Walks a kid through a lesson's cards, then a quiz, then a reward celebration.
export default function LessonModal({ lesson, onClose, onToast }) {
  const { completeLesson } = useApp()
  const [phase, setPhase] = useState('cards') // 'cards' | 'quiz' | 'success'
  const [cardIdx, setCardIdx] = useState(0)
  const [quizIdx, setQuizIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [reward, setReward] = useState(0)

  const question = lesson.quiz[quizIdx]
  const isCorrect = picked !== null && picked === question?.answer

  const nextCard = () => {
    if (cardIdx < lesson.cards.length - 1) setCardIdx(cardIdx + 1)
    else setPhase('quiz')
  }

  const pick = (i) => {
    if (isCorrect) return // already answered correctly; lock it
    setPicked(i)
  }

  const nextQuestion = () => {
    setPicked(null)
    if (quizIdx < lesson.quiz.length - 1) setQuizIdx(quizIdx + 1)
    else {
      const res = completeLesson(lesson.id, lesson.reward)
      if (res.ok) {
        setReward(res.reward)
        onToast?.(`🎓 +${money(res.reward)} earned!`)
      }
      setPhase('success')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* ---- CARDS ---- */}
        {phase === 'cards' && (
          <>
            <div className="center" style={{ fontSize: 48 }}>{lesson.icon}</div>
            <h2 className="center" style={{ margin: '4px 0 10px' }}>{lesson.title}</h2>
            <div className="info-box" style={{ fontSize: 16, minHeight: 90, display: 'flex', alignItems: 'center' }}>
              {lesson.cards[cardIdx]}
            </div>
            <div className="dots">
              {lesson.cards.map((_, i) => (
                <span key={i} className={i === cardIdx ? 'on' : ''} />
              ))}
            </div>
            <button className="btn" onClick={nextCard}>
              {cardIdx < lesson.cards.length - 1 ? 'Next →' : 'Take the quiz! ✏️'}
            </button>
          </>
        )}

        {/* ---- QUIZ ---- */}
        {phase === 'quiz' && (
          <>
            <div className="muted center" style={{ fontSize: 13 }}>
              Question {quizIdx + 1} of {lesson.quiz.length}
            </div>
            <h3 className="center" style={{ margin: '6px 0 16px' }}>{question.q}</h3>
            {question.options.map((opt, i) => {
              let cls = 'quiz-opt'
              if (picked === i && i === question.answer) cls += ' correct'
              else if (picked === i) cls += ' wrong'
              return (
                <button key={i} className={cls} onClick={() => pick(i)}>{opt}</button>
              )
            })}
            {isCorrect && (
              <>
                <div className="info-box" style={{ marginTop: 6 }}>✅ {question.explain}</div>
                <button className="btn" style={{ marginTop: 12 }} onClick={nextQuestion}>
                  {quizIdx < lesson.quiz.length - 1 ? 'Next question →' : 'Finish & earn! 🎉'}
                </button>
              </>
            )}
            {picked !== null && !isCorrect && (
              <div className="error-msg center" style={{ marginTop: 6 }}>Not quite — try again! 🤔</div>
            )}
          </>
        )}

        {/* ---- SUCCESS ---- */}
        {phase === 'success' && (
          <div className="center">
            <div style={{ fontSize: 64 }}>{lesson.badge}</div>
            <h2 style={{ margin: '6px 0' }}>You earned a badge!</h2>
            {reward > 0 ? (
              <div className="info-box" style={{ marginBottom: 14 }}>
                Nice work! <b>{money(reward)}</b> bonus cash was added to your account. 🎉
              </div>
            ) : (
              <div className="info-box" style={{ marginBottom: 14 }}>
                You already earned this one — great review! 👍
              </div>
            )}
            <button className="btn" onClick={onClose}>Awesome!</button>
          </div>
        )}
      </div>
    </div>
  )
}
