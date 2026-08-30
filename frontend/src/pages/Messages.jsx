import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import { IconSend, IconSearch, IconArrowLeft } from '../components/ui/Icons';

function timeLabel(d, lang) {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (lang==='en') {
    if (diff < 1) return 'now'; if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff/60)}h`;
    return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit' });
  }
  if (diff < 1) return 'agora'; if (diff < 60) return `${diff}min`;
  if (diff < 1440) return `${Math.floor(diff/60)}h`;
  return new Date(d).toLocaleDateString('pt-AO', { day:'2-digit', month:'2-digit' });
}

export default function Messages() {
  const { conversationId: paramId } = useParams();
  const { user }    = useAuth();
  const { t, lang } = useLang();
  const navigate    = useNavigate();
  const bottomRef   = useRef(null);
  const pollRef     = useRef(null);

  const [conversations, setConvs]    = useState([]);
  const [activeId,      setActiveId] = useState(paramId ? Number(paramId) : null);
  const [messages,      setMsgs]     = useState([]);
  const [text,          setText]     = useState('');
  const [search,        setSearch]   = useState('');
  const [sending,       setSending]  = useState(false);
  const [loadingMsgs,   setLMsgs]    = useState(false);
  const [mobileView,    setMobile]   = useState('list');

  const loadConvs = useCallback(async () => {
    try { const r = await api.get('/messages'); setConvs(r.data); } catch {}
  }, []);

  const loadMsgs = useCallback(async (id) => {
    if (!id) return;
    setLMsgs(true);
    try { const r = await api.get(`/messages/${id}`); setMsgs(r.data); }
    catch {} finally { setLMsgs(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!activeId) return;
    loadMsgs(activeId);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMsgs(activeId), 4000);
    return () => clearInterval(pollRef.current);
  }, [activeId, loadMsgs]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  useEffect(() => { if (activeId) navigate(`/mensagens/${activeId}`, { replace:true }); }, [activeId, navigate]);

  function selectConv(id) { setActiveId(id); setMobile('chat'); }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    setSending(true);
    try {
      const r = await api.post(`/messages/${activeId}`, { content: text.trim() });
      setMsgs(m => [...m, r.data]); setText(''); loadConvs();
    } catch {} finally { setSending(false); }
  }

  const filtered   = conversations.filter(c => c.other_name?.toLowerCase().includes(search.toLowerCase()));
  const activeConv = conversations.find(c => c.conversation_id === activeId);

  function groupMessages(msgs) {
    const groups = []; let lastDate = '';
    msgs.forEach(m => {
      const d = new Date(m.created_at).toLocaleDateString(lang==='en'?'en-GB':'pt-AO');
      if (d !== lastDate) { groups.push({ type:'date', label:d }); lastDate=d; }
      groups.push({ type:'msg', ...m });
    });
    return groups;
  }

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div style={{ paddingTop:'var(--nav-h)', flex:1, overflow:'hidden' }}>
        <div className="messages-layout">

          {/* Sidebar */}
          <div className={`messages-sidebar${mobileView==='chat' ? ' messages-sidebar--hidden' : ''}`}>
            <div className="messages-sidebar__head">
              <span className="messages-sidebar__title">{t.messagesTitle}</span>
            </div>
            <div className="messages-sidebar__search">
              <div style={{ position:'relative' }}>
                <IconSearch className="icon icon--sm" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--ink-400)', pointerEvents:'none' }} />
                <input className="input" style={{ paddingLeft:32, height:36, background:'var(--ink-50)' }}
                  placeholder={t.searchConv} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="conversations">
              {filtered.length === 0 && (
                <div style={{ padding:'var(--s8) var(--s4)', textAlign:'center' }}>
                  <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)' }}>
                    {search ? (lang==='en'?'No conversations found.':'Nenhuma conversa encontrada.') : t.noConversations}
                  </p>
                  {!search && <p style={{ fontSize:'var(--t-xs)', color:'var(--ink-300)', marginTop:8 }}>{t.noConvHint}</p>}
                  {!search && <Link to="/usuarios" style={{ display:'inline-block', marginTop:12, fontSize:'var(--t-sm)', color:'var(--red)', fontWeight:'var(--w-bold)' }}>{t.viewUsers}</Link>}
                </div>
              )}
              {filtered.map(c => (
                <div key={c.conversation_id}
                  className={`conv-item${activeId===c.conversation_id ? ' conv-item--active' : ''}`}
                  onClick={() => selectConv(c.conversation_id)}>
                  <Avatar name={c.other_name} src={c.other_avatar} size="md" />
                  <div className="conv-item__info">
                    <div className="conv-item__top">
                      <span className="conv-item__name">{c.other_name}</span>
                      <span className="conv-item__time">{timeLabel(c.last_at, lang)}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span className="conv-item__preview">{c.last_message || t.noMessages}</span>
                      {Number(c.unread) > 0 && <span className="conv-item__unread">{c.unread > 9 ? '9+' : c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={`messages-main${mobileView==='chat' ? ' messages-main--active' : ''}`}>
            {!activeId ? (
              <div className="messages-empty">
                <IconSearch className="messages-empty__icon icon icon--xl" />
                <p className="messages-empty__title">{t.selectConv}</p>
                <p className="messages-empty__sub">{t.selectConvHint}</p>
              </div>
            ) : (
              <>
                <div className="messages-header">
                  <button className="btn btn--ghost btn--sm" onClick={() => setMobile('list')}>
                    <IconArrowLeft className="icon icon--sm" />
                  </button>
                  {activeConv && (
                    <>
                      <Avatar name={activeConv.other_name} src={activeConv.other_avatar} size="sm" />
                      <div>
                        <div className="messages-header__name">{activeConv.other_name}</div>
                        <div className="messages-header__sub"><Badge level={activeConv.other_level} lang={lang} /></div>
                      </div>
                    </>
                  )}
                </div>
                <div className="messages-body">
                  {loadingMsgs && messages.length===0 && <div className="spinner" />}
                  {groupMessages(messages).map((item, i) => {
                    if (item.type==='date') return (
                      <div key={`d-${i}`} style={{ textAlign:'center', margin:'var(--s2) 0' }}>
                        <span style={{ fontSize:'var(--t-xs)', color:'var(--ink-300)', background:'var(--bg)', padding:'2px 10px', borderRadius:'var(--r-full)' }}>{item.label}</span>
                      </div>
                    );
                    const mine = item.sender_id === user?.id;
                    return (
                      <div key={item.id} className={`msg-bubble${mine ? ' msg-bubble--mine' : ''}`}>
                        {!mine && <Avatar name={item.sender_name} src={item.sender_avatar} size="xs" />}
                        <div className="msg-bubble__body">
                          <div className="msg-bubble__text">{item.content}</div>
                          <div className="msg-bubble__time">{timeLabel(item.created_at, lang)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <form className="messages-composer" onSubmit={sendMessage}>
                  <textarea className="textarea" placeholder={t.writeMessage} value={text}
                    onChange={e => setText(e.target.value)} rows={1}
                    onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} />
                  <button className={`btn btn--primary btn--md${sending ? ' btn--loading' : ''}`}
                    type="submit" disabled={!text.trim() || sending}>
                    <IconSend className="icon icon--sm" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
