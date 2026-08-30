import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';
import type { Job } from '../../types';

const TYPE_LABELS: Record<string,string> = {
  'full-time':'Permanente', 'part-time':'Part-time',
  'freelance':'Freelance', 'remoto':'Remoto',
};
const FILTERS = ['Todos','full-time','part-time','freelance','remoto'];

export default function JobsScreen() {
  const [jobs,      setJobs]      = useState<Job[]>([]);
  const [filter,    setFilter]    = useState('Todos');
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [applying,  setApplying]  = useState<number|null>(null);

  const load = useCallback(async (type?: string, refresh = false) => {
    try {
      const params: Record<string,string> = { limit:'20' };
      if (type && type !== 'Todos') params.type = type;
      const r = await api.get('/jobs', { params });
      setJobs(r.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as vagas.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function handleApply(job: Job) {
    if (job.applied) return;
    Alert.alert('Candidatar-se', `Confirmas a candidatura a "${job.title}"?`, [
      { text:'Cancelar', style:'cancel' },
      { text:'Confirmar', onPress: async () => {
        setApplying(job.id);
        try {
          await api.post(`/jobs/${job.id}/apply`);
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applied: true } : j));
          Alert.alert('Enviado!', 'A tua candidatura foi registada com sucesso.');
        } catch (err: any) {
          Alert.alert('Erro', err.response?.data?.error || 'Erro ao candidatar.');
        } finally {
          setApplying(null);
        }
      }},
    ]);
  }

  function renderJob({ item: job }: { item: Job }) {
    return (
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.companyIcon}>
            <Text style={s.companyInitial}>{job.company_name.charAt(0)}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.jobTitle} numberOfLines={2}>{job.title}</Text>
            <Text style={s.company}>{job.company_name}</Text>
          </View>
        </View>

        <Text style={s.desc} numberOfLines={3}>{job.description}</Text>

        <View style={s.tags}>
          <View style={s.tag}><Text style={s.tagTxt}>{job.level_required}</Text></View>
          <View style={s.tag}><Text style={s.tagTxt}>{TYPE_LABELS[job.type] || job.type}</Text></View>
          <View style={s.tag}><Text style={s.tagTxt}>📍 {job.location}</Text></View>
        </View>

        {job.skills && job.skills.length > 0 && (
          <View style={s.skills}>
            {job.skills.slice(0,5).map(sk => (
              <View key={sk} style={s.skill}>
                <Text style={s.skillTxt}>{sk}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.cardFoot}>
          <Text style={s.candidates}>{job.application_count} candidatos</Text>
          <TouchableOpacity
            style={[s.applyBtn, job.applied && s.applyBtnDone]}
            onPress={() => handleApply(job)}
            disabled={!!job.applied || applying === job.id}
          >
            {applying === job.id
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={s.applyTxt}>{job.applied ? 'Candidatado ✓' : 'Candidatar'}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Vagas</Text>
        <Text style={s.headerSub}>Oportunidades em Angola</Text>
      </View>

      <FlatList
        data={FILTERS}
        horizontal
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[s.filterBtn, filter === f && s.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>
              {f === 'Todos' ? 'Todos' : TYPE_LABELS[f]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading
        ? <ActivityIndicator color={Colors.red} style={{ marginTop: 40 }} />
        : <FlatList
            data={jobs}
            keyExtractor={j => String(j.id)}
            renderItem={renderJob}
            contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(filter, true); }}
                tintColor={Colors.red} />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Nenhuma vaga encontrada.</Text>
              </View>
            }
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:Colors.bg },
  header:         { backgroundColor:Colors.surface, padding:Spacing.xl, paddingTop:Spacing.xxl, borderBottomWidth:1, borderBottomColor:Colors.ink100 },
  headerTitle:    { fontSize:24, fontWeight:'900', color:Colors.ink900 },
  headerSub:      { fontSize:13, color:Colors.ink400, marginTop:2 },
  filterList:     { padding:Spacing.md, gap:Spacing.sm },
  filterBtn:      { paddingVertical:Spacing.xs, paddingHorizontal:Spacing.md, borderRadius:Radius.full, borderWidth:1.5, borderColor:Colors.ink200 },
  filterBtnActive:{ backgroundColor:Colors.red, borderColor:Colors.red },
  filterTxt:      { fontSize:13, fontWeight:'600', color:Colors.ink600 },
  filterTxtActive:{ color:Colors.white },
  card:           { backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.lg, marginBottom:Spacing.sm, borderWidth:1, borderColor:Colors.ink100, elevation:1 },
  cardHead:       { flexDirection:'row', gap:Spacing.sm, marginBottom:Spacing.sm },
  companyIcon:    { width:44, height:44, borderRadius:Radius.sm, backgroundColor:Colors.redSoft, alignItems:'center', justifyContent:'center' },
  companyInitial: { fontSize:20, fontWeight:'900', color:Colors.red },
  jobTitle:       { fontSize:15, fontWeight:'800', color:Colors.ink900 },
  company:        { fontSize:13, color:Colors.ink400, marginTop:2 },
  desc:           { fontSize:13, color:Colors.ink600, lineHeight:19, marginBottom:Spacing.sm },
  tags:           { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs, marginBottom:Spacing.sm },
  tag:            { backgroundColor:Colors.ink100, paddingVertical:2, paddingHorizontal:8, borderRadius:Radius.full },
  tagTxt:         { fontSize:11, color:Colors.ink600, fontWeight:'600' },
  skills:         { flexDirection:'row', flexWrap:'wrap', gap:Spacing.xs, marginBottom:Spacing.sm },
  skill:          { backgroundColor:Colors.redSoft, paddingVertical:2, paddingHorizontal:8, borderRadius:Radius.full },
  skillTxt:       { fontSize:11, color:Colors.red, fontWeight:'700' },
  cardFoot:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderTopWidth:1, borderTopColor:Colors.ink100, paddingTop:Spacing.sm },
  candidates:     { fontSize:12, color:Colors.ink400 },
  applyBtn:       { backgroundColor:Colors.red, paddingVertical:Spacing.xs, paddingHorizontal:Spacing.lg, borderRadius:Radius.sm },
  applyBtnDone:   { backgroundColor:'#1E5631' },
  applyTxt:       { color:Colors.white, fontSize:13, fontWeight:'700' },
  empty:          { alignItems:'center', paddingTop:60 },
  emptyTxt:       { color:Colors.ink400, fontSize:14 },
});
