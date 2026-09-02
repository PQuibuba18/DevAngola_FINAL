import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { IconCamera, IconCheck, IconEdit } from "../components/ui/Icons";

export default function Perfil() {
  const { user, updateUser } = useAuth();
  const { lang } = useLang();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    identifier: user?.identifier || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function handleAvatarChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = (ev) => setPreview(ev.target.result);
    r.readAsDataURL(f);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(lang === "en" ? "Name required." : "Nome obrigatório.");
      return;
    }
    if (!form.email.trim()) {
      setError(lang === "en" ? "Email required." : "Email obrigatório.");
      return;
    }

    setSaving(true);
    setMsg("");
    setError("");
    try {
      const r = await api.put("/users/me", {
        name: form.name.trim(),
        email: form.email.trim(),
        identifier: form.identifier.trim(),
      });
      updateUser(r.data);

      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        const av = await api.post("/users/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updateUser({ avatar_url: av.data.avatar_url });
      }

      setMsg(
        lang === "en" ? "Profile updated!" : "Perfil actualizado com sucesso!",
      );
      setEditing(false);
      setAvatarFile(null);
      setPreview(null);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (lang === "en" ? "Error saving." : "Erro ao guardar."),
      );
    } finally {
      setSaving(false);
    }
  }

  function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : "pt-AO", {
      month: "long",
      year: "numeric",
    });
  }

  const API = (
    process.env.REACT_APP_API_URL || "http://localhost:5000/api"
  ).replace("/api", "");
  const avatarSrc =
    preview ||
    (user?.avatar_url
      ? user.avatar_url.startsWith("http")
        ? user.avatar_url
        : `${API}${user.avatar_url}`
      : null);

  const FIELDS = [
    {
      key: "name",
      label: lang === "en" ? "Full Name" : "Nome Completo",
      type: "text",
      placeholder: lang === "en" ? "Your name" : "O teu nome",
    },
    {
      key: "email",
      label: "E-mail",
      type: "email",
      placeholder: "email@exemplo.com",
    },
    {
      key: "identifier",
      label:
        lang === "en" ? "Identifier (optional)" : "Identificador (opcional)",
      type: "text",
      placeholder:
        lang === "en" ? "Ex: React Developer" : "Ex: Programador React",
    },
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="page-body">
        <div className="page-inner">
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="card" style={{ padding: "var(--s8)" }}>
              {/* Avatar */}
              <div style={{ textAlign: "center", marginBottom: "var(--s6)" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Avatar name={user?.name} src={avatarSrc} size="2xl" />
                  <button
                    type="button"
                    onClick={() => document.getElementById("av-input").click()}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--ink-900)",
                      border: "2px solid var(--surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <IconCamera
                      className="icon icon--sm"
                      style={{ color: "white" }}
                    />
                  </button>
                </div>
                <input
                  id="av-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />

                <div style={{ marginTop: "var(--s3)" }}>
                  <div
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "var(--t-xl)",
                      fontWeight: "var(--w-black)",
                      color: "var(--ink-900)",
                    }}
                  >
                    {user?.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "var(--s2)",
                      marginTop: "var(--s2)",
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge level={user?.level} />
                    {user?.badge && (
                      <span className={`seal seal--${user.badge}`}>
                        {user.badge_label}
                      </span>
                    )}
                    {user?.verified && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#1E5631",
                          fontWeight: 700,
                          background: "#E6F4EA",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        ✓ {lang === "en" ? "Verified" : "Verificado"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {msg && (
                <div
                  style={{
                    background: "#E6F4EA",
                    color: "#1E5631",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  {msg}
                </div>
              )}
              {error && (
                <div
                  style={{
                    background: "var(--red-soft)",
                    color: "var(--red)",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              {editing ? (
                <form
                  onSubmit={handleSave}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s4)",
                  }}
                >
                  {FIELDS.map((field) => (
                    <div key={field.key} className="field">
                      <label className="field__label">{field.label}</label>
                      <input
                        className="input"
                        type={field.type}
                        value={form[field.key]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--s3)",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      style={{ width: "auto" }}
                      onClick={() => {
                        setEditing(false);
                        setForm({
                          name: user?.name || "",
                          email: user?.email || "",
                          identifier: user?.identifier || "",
                        });
                        setPreview(null);
                        setAvatarFile(null);
                        setError("");
                      }}
                    >
                      {lang === "en" ? "Cancel" : "Cancelar"}
                    </Button>
                    <Button
                      type="submit"
                      loading={saving}
                      style={{ width: "auto" }}
                    >
                      <IconCheck className="icon icon--sm" />{" "}
                      {lang === "en" ? "Save" : "Guardar"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    {[
                      {
                        label: lang === "en" ? "Name" : "Nome",
                        value: user?.name,
                      },
                      { label: "E-mail", value: user?.email },
                      {
                        label: lang === "en" ? "Level" : "Nível",
                        value: <Badge level={user?.level} />,
                      },
                      {
                        label: lang === "en" ? "Identifier" : "Identificador",
                        value: user?.identifier || "—",
                      },
                      {
                        label: lang === "en" ? "Member since" : "Membro desde",
                        value: fmtDate(user?.created_at),
                      },
                      {
                        label: lang === "en" ? "Identity" : "Identidade",
                        value: user?.verified
                          ? "✓ Verificada"
                          : lang === "en"
                            ? "Not verified"
                            : "Não verificada",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "var(--s3) 0",
                          borderBottom: "var(--line)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--t-sm)",
                            color: "var(--ink-400)",
                            fontWeight: "var(--w-bold)",
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontSize: "var(--t-sm)",
                            color: "var(--ink-900)",
                            fontWeight: "var(--w-medium)",
                            textAlign: "right",
                            maxWidth: "60%",
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--s3)",
                      marginTop: "var(--s6)",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      style={{ width: "auto" }}
                      onClick={() => setEditing(true)}
                    >
                      <IconEdit className="icon icon--sm" />{" "}
                      {lang === "en" ? "Edit profile" : "Editar perfil"}
                    </Button>
                    {!user?.verified && (
                      <Button
                        variant="secondary"
                        style={{ width: "auto" }}
                        onClick={() => (window.location.href = "/verificacao")}
                      >
                        🇦🇴{" "}
                        {lang === "en"
                          ? "Verify identity"
                          : "Verificar identidade"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
