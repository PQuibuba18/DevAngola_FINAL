import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { IconPlus } from "../components/ui/Icons";

export default function Feed() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [tab, setTab] = useState("all");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ROOMS = [
    { level: "iniciante", label: t.iniciante },
    { level: "junior", label: t.junior },
    { level: "pleno", label: t.pleno },
    { level: "senior", label: t.senior },
  ];

  const loadPosts = useCallback(
    (activeTab) => {
      setLoading(true);
      setError("");
      const url =
        activeTab === "following" ? "/posts?feed=following" : "/posts";
      api
        .get(url)
        .then((r) => setPosts(Array.isArray(r.data) ? r.data : (r.data.posts ?? [])))
        .catch(() => setError(t.genericError || "Erro ao carregar posts."))
        .finally(() => setLoading(false));
    },
    [t.genericError],
  );

  useEffect(() => {
    loadPosts(tab);
  }, [tab, loadPosts]);

  return (
    <div className="page">
      <Navbar />
      <div className="page-body">
        <div className="page-inner">
          <div className="feed-grid container">
            <div className="feed-col">
              <div className="composer card">
                <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
                <Link to="/novo-post" className="composer__fake">
                  {t.shareIdea}
                </Link>
                <Button as={Link} to="/novo-post" size="sm">
                  <IconPlus className="icon icon--sm" /> {t.publish}
                </Button>
              </div>

              {/* Tabs */}
              <div className="feed-tabs">
                <button
                  className={`feed-tab${tab === "all" ? " feed-tab--active" : ""}`}
                  onClick={() => setTab("all")}
                >
                  {lang === "en" ? "All posts" : "Todos os posts"}
                </button>
                <button
                  className={`feed-tab${tab === "following" ? " feed-tab--active" : ""}`}
                  onClick={() => setTab("following")}
                >
                  {lang === "en" ? "Following" : "A seguir"}
                </button>
              </div>

              {loading && <div className="spinner" />}
              {error && <div className="error-banner">{error}</div>}

              {!loading && posts.length === 0 && tab === "all" && (
                <div className="empty card card--padded">
                  <p className="empty__title">{t.noPostsYet}</p>
                  <p className="empty__sub">{t.noPostsDesc}</p>
                  <Button
                    as={Link}
                    to="/novo-post"
                    style={{ marginTop: 16, width: "auto" }}
                  >
                    {t.publishNow}
                  </Button>
                </div>
              )}

              {!loading && posts.length === 0 && tab === "following" && (
                <div className="empty card card--padded">
                  <p className="empty__title">
                    {lang === "en"
                      ? "No posts from people you follow."
                      : "Nenhum post de quem segues."}
                  </p>
                  <p className="empty__sub">
                    {lang === "en"
                      ? "Find developers and follow them to see their posts here."
                      : "Encontra programadores e segue-os para ver as publicacoes deles aqui."}
                  </p>
                  <Button
                    as={Link}
                    to="/usuarios"
                    variant="secondary"
                    style={{ marginTop: 16, width: "auto" }}
                  >
                    {lang === "en"
                      ? "Find developers"
                      : "Encontrar programadores"}
                  </Button>
                </div>
              )}

              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>

            <aside className="sidebar">
              <div className="sidebar-me card">
                <Avatar name={user?.name} src={user?.avatar_url} size="lg" />
                <div className="sidebar-me__name">{user?.name}</div>
                <Badge level={user?.level} lang={lang} />
                {user?.badge && (
                  <span className={`seal seal--${user.badge}`}>
                    {user.badge_label}
                  </span>
                )}
              </div>
              <div className="sidebar-rooms card">
                <div className="sidebar-rooms__label">{t.roomsByLevel}</div>
                {ROOMS.map((r) => (
                  <Link
                    key={r.level}
                    to={`/salas?level=${r.level}`}
                    className={`room-link room-link--${r.level}`}
                  >
                    <span className="room-link__dot" /> {r.label}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}