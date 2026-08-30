import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Avatar from './ui/Avatar';
import Badge  from './ui/Badge';
import Button from './ui/Button';
import { IconHeart, IconHeartFilled, IconComment, IconDownload, IconOpenSource } from './ui/Icons';

const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api','');

function timeAgo(d, lang) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (lang === 'en') {
    if (m < 1) return 'now'; if (m < 60) return `${m}m`;
    const h = Math.floor(m/60); if (h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  }
  if (m < 1) return 'agora'; if (m < 60) return `${m}min`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h`;
  return `${Math.floor(h/24)}d`;
}

export default function PostCard({ post }) {
  const { isLoggedIn } = useAuth();
  const { t, lang }    = useLang();
  const [liked,    setLiked]    = useState(false);
  const [likes,    setLikes]    = useState(Number(post.likes_count) || 0);
  const [open,     setOpen]     = useState(false);
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);

  async function handleLike() {
    if (!isLoggedIn) return;
    try {
      const r = await api.post(`/posts/${post.id}/like`);
      setLiked(r.data.liked);
      setLikes(c => r.data.liked ? c+1 : c-1);
    } catch {}
  }

  async function toggleComments() {
    if (!open && !comments.length) {
      try { const r = await api.get(`/posts/${post.id}`); setComments(r.data.comments||[]); } catch {}
    }
    setOpen(v => !v);
  }

  async function submit(e) {
    e.preventDefault(); if (!text.trim()) return;
    setSending(true);
    try { const r = await api.post(`/posts/${post.id}/comment`, { content: text }); setComments(r.data.comments||[]); setText(''); }
    catch {} finally { setSending(false); }
  }

  const imgSrc = post.image_url ? (post.image_url.startsWith('http') ? post.image_url : `${API}${post.image_url}`) : null;

  return (
    <article className="post-card card">
      <div className="post-card__head">
        <div className="post-card__author">
          <Avatar name={post.author_name} src={post.author_avatar} size="md" />
          <div>
            <div className="post-card__author-name">
              {post.author_name}
              {post.author_badge && (
                <span className={`seal seal--${post.author_badge}`} style={{ marginLeft: 6 }}>
                  {post.author_badge_label}
                </span>
              )}
            </div>
            <div className="post-card__meta">
              <Badge level={post.author_level} lang={lang} />
              <span className="post-card__time">{timeAgo(post.created_at, lang)}</span>
              {post.is_open_source && (
                <span className="post-open-source">
                  <IconOpenSource className="icon icon--sm" /> Open Source
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <Link to={`/posts/${post.id}`} className="post-card__body">
        <h3 className="post-card__title">{post.title}</h3>
        <p className="post-card__excerpt">{post.content}</p>
      </Link>
      {imgSrc && <img src={imgSrc} alt="" className="post-card__img" />}
      <div className="post-card__foot">
        <button className={`action-btn${liked?' action-btn--on':''}`} onClick={handleLike}>
          {liked ? <IconHeartFilled className="icon icon--sm" style={{color:'var(--red)'}} />
                 : <IconHeart       className="icon icon--sm" />}
          {likes} {t.likes}
        </button>
        <button className="action-btn" onClick={toggleComments}>
          <IconComment className="icon icon--sm" /> {post.comments_count} {t.comments}
        </button>
        {post.file_url && (
          <a href={`${API}${post.file_url}`} download={post.file_name||'file'} className="action-btn">
            <IconDownload className="icon icon--sm" /> {t.download}
          </a>
        )}
      </div>
      {open && (
        <div className="post-card__comments">
          {comments.length === 0 && <p className="cmt-empty">{t.noComments}</p>}
          {comments.map(c => (
            <div key={c.id} className="cmt-item">
              <Avatar name={c.author_name} src={c.author_avatar} size="xs" />
              <div className="cmt-body">
                <div className="cmt-author">
                  <span className="cmt-name">{c.author_name}</span>
                  <Badge level={c.author_level} lang={lang} />
                </div>
                <p className="cmt-text">{c.content}</p>
              </div>
            </div>
          ))}
          {isLoggedIn && (
            <form onSubmit={submit} className="cmt-form">
              <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder={t.writeComment} />
              <Button size="sm" loading={sending} type="submit">{t.send}</Button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
