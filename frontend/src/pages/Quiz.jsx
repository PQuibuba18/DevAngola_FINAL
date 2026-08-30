import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useLang }  from '../context/LanguageContext';
import api from '../services/api';

const LEVEL_LABELS = {
  pt: { iniciante: 'Iniciante', junior: 'Junior', pleno: 'Pleno', senior: 'Senior' },
  en: { iniciante: 'Beginner', junior: 'Junior',  pleno: 'Mid-level', senior: 'Senior' },
};

const LEVEL_DESC = {
  pt: {
    iniciante: 'Ainda esta a comecar a jornada. E um bom ponto de partida.',
    junior:    'Ja domina o basico e esta a construir experiencia real.',
    pleno:     'Profissional com solida experiencia e boas praticas.',
    senior:    'Referencia tecnica. Lideranca e decisoes de arquitectura.',
  },
  en: {
    iniciante: 'Just starting out. A great starting point.',
    junior:    'Knows the basics and is building real experience.',
    pleno:     'Professional with solid experience and good practices.',
    senior:    'Technical reference. Leadership and architecture decisions.',
  },
};

export default function Quiz() {
  const { user, updateUser } = useAuth();
  const { lang }             = useNavigate() || {};
  const navigate             = useNavigate();
  const { lang: l }          = useLang();

  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [current,   setCurrent]   = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/quiz');
      setQuestions(r.data);
      setAnswers({});
      setCurrent(0);
    } catch {
      setError(l === 'en' ? 'Failed to load questions.' : 'Erro ao carregar as perguntas.');
    } finally {
      setLoading(false);
    }
  }, [l]);

  useEffect(() => { load(); }, [load]);

  function selectAnswer(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }

  function nextQuestion() {
    if (current < questions.length - 1) setCurrent(c => c + 1);
  }

  function prevQuestion() {
    if (current > 0) setCurrent(c => c - 1);
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered   = answeredCount === questions.length;

  async function handleSubmit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = questions.map(q => ({
        questionId: q.id,
        answer:     answers[q.id],
      }));
      const r = await api.post('/quiz/submit', { answers: payload });
      setResult(r.data);
      updateUser({ level: r.data.level });
    } catch {
      setError(l === 'en' ? 'Error processing quiz. Try again.' : 'Erro ao processar o quiz. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  // Resultado final
  if (result) {
    const levelLabel = LEVEL_LABELS[l]?.[result.level] || result.level;
    const levelDesc  = LEVEL_DESC[l]?.[result.level]   || '';
    return (
      <div className="quiz-page">
        <div className="quiz-result card">
          <div className="quiz-result__score">
            <span className="quiz-result__num">{result.score}</span>
            <span className="quiz-result__total">/ {result.total}</span>
          </div>
          <div className={`quiz-result__level-badge level-badge--${result.level}`}>
            {levelLabel}
          </div>
          <p className="quiz-result__desc">{levelDesc}</p>
          <p className="quiz-result__note">
            {l === 'en'
              ? 'Your level will be reassessed in 30 days. Keep studying and come back to level up.'
              : 'O teu nivel sera reavaliado em 30 dias. Continua a estudar e volta para subir de nivel.'}
          </p>
          <button
            className="btn btn--primary btn--lg"
            style={{ marginTop: 'var(--s6)', width: '100%' }}
            onClick={() => navigate('/feed')}
          >
            {l === 'en' ? 'Enter DevAngola' : 'Entrar no DevAngola'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="quiz-page">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--s4)' }}>
        <div className="spinner" />
        <p style={{ color:'var(--ink-400)', fontSize:'var(--t-sm)' }}>
          {l === 'en' ? 'Preparing your quiz...' : 'A preparar o teu quiz...'}
        </p>
      </div>
    </div>
  );

  if (error && !questions.length) return (
    <div className="quiz-page">
      <div className="card" style={{ padding:'var(--s8)', textAlign:'center' }}>
        <p style={{ color:'var(--red)', marginBottom:'var(--s4)' }}>{error}</p>
        <button className="btn btn--primary btn--md" onClick={load}>
          {l === 'en' ? 'Try again' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );

  const q = questions[current];
  if (!q) return null;

  const OPTIONS = ['a','b','c','d'];
  const OPTION_LABELS = { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };

  const DIFF_LABEL = {
    pt: { 1: 'Basico', 2: 'Intermedio', 3: 'Avancado' },
    en: { 1: 'Basic',  2: 'Intermediate', 3: 'Advanced' },
  };

  return (
    <div className="quiz-page">

      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-header__brand">
          <span className="quiz-header__dev">Dev</span>
          <span className="quiz-header__angola">Angola</span>
          <span className="quiz-header__tld">.ao</span>
        </div>
        <p className="quiz-header__title">
          {l === 'en' ? 'Level Assessment Quiz' : 'Quiz de Avaliacao de Nivel'}
        </p>
        <p className="quiz-header__sub">
          {l === 'en'
            ? 'Answer 5 questions honestly. Your level will be assigned automatically.'
            : 'Responde a 5 perguntas com honestidade. O teu nivel sera atribuido automaticamente.'}
        </p>
      </div>

      {/* Progresso */}
      <div className="quiz-progress">
        <div className="quiz-progress__bar">
          <div
            className="quiz-progress__fill"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
        <span className="quiz-progress__label">
          {answeredCount} / {questions.length} {l === 'en' ? 'answered' : 'respondidas'}
        </span>
      </div>

      {/* Indicadores de pergunta */}
      <div className="quiz-dots">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            className={`quiz-dot${i === current ? ' quiz-dot--current' : ''}${answers[qq.id] ? ' quiz-dot--answered' : ''}`}
            onClick={() => setCurrent(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Pergunta */}
      <div className="quiz-card card">
        <div className="quiz-card__meta">
          <span className="quiz-card__num">
            {l === 'en' ? 'Question' : 'Pergunta'} {current + 1} {l === 'en' ? 'of' : 'de'} {questions.length}
          </span>
          <span className={`quiz-card__diff quiz-diff--${q.difficulty}`}>
            {DIFF_LABEL[l]?.[q.difficulty]}
          </span>
        </div>

        <h2 className="quiz-card__question">{q.question}</h2>

        <div className="quiz-options">
          {OPTIONS.map(opt => (
            <button
              key={opt}
              className={`quiz-option${answers[q.id] === opt ? ' quiz-option--selected' : ''}`}
              onClick={() => selectAnswer(q.id, opt)}
            >
              <span className="quiz-option__letter">{opt.toUpperCase()}</span>
              <span className="quiz-option__text">{OPTION_LABELS[opt]}</span>
            </button>
          ))}
        </div>

        <div className="quiz-card__nav">
          <button
            className="btn btn--ghost btn--md"
            onClick={prevQuestion}
            disabled={current === 0}
          >
            {l === 'en' ? 'Previous' : 'Anterior'}
          </button>

          {current < questions.length - 1 ? (
            <button
              className="btn btn--primary btn--md"
              onClick={nextQuestion}
              disabled={!answers[q.id]}
            >
              {l === 'en' ? 'Next' : 'Seguinte'}
            </button>
          ) : (
            <button
              className={`btn btn--primary btn--md${submitting ? ' btn--loading' : ''}`}
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {l === 'en' ? 'Submit' : 'Submeter'}
            </button>
          )}
        </div>
      </div>

      {error && <p style={{ color:'var(--red)', textAlign:'center', fontSize:'var(--t-sm)' }}>{error}</p>}

    </div>
  );
}
