import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import { IconSearch, IconPlus } from "../components/ui/Icons";

// ── Constantes ──────────────────────────────────────────────
const AREAS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Mobile",
  "DevOps",
  "Data",
  "UI/UX",
  "Segurança",
  "IA / ML",
  "Outro",
];
const TYPES = [
  { value: "full-time", label: "Tempo Inteiro" },
  { value: "part-time", label: "Meio Tempo" },
  { value: "freelance", label: "Freelance" },
  { value: "remoto", label: "Remoto" },
];
const LEVELS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sénior" },
  { value: "qualquer", label: "Qualquer" },
];
const LOCATIONS = [
  "Luanda",
  "Benguela",
  "Huambo",
  "Namibe",
  "Cabinda",
  "Malanje",
  "Huíla",
  "Bié",
  "Remoto",
  "Internacional",
];
const RECENCY = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "", label: "Todos" },
];
const LEVEL_COLOR = {
  iniciante: "#1E5631",
  junior: "#1A3A8A",
  pleno: "#7B4F00",
  senior: "#4A1580",
  qualquer: "#444",
};
const TYPE_ICON = {
  "full-time": "🏢",
  "part-time": "⏰",
  freelance: "💻",
  remoto: "🌍",
};

// ── Componente principal ─────────────────────────────────────
export default function Vagas() {
  const { user } = useAuth();
  const { lang } = useLang();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    level: "",
    type: "",
    location: "",
    area: "",
    days: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filters.level) params.level = filters.level;
      if (filters.type) params.type = filters.type;
      if (filters.location) params.location = filters.location;
      const r = await api.get("/jobs", { params });
      let list = Array.isArray(r.data) ? r.data : (r.data.jobs ?? []);
      // Filtro de dias (lado cliente)
      if (filters.days) {
        const cutoff = new Date(Date.now() - Number(filters.days) * 864e5);
        list = list.filter((j) => new Date(j.created_at) >= cutoff);
      }
      // Filtro de área (lado cliente, campo ainda não no backend)
      if (filters.area) {
        const a = filters.area.toLowerCase();
        list = list.filter(
          (j) =>
            j.title.toLowerCase().includes(a) ||
            j.description.toLowerCase().includes(a) ||
            (j.skills || []).some((s) => s.toLowerCase().includes(a)),
        );
      }
      setJobs(list);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtro de pesquisa local
  const visible = jobs.filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.company_name.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      (j.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  async function handleApply(job) {
    if (job.applied) return;
    if (
      !window.confirm(
        `Confirmas a candidatura a "${job.title}" na ${job.company_name}?`,
      )
    )
      return;
    setApplying(job.id);
    try {
      await api.post(`/jobs/${job.id}/apply`);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                applied: true,
                application_count: (j.application_count || 0) + 1,
              }
            : j,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao candidatar.");
    } finally {
      setApplying(null);
    }
  }

  function setFilter(k, v) {
    setFilters((f) => ({ ...f, [k]: f[k] === v ? "" : v }));
  }

  function resetFilters() {
    setFilters({ level: "", type: "", location: "", area: "", days: "" });
    setSearch("");
  }

  const hasFilters = Object.values(filters).some(Boolean) || search;

  return (
    <div className="page">
      <Navbar />
      <div className="page-body">
        <div className="page-inner">
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {/* Cabeçalho */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "var(--s6)",
                flexWrap: "wrap",
                gap: "var(--s3)",
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "var(--t-2xl)",
                    fontWeight: "var(--w-black)",
                    letterSpacing: "-.03em",
                    color: "var(--ink-900)",
                    marginBottom: 4,
                  }}
                >
                  {lang === "en"
                    ? "Tech Jobs in Angola"
                    : "Vagas de Tecnologia em Angola"}
                </h1>
                <p style={{ fontSize: "var(--t-sm)", color: "var(--ink-400)" }}>
                  {visible.length}{" "}
                  {lang === "en" ? "opportunities" : "oportunidades"}
                  {hasFilters ? " (filtradas)" : ""}
                </p>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                style={{ width: "auto" }}
              >
                <IconPlus className="icon icon--sm" />
                {lang === "en" ? "Post job" : "Publicar vaga"}
              </Button>
            </div>

            {/* Barra de pesquisa */}
            <div
              className="card"
              style={{
                padding: "var(--s3) var(--s4)",
                marginBottom: "var(--s3)",
                display: "flex",
                gap: "var(--s3)",
                alignItems: "center",
              }}
            >
              <IconSearch
                className="icon icon--sm"
                style={{ color: "var(--ink-400)", flexShrink: 0 }}
              />
              <input
                className="input"
                style={{
                  border: "none",
                  padding: 0,
                  height: "auto",
                  flex: 1,
                  fontSize: "var(--t-base)",
                }}
                placeholder={
                  lang === "en"
                    ? "Search: title, company, skill..."
                    : "Pesquisar: título, empresa, skill..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  style={{
                    fontSize: 12,
                    color: "var(--red)",
                    fontWeight: 700,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  × {lang === "en" ? "Clear filters" : "Limpar filtros"}
                </button>
              )}
            </div>

            {/* Filtros */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s2)",
                marginBottom: "var(--s5)",
              }}
            >
              {/* Nível */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--s2)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-400)",
                    minWidth: 70,
                  }}
                >
                  NÍVEL
                </span>
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setFilter("level", l.value)}
                    style={{
                      padding: "3px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        filters.level === l.value
                          ? LEVEL_COLOR[l.value]
                          : "var(--ink-100)",
                      color:
                        filters.level === l.value ? "#fff" : "var(--ink-600)",
                      border: "none",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Tipo */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--s2)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-400)",
                    minWidth: 70,
                  }}
                >
                  TIPO
                </span>
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setFilter("type", t.value)}
                    style={{
                      padding: "3px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        filters.type === t.value
                          ? "var(--red)"
                          : "var(--ink-100)",
                      color:
                        filters.type === t.value ? "#fff" : "var(--ink-600)",
                      border: "none",
                    }}
                  >
                    {TYPE_ICON[t.value]} {t.label}
                  </button>
                ))}
              </div>

              {/* Área técnica */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--s2)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-400)",
                    minWidth: 70,
                  }}
                >
                  ÁREA
                </span>
                {AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setFilter("area", a)}
                    style={{
                      padding: "3px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        filters.area === a
                          ? "var(--ink-900)"
                          : "var(--ink-100)",
                      color: filters.area === a ? "#fff" : "var(--ink-600)",
                      border: "none",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Localização */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--s2)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-400)",
                    minWidth: 70,
                  }}
                >
                  LOCAL
                </span>
                {LOCATIONS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setFilter("location", l)}
                    style={{
                      padding: "3px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        filters.location === l ? "#1A3A8A" : "var(--ink-100)",
                      color: filters.location === l ? "#fff" : "var(--ink-600)",
                      border: "none",
                    }}
                  >
                    📍 {l}
                  </button>
                ))}
              </div>

              {/* Recência */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--s2)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-400)",
                    minWidth: 70,
                  }}
                >
                  DATA
                </span>
                {RECENCY.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setFilter("days", r.value)}
                    style={{
                      padding: "3px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        filters.days === r.value ? "#7B4F00" : "var(--ink-100)",
                      color:
                        filters.days === r.value ? "#fff" : "var(--ink-600)",
                      border: "none",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário de publicar vaga */}
            {showForm && (
              <JobForm
                onClose={() => setShowForm(false)}
                onSaved={(j) => {
                  setJobs((p) => [j, ...p]);
                  setShowForm(false);
                }}
                lang={lang}
              />
            )}

            {/* Lista de vagas */}
            {loading && <div className="spinner" />}
            {!loading && visible.length === 0 && (
              <div
                className="card card--padded"
                style={{ textAlign: "center", color: "var(--ink-400)" }}
              >
                <p
                  style={{
                    fontSize: "var(--t-md)",
                    fontWeight: "var(--w-bold)",
                    marginBottom: 8,
                  }}
                >
                  {lang === "en" ? "No jobs found" : "Nenhuma vaga encontrada"}
                </p>
                <p style={{ fontSize: "var(--t-sm)" }}>
                  {hasFilters
                    ? lang === "en"
                      ? "Try different filters."
                      : "Experimenta outros filtros."
                    : lang === "en"
                      ? "Be the first to post a job!"
                      : "Sê o primeiro a publicar uma vaga!"}
                </p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s3)",
              }}
            >
              {visible.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleApply}
                  applying={applying}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card de vaga ─────────────────────────────────────────────
