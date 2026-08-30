import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Question {
  id:       number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  category: string;
}

type Answer = 'a' | 'b' | 'c' | 'd';

const OPTION_KEYS: Answer[] = ['a', 'b', 'c', 'd'];
const LEVEL_LABEL: Record<string, string> = {
  iniciante: 'Iniciante', junior: 'Júnior',
  pleno: 'Pleno', senior: 'Sénior',
};
const LEVEL_COLOR: Record<string, string> = {
  iniciante: '#1E5631', junior: '#1A3A8A',
  pleno: '#7B4F00', senior: '#4A1580',
};

export default function QuizScreen() {
  const router              = useRouter();
  const { updateUser }      = useAuth();
  const [phase,  setPhase]  = useState<'loading'|'quiz'|'result'|'cooldown'>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<{ questionId: number; answer: Answer }[]>([]);
  const [selected,  setSelected]  = useState<Answer | null>(null);
  const [result,    setResult]    = useState<{ score: number; level: string } | null>(null);
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    try {
      const r = await api.get('/quiz/questions');
      setQuestions(r.data);
      setPhase('quiz');
    } catch (err: any) {
      if (err.response?.data?.cooldown) {
        setPhase('cooldown');
      } else {
        Alert.alert('Erro', err.response?.data?.error || 'Não foi possível carregar o quiz.');
        router.back();
      }
    }
  }

  function selectOption(opt: Answer) {
    setSelected(opt);
  }

  function goNext() {
    if (!selected) {
      Alert.alert('Atenção', 'Selecciona uma resposta antes de avançar.');
      return;
    }
    const q = questions[current];
    const newAnswers = [...answers, { questionId: q.id, answer: selected }];
    setAnswers(newAnswers);
    setSelected(null);

    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      submitQuiz(newAnswers);
    }
  }

  async function submitQuiz(finalAnswers: typeof answers) {
    setSubmitting(true);
    try {
      const r = await api.post('/quiz/submit', { answers: finalAnswers });
      setResult({ score: r.data.score, level: r.data.level });
      updateUser({ level: r.data.level });
      setPhase('result');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao submeter o quiz.');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'loading') {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.red} size="large" />
        <Text style={s.loadingTxt}>A carregar o quiz...</Text>
      </View>
    );
  }

  if (phase === 'cooldown') {
    return (
      <View style={s.center}>
        <Text style={s.cooldownIcon}>⏳</Text>
        <Text style={s.cooldownTitle}>Já fizeste o quiz hoje</Text>
        <Text style={s.cooldownSub}>
          O quiz só pode ser repetido após 24 horas.{'\n'}Volta amanhã para melhorar o teu nível.
        </Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backTxt}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'result' && result) {
    const color = LEVEL_COLOR[result.level] || Colors.red;
    return (
      <ScrollView contentContainerStyle={s.resultContainer}>
        <View style={[s.resultBadge, { backgroundColor: color + '15' }]}>
          <Text style={[s.resultScore, { color }]}>{result.score}/5</Text>
          <Text style={s.resultScoreLabel}>respostas correctas</Text>
        </View>
        <Text style={s.resultTitle}>Nível atribuído</Text>
        <View style={[s.levelBadge, { backgroundColor: color }]}>
          <Text style={s.levelBadgeTxt}>{LEVEL_LABEL[result.level]}</Text>
        </View>
        <Text style={s.resultDesc}>
          {result.level === 'iniciante' && 'Estás a começar a tua jornada. Continua a aprender!'}
          {result.level === 'junior'    && 'Bom trabalho! Tens bases sólidas e estás a crescer.'}
          {result.level === 'pleno'     && 'Muito bem! Tens experiência real e boas práticas.'}
          {result.level === 'senior'    && 'Excelente! Demonstras domínio técnico avançado.'}
        </Text>
        <TouchableOpacity
          style={s.doneBtn}
          onPress={() => router.replace('/tabs/feed')}
        >
          <Text style={s.doneBtnTxt}>Ir para o Feed</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Quiz activo
  const q = questions[current];
  const progress = (current + 1) / questions.length;

  return (
    <View style={s.container}>
      {/* Progresso */}
      <View style={s.progressWrap}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={s.progressTxt}>{current + 1} / {questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={s.quizContent}>
        <View style={s.categoryPill}>
          <Text style={s.categoryTxt}>{q.category}</Text>
        </View>

        <Text style={s.question}>{q.question}</Text>

        <View style={s.options}>
          {OPTION_KEYS.map(key => {
            const label = (q as any)[`option_${key}`] as string;
            const isSelected = selected === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.option, isSelected && s.optionSelected]}
                onPress={() => selectOption(key)}
              >
                <View style={[s.optionKey, isSelected && s.optionKeySelected]}>
                  <Text style={[s.optionKeyTxt, isSelected && s.optionKeyTxtSelected]}>
                    {key.toUpperCase()}
                  </Text>
                </View>
                <Text style={[s.optionTxt, isSelected && s.optionTxtSelected]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[s.nextBtn, !selected && s.nextBtnDisabled]}
          onPress={goNext}
          disabled={!selected || submitting}
        >
          {submitting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.nextBtnTxt}>
                {current < questions.length - 1 ? 'Próxima →' : 'Submeter'}
              </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.bg },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.bg },
  loadingTxt:        { marginTop: Spacing.md, color: Colors.ink400, fontSize: 14 },
  cooldownIcon:      { fontSize: 48, marginBottom: Spacing.lg },
  cooldownTitle:     { fontSize: 22, fontWeight: '800', color: Colors.ink900, marginBottom: Spacing.sm, textAlign: 'center' },
  cooldownSub:       { fontSize: 14, color: Colors.ink400, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  progressWrap:      { padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.ink100 },
  progressBar:       { height: 4, backgroundColor: Colors.ink100, borderRadius: 2, marginBottom: Spacing.xs },
  progressFill:      { height: 4, backgroundColor: Colors.red, borderRadius: 2 },
  progressTxt:       { fontSize: 12, color: Colors.ink400, textAlign: 'right' },
  quizContent:       { padding: Spacing.xl, paddingBottom: 60 },
  categoryPill:      { alignSelf: 'flex-start', backgroundColor: Colors.redSoft, paddingVertical: 4, paddingHorizontal: Spacing.md, borderRadius: Radius.full, marginBottom: Spacing.lg },
  categoryTxt:       { fontSize: 12, fontWeight: '700', color: Colors.red },
  question:          { fontSize: 18, fontWeight: '800', color: Colors.ink900, lineHeight: 26, marginBottom: Spacing.xl },
  options:           { gap: Spacing.sm, marginBottom: Spacing.xl },
  option:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 2, borderColor: Colors.ink100 },
  optionSelected:    { borderColor: Colors.red, backgroundColor: Colors.redSoft },
  optionKey:         { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ink100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionKeySelected: { backgroundColor: Colors.red },
  optionKeyTxt:      { fontSize: 13, fontWeight: '800', color: Colors.ink600 },
  optionKeyTxtSelected:{ color: Colors.white },
  optionTxt:         { flex: 1, fontSize: 14, color: Colors.ink900, lineHeight: 20 },
  optionTxtSelected: { color: Colors.red, fontWeight: '600' },
  nextBtn:           { backgroundColor: Colors.red, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center' },
  nextBtnDisabled:   { opacity: 0.4 },
  nextBtnTxt:        { color: Colors.white, fontSize: 16, fontWeight: '700' },
  // Resultado
  resultContainer:   { flexGrow: 1, backgroundColor: Colors.bg, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  resultBadge:       { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  resultScore:       { fontSize: 48, fontWeight: '900', lineHeight: 52 },
  resultScoreLabel:  { fontSize: 13, color: Colors.ink400 },
  resultTitle:       { fontSize: 16, color: Colors.ink400, marginBottom: Spacing.md },
  levelBadge:        { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xxl, borderRadius: Radius.full, marginBottom: Spacing.xl },
  levelBadgeTxt:     { color: Colors.white, fontSize: 18, fontWeight: '900' },
  resultDesc:        { fontSize: 15, color: Colors.ink600, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl, paddingHorizontal: Spacing.md },
  doneBtn:           { backgroundColor: Colors.red, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.sm },
  doneBtnTxt:        { color: Colors.white, fontSize: 16, fontWeight: '700' },
  backBtn:           { backgroundColor: Colors.red, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.sm },
  backTxt:           { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
