import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Avatar from '../components/ui/Avatar';
import Badge  from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { IconArrowLeft, IconHeart, IconHeartFilled, IconComment, IconDownload, IconOpenSource } from '../components/ui/Icons';

const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api','');

export default function PostDetail() {
  const { id }              = useParams();
  const { isLoggedIn }      = useAuth();
  const { t, lang }         = useLang();
  const [post,    setPost]   = useState(null);
  const [liked,   setLiked]  = useState(false);
  const [likes,   setLikes]  = useState(0);
  const [comment, setComment]= useState('');
  const [loading, setLoading]= useState(true);
  const [sending, setSending]= useState(false);

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(r => { setPost(r.data); setLikes(Number(r.data.likes_count)||0); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLike() {
    if (!isLoggedIn) return;
    const r = await api.post(`/posts/${id}/like`);
    setLiked(r.data.liked); setLikes(c => r.data.liked ? c+1 : c-1);
  }

  async function submitComment(e) {
    e.preventDefault(); if (!comment.trim()) return;
    setSending(true);
    try {
      const r = await api.post(`/posts/${id}/comment`, { content: comment });
      setPost(p => ({ ...p, comments: r.data.comments })); setComment('');
    } catch {} finally { setSending(false); }
  }

  function fmt(d) {
    return new Date(d).toLocaleDateString(lang==='en'?'en-GB':'pt-AO', { day:'2-digit', month:'long', year:'numeric' });
  }

  if (loading) return <div className="page"><Navbar /><div className="spinner" /></div>;
  if (!post) return (
    <div className="page"><Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="empty card card--padded">
          <p className="empty__title">{lang==='en'?'Post not found':'Post não encontrado'}</p>
          <Link to="/feed"><Button variant="secondary" style={{ marginTop:12, width:'auto' }}>{t.backToFeed}</Button></Link>
        </div>
      </div></div>
    </div>
  );

  const imgSrc = post.image_url ? (post.image_url.startsWith('http') ? post.image_url : `${API}${post.image_url}`) : null;

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="detail-wrap">
        <Link to="/feed" className="detail-back"><IconArrowLeft className="icon icon--sm" /> {t.backToFeed?.replace('←','').trim() || 'Feed'}</Link>

        <article className="detail-post card">
          <div className="detail-author">
            <Avatar name={post.author_name} src={post.author_avatar} size="md" />
            <div>
              <div className="detail-author-name">
                {post.author_name}
                {post.author_badge && <span className={`seal seal--${post.author_badge}`} style={{ marginLeft:6 }}>{post.author_badge_label}</span>}
              </div>
              <div className="detail-author-meta">
                <Badge level={post.author_level} lang={lang} />
                <span className="detail-date">{fmt(post.created_at)}</span>
                {post.is_open_source && (
                  <span className="post-open-source">
                    <IconOpenSource className="icon icon--sm" /> Open Source
                  </span>
                )}
              </div>
            </div>
          </div>
          <h1 className="detail-title">{post.title}</h1>
          <p className="detail-content">{post.content}</p>
          {imgSrc && <img src={imgSrc} alt="" className="detail-img" />}
          <div className="detail-actions">
            <button className={`action-btn${liked?' action-btn--on':''}`} onClick={handleLike}>
              {liked ? <IconHeartFilled className="icon icon--sm" style={{color:'var(--red)'}} />
                     : <IconHeart       className="icon icon--sm" />}
              {likes} {t.likes}
            </button>
            <span className="action-btn" style={{ cursor:'default' }}>
              <IconComment className="icon icon--sm" /> {(post.comments||[]).length} {t.comments}
            </span>
            {post.file_url && (
              <a href={`${API}${post.file_url}`} download={post.file_name||'file'} className="action-btn">
                <IconDownload className="icon icon--sm" /> {t.download}
              </a>
            )}
          </div>
        </article>

        <section className="detail-comments card">
          <div className="detail-comments__head">
            {t.comments}
            <span className="detail-comments__count">{(post.comments||[]).length}</span>
          </div>
          {(post.comments||[]).length===0 && (
            <p style={{ fontSize:'var(--t-sm)', color:'var(--ink-400)', fontStyle:'italic', padding:'8px 0 16px' }}>{t.noComments}</p>
          )}
          {(post.comments||[]).map(c => (
            <div key={c.id} className="detail-cmt">
              <Avatar name={c.author_name} src={c.author_avatar} size="sm" />
              <div className="detail-cmt-body">
                <div className="detail-cmt-head">
                  <span className="detail-cmt-name">{c.author_name}</span>
                  <Badge level={c.author_level} lang={lang} />
                </div>
                <p className="detail-cmt-text">{c.content}</p>
              </div>
            </div>
          ))}
          {isLoggedIn ? (
            <form className="detail-cmt-form" onSubmit={submitComment}>
              <div className="field">
                <label className="field__label">{t.writeComment?.replace('...','')}</label>
                <textarea className="textarea" value={comment}
                  onChange={e => setComment(e.target.value)} rows={3} placeholder={t.writeComment} />
              </div>
              <div className="detail-cmt-foot">
                <Button type="submit" loading={sending}>{lang==='en'?'Post comment':'Publicar comentário'}</Button>
              </div>
            </form>
          ) : (
            <div className="detail-login">
              <Link to="/login">{lang==='en'?'Sign in':'Entra'}</Link> {lang==='en'?'to comment.':'para comentar.'}
            </div>
          )}
        </section>
      </div></div></div>
    </div>
  );
}