function JobCard({ job, onApply, applying, lang }) {
  const [expanded, setExpanded] = useState(false);
  const lc = LEVEL_COLOR[job.level_required] || "#444";

  function timeAgo(d) {
    const h = Math.floor((Date.now() - new Date(d)) / 36e5);
    if (h < 1) return lang === "en" ? "Just now" : "Agora mesmo";
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    return lang === "en" ? `${days}d ago` : `há ${days}d`;
  }

  return (
    <div
      className="card"
      style={{ padding: "var(--s5)", borderLeft: `4px solid ${lc}` }}
    >
      <div
        style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-start" }}
      >
        {/* Ícone empresa */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--r-sm)",
            background: lc + "15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--display)",
              fontWeight: 900,
              fontSize: 22,
              color: lc,
            }}
          >
            {job.company_name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Título e empresa */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <h3
                style={{
                  fontWeight: "var(--w-black)",
                  fontSize: "var(--t-base)",
                  color: "var(--ink-900)",
                  marginBottom: 2,
                }}
              >
                {job.title}
              </h3>
              <p
                style={{
                  fontSize: "var(--t-sm)",
                  color: "var(--ink-600)",
                  fontWeight: "var(--w-medium)",
                }}
              >
                {job.company_name}
              </p>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-400)",
                whiteSpace: "nowrap",
              }}
            >
              {timeAgo(job.created_at)}
            </div>
          </div>

          {/* Tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--s1)",
              marginTop: "var(--s2)",
            }}
          >
            <span
              style={{
                background: lc + "15",
                color: lc,
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {job.level_required}
            </span>
            <span
              style={{
                background: "var(--ink-100)",
                color: "var(--ink-600)",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {TYPE_ICON[job.type]}{" "}
              {TYPES.find((t) => t.value === job.type)?.label || job.type}
            </span>
            <span
              style={{
                background: "var(--ink-100)",
                color: "var(--ink-600)",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              📍 {job.location}
            </span>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--s1)",
                marginTop: "var(--s2)",
              }}
            >
              {job.skills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  style={{
                    background: "var(--red-soft)",
                    color: "var(--red)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 999,
                  }}
                >
                  {s}
                </span>
              ))}
              {job.skills.length > 6 && (
                <span style={{ fontSize: 11, color: "var(--ink-400)" }}>
                  +{job.skills.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Descrição expandível */}
          {expanded && (
            <p
              style={{
                fontSize: "var(--t-sm)",
                color: "var(--ink-600)",
                lineHeight: 1.7,
                marginTop: "var(--s3)",
                whiteSpace: "pre-wrap",
              }}
            >
              {job.description}
            </p>
          )}

          {/* Rodapé */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "var(--s3)",
              flexWrap: "wrap",
              gap: "var(--s2)",
            }}
          >
            <div style={{ display: "flex", gap: "var(--s4)" }}>
              <button
                onClick={() => setExpanded((e) => !e)}
                style={{
                  fontSize: 12,
                  color: "var(--ink-400)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {expanded
                  ? lang === "en"
                    ? "Show less ▲"
                    : "Ver menos ▲"
                  : lang === "en"
                    ? "Read more ▼"
                    : "Ler mais ▼"}
              </button>
              <span style={{ fontSize: 12, color: "var(--ink-400)" }}>
                {job.application_count || 0}{" "}
                {lang === "en" ? "candidates" : "candidatos"}
              </span>
            </div>
            <button
              onClick={() => onApply(job)}
              disabled={!!job.applied || applying === job.id}
              style={{
                padding: "6px 20px",
                borderRadius: "var(--r-sm)",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: job.applied ? "default" : "pointer",
                background: job.applied ? "#1E5631" : "var(--red)",
                color: "#fff",
                opacity: applying === job.id ? 0.7 : 1,
              }}
            >
              {applying === job.id
                ? "..."
                : job.applied
                  ? lang === "en"
                    ? "Applied ✓"
                    : "Candidatado ✓"
                  : lang === "en"
                    ? "Apply with DevAngola profile"
                    : "Candidatar com perfil DevAngola"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Formulário de publicar vaga ──────────────────────────────
function JobForm({ onClose, onSaved, lang }) {
  const [form, setForm] = useState({
    company_name: "",
    title: "",
    description: "",
    level_required: "junior",
    location: "Luanda",
    type: "full-time",
    contact_email: "",
    skills: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function ch(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (
      !form.company_name ||
      !form.title ||
      !form.description ||
      !form.contact_email
    ) {
      setError(
        lang === "en"
          ? "Fill all required fields."
          : "Preenche todos os campos obrigatórios.",
      );
      return;
    }
    setSaving(true);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const r = await api.post("/jobs", { ...form, skills });
      onSaved(r.data.job);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao publicar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: "var(--s6)",
        marginBottom: "var(--s5)",
        borderLeft: "4px solid var(--red)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "var(--s5)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--display)",
            fontWeight: "var(--w-black)",
            fontSize: "var(--t-lg)",
            color: "var(--ink-900)",
          }}
        >
          {lang === "en" ? "Post a Job" : "Publicar Vaga"}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "var(--ink-400)",
          }}
        >
          ×
        </button>
      </div>
      {error && (
        <div
          style={{
            background: "var(--red-soft)",
            color: "var(--red)",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--s4)",
        }}
      >
        {[
          {
            name: "company_name",
            label: lang === "en" ? "Company" : "Empresa",
            placeholder: "Ex: Unitel, BAI...",
          },
          {
            name: "title",
            label: lang === "en" ? "Position" : "Cargo",
            placeholder: "Ex: Desenvolvedor React",
          },
          {
            name: "contact_email",
            label: "Email de contacto",
            placeholder: "rh@empresa.ao",
          },
          { name: "location", label: "Localização", placeholder: "Luanda" },
        ].map((f) => (
          <div key={f.name} className="field">
            <label className="field__label">{f.label} *</label>
            <input
              className="input"
              name={f.name}
              value={form[f.name]}
              onChange={ch}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <div className="field">
          <label className="field__label">Nível</label>
          <select
            className="select"
            name="level_required"
            value={form.level_required}
            onChange={ch}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label">Tipo</label>
          <select
            className="select"
            name="type"
            value={form.type}
            onChange={ch}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ gridColumn: "1/-1" }}>
          <label className="field__label">Skills (separadas por vírgula)</label>
          <input
            className="input"
            name="skills"
            value={form.skills}
            onChange={ch}
            placeholder="react, nodejs, postgresql..."
          />
        </div>
        <div className="field" style={{ gridColumn: "1/-1" }}>
          <label className="field__label">Descrição *</label>
          <textarea
            className="textarea"
            name="description"
            value={form.description}
            onChange={ch}
            rows={4}
            placeholder="Descreve a vaga, responsabilidades, requisitos..."
          />
        </div>
        <div
          style={{
            gridColumn: "1/-1",
            display: "flex",
            gap: "var(--s3)",
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="button"
            variant="secondary"
            style={{ width: "auto" }}
            onClick={onClose}
          >
            {lang === "en" ? "Cancel" : "Cancelar"}
          </Button>
          <Button type="submit" loading={saving} style={{ width: "auto" }}>
            {lang === "en" ? "Post job" : "Publicar vaga"}
          </Button>
        </div>
      </form>
    </div>
  );
}
