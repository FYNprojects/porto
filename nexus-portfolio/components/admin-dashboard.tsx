"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, Award, BriefcaseBusiness, FileImage, FolderKanban, LayoutDashboard, LogOut, Plus, Save, Settings, Trash2, UserRound, Wrench, X, ExternalLink, UploadCloud } from "lucide-react";

type Row = Record<string, any>;
type TableKey = "overview" | "profiles" | "projects" | "project_images" | "project_technologies" | "skills" | "experiences" | "achievements" | "social_links" | "media_assets" | "site_settings";
const menu: { id: TableKey; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profiles", label: "Profile", icon: UserRound },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "project_images", label: "Project Gallery", icon: FileImage },
  { id: "project_technologies", label: "Technologies", icon: Wrench },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "experiences", label: "Experience", icon: BriefcaseBusiness },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "social_links", label: "Social Links", icon: ExternalLink },
  { id: "media_assets", label: "Media Library", icon: FileImage },
  { id: "site_settings", label: "Settings", icon: Settings },
];
const config: Record<Exclude<TableKey, "overview" | "media_assets">, { title: string; fields: { name: string; label: string; type?: string; long?: boolean }[] }> = {
  profiles: { title: "Profile information", fields: [{ name: "full_name", label: "Full name" }, { name: "headline", label: "Headline" }, { name: "tagline", label: "Tagline" }, { name: "biography", label: "Biography", long: true }, { name: "profile_image", label: "Profile image URL" }, { name: "university", label: "University" }, { name: "major", label: "Major" }, { name: "location", label: "Location" }, { name: "email", label: "Email", type: "email" }, { name: "is_published", label: "Published", type: "checkbox" }] },
  projects: { title: "Project management", fields: [{ name: "title", label: "Project title" }, { name: "slug", label: "Slug" }, { name: "category", label: "Category" }, { name: "short_description", label: "Short description", long: true }, { name: "overview", label: "Overview", long: true }, { name: "background", label: "Background", long: true }, { name: "problem_statement", label: "Problem statement", long: true }, { name: "my_role", label: "My role" }, { name: "development_process", label: "Development process", long: true }, { name: "results", label: "Results", long: true }, { name: "cover_image", label: "Cover image URL" }, { name: "technologies_text", label: "Technologies (comma-separated)" }, { name: "github_url", label: "GitHub URL" }, { name: "demo_url", label: "Live demo URL" }, { name: "featured", label: "Featured", type: "checkbox" }, { name: "is_published", label: "Published", type: "checkbox" }, { name: "display_order", label: "Display order", type: "number" }] },
  project_images: { title: "Project gallery", fields: [{ name: "project_id", label: "Project UUID" }, { name: "image_url", label: "Image URL" }, { name: "alt_text", label: "Alternative text" }, { name: "display_order", label: "Display order", type: "number" }] },
  project_technologies: { title: "Project technologies", fields: [{ name: "project_id", label: "Project UUID" }, { name: "technology_name", label: "Technology name" }] },
  skills: { title: "Skills management", fields: [{ name: "name", label: "Skill name" }, { name: "category", label: "Category" }, { name: "description", label: "Description", long: true }, { name: "icon", label: "Icon name" }, { name: "display_order", label: "Display order", type: "number" }, { name: "is_published", label: "Published", type: "checkbox" }] },
  experiences: { title: "Experience management", fields: [{ name: "organization", label: "Organization" }, { name: "position", label: "Position" }, { name: "category", label: "Category" }, { name: "description", label: "Description", long: true }, { name: "responsibilities_text", label: "Responsibilities (one per line)", long: true }, { name: "start_date", label: "Start date", type: "date" }, { name: "end_date", label: "End date", type: "date" }, { name: "is_current", label: "Current position", type: "checkbox" }, { name: "documentation_url", label: "Documentation URL" }, { name: "is_published", label: "Published", type: "checkbox" }, { name: "display_order", label: "Display order", type: "number" }] },
  achievements: { title: "Achievement management", fields: [{ name: "title", label: "Achievement title" }, { name: "issuer", label: "Issuer / Organizer" }, { name: "category", label: "Category" }, { name: "description", label: "Description", long: true }, { name: "achievement_date", label: "Achievement date", type: "date" }, { name: "certificate_url", label: "Certificate URL" }, { name: "is_published", label: "Published", type: "checkbox" }, { name: "display_order", label: "Display order", type: "number" }] },
  social_links: { title: "Social links", fields: [{ name: "platform", label: "Platform" }, { name: "url", label: "URL" }, { name: "display_order", label: "Display order", type: "number" }, { name: "is_published", label: "Published", type: "checkbox" }] },
  site_settings: { title: "Website settings", fields: [{ name: "setting_key", label: "Setting key" }, { name: "setting_value", label: "Setting value", long: true }, { name: "is_public", label: "Public setting", type: "checkbox" }] },
};

export default function AdminDashboard({ email, role }: { email: string; role: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [active, setActive] = useState<TableKey>("overview");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState({ projects: 0, skills: 0, experiences: 0, achievements: 0 });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchRows = useCallback(async () => {
    if (active === "overview") return;
    if (active === "media_assets") {
      setLoading(true);
      const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
      if (error) setNotice(error.message); else setRows(data ?? []);
      setLoading(false); return;
    }
    setLoading(true);
    const selectQuery = active === "projects" ? "*, project_technologies(technology_name)" : "*";
    const orderColumn = active === "site_settings" ? "updated_at" : "created_at";
    const { data, error } = await supabase.from(active).select(selectQuery).order(orderColumn, { ascending: false });
    if (error) setNotice(error.message); else setRows((data ?? []).map((row: Row) => active === "projects" ? { ...row, technologies_text: (row.project_technologies ?? []).map((t: Row) => t.technology_name).join(", ") } : row));
    setLoading(false);
  }, [active, supabase]);

  const fetchCounts = useCallback(async () => {
    const [p, s, e, a] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("skills").select("id", { count: "exact", head: true }),
      supabase.from("experiences").select("id", { count: "exact", head: true }),
      supabase.from("achievements").select("id", { count: "exact", head: true }),
    ]);
    setCounts({ projects: p.count ?? 0, skills: s.count ?? 0, experiences: e.count ?? 0, achievements: a.count ?? 0 });
  }, [supabase]);

  useEffect(() => { setNotice(""); if (active === "overview") fetchCounts(); else fetchRows(); }, [active, fetchCounts, fetchRows]);

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || active === "overview" || active === "media_assets") return;
    const form = new FormData(event.currentTarget);
    const payload: Row = {};
    const fields = config[active].fields;
    for (const field of fields) {
      const value = form.get(field.name);
      if (field.type === "checkbox") payload[field.name] = value === "on";
      else if (field.type === "number") payload[field.name] = value ? Number(value) : 0;
      else if (field.type === "date") payload[field.name] = value?.toString() || null;
      else payload[field.name] = value?.toString() ?? "";
    }
    if (active === "experiences") {
      payload.responsibilities = String(payload.responsibilities_text ?? "").split("\n").map((s: string) => s.trim()).filter(Boolean);
      delete payload.responsibilities_text;
    }
    if (active === "projects" && !payload.slug) payload.slug = String(payload.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const isUpdate = Boolean(editing.id);
    const isProjects = active === "projects";
    const technologyNames = isProjects ? String(form.get("technologies_text") ?? "").split(",").map((v) => v.trim()).filter(Boolean) : [];
    if (isProjects) delete payload.technologies_text;
    let recordId = editing.id as string | undefined;
    if (isUpdate) {
      const { error } = await supabase.from(active).update(payload).eq("id", editing.id);
      if (error) { setNotice(error.message); return; }
    } else {
      const { data, error } = await supabase.from(active).insert(payload).select("id").single();
      if (error) { setNotice(error.message); return; }
      recordId = data.id;
    }
    if (isProjects && recordId) {
      const { error: deleteError } = await supabase.from("project_technologies").delete().eq("project_id", recordId);
      if (deleteError) { setNotice(deleteError.message); return; }
      if (technologyNames.length) {
        const { error: techError } = await supabase.from("project_technologies").insert(technologyNames.map((technology_name) => ({ project_id: recordId, technology_name })));
        if (techError) { setNotice(techError.message); return; }
      }
    }
    setNotice(isUpdate ? "Changes saved." : "New item created."); setEditing(null); await fetchRows(); await fetchCounts();
  }

  async function deleteRecord(row: Row) {
    if (!window.confirm("Delete this item permanently?")) return;
    const { error } = await supabase.from(active).delete().eq("id", row.id);
    if (error) setNotice(error.message); else { setNotice("Item deleted."); await fetchRows(); await fetchCounts(); }
  }

  async function deleteMedia(row: Row) {
    if (!window.confirm("Delete this media file permanently? Any content using this URL may lose its image.")) return;
    const { error: storageError } = await supabase.storage.from(row.bucket).remove([row.file_path]);
    if (storageError) { setNotice(storageError.message); return; }
    const { error: dbError } = await supabase.from("media_assets").delete().eq("id", row.id);
    if (dbError) setNotice(dbError.message); else { setNotice("Media deleted."); await fetchRows(); }
  }

  async function uploadMedia(file?: File) {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) { setNotice("Allowed formats: JPG, PNG, WEBP, GIF, or PDF."); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice("Maximum file size is 8 MB."); return; }
    setUploading(true); setNotice("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${Date.now()}-${safeName}`;
    const bucket = file.type === "application/pdf" ? "portfolio-certificates" : "portfolio-images";
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) setNotice(uploadError.message);
    else {
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
      const { error: dbError } = await supabase.from("media_assets").insert({ bucket, file_path: path, public_url: publicData.publicUrl, file_name: file.name, mime_type: file.type, size_bytes: file.size });
      if (dbError) setNotice(dbError.message); else { setNotice("Upload completed. Public URL saved to Media Library."); await fetchRows(); }
    }
    setUploading(false);
  }

  async function logout() { await supabase.auth.signOut(); window.location.href = "/"; }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="brand-glyph">N</span><span>NEXUS<small>CONTROL ROOM</small></span></a><div className="admin-menu-label">WORKSPACE</div><nav>{menu.map(item => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? "admin-nav-item active" : "admin-nav-item"} onClick={() => { setEditing(null); setActive(item.id); }}><Icon size={17}/>{item.label}{active === item.id ? <i/> : null}</button>; })}</nav><div className="sidebar-bottom"><div className="admin-user"><span className="avatar">{email.slice(0, 1).toUpperCase()}</span><div><b>{email}</b><small>{role.toUpperCase()}</small></div></div><button className="logout-button" onClick={logout}><LogOut size={16}/> Sign out</button></div></aside>
      <section className="admin-main"><header className="admin-topbar"><div><span className="breadcrumb">NEXUS / ADMIN</span><h1>{menu.find(m => m.id === active)?.label}</h1></div><div className="admin-top-actions"><span className="admin-online"><i/> SYSTEM ONLINE</span><a href="/portfolio" target="_blank" rel="noreferrer">VIEW PORTFOLIO <ExternalLink size={14}/></a><button className="header-logout" onClick={logout}><LogOut size={14}/> SIGN OUT</button></div></header>
        {notice && <div className="admin-notice">{notice}<button onClick={() => setNotice("")}><X size={14}/></button></div>}
        {active === "overview" ? <div className="dashboard-content"><div className="welcome-card"><div><span className="eyebrow">CONTROL CENTER / 001</span><h2>Welcome back,<br/><em>administrator.</em></h2><p>Manage the content and identity of your digital universe.</p></div><div className="welcome-orb"/></div><div className="stats-grid">{Object.entries(counts).map(([label, value]) => <div className="stat-card" key={label}><span>{label.toUpperCase()}</span><b>{value}</b><small>DATABASE RECORDS</small></div>)}</div><div className="admin-info-grid"><div className="admin-info-card"><Activity size={18}/><h3>Content workflow</h3><p>Create your content, save it as draft, then publish it when the information and images are ready.</p></div><div className="admin-info-card"><UploadCloud size={18}/><h3>Media library</h3><p>Upload images or certificates here. Copy the public URL into the relevant content form.</p></div></div></div> : active === "media_assets" ? <div className="manager-content"><div className="manager-heading"><div><h2>Media library</h2><p>Images and certificate files stored in Supabase Storage.</p></div><label className="upload-button"><UploadCloud size={16}/>{uploading ? "Uploading..." : "Upload file"}<input type="file" accept="image/*,application/pdf" disabled={uploading} onChange={e => uploadMedia(e.target.files?.[0])}/></label></div><div className="media-grid">{rows.map(row => <div className="media-card" key={row.id}>{row.mime_type?.startsWith("image/") ? <img src={row.public_url} alt={row.file_name}/> : <div className="pdf-preview">PDF</div>}<b>{row.file_name}</b><div className="media-actions"><button onClick={() => navigator.clipboard.writeText(row.public_url)}>COPY URL</button><button className="delete-media" onClick={() => deleteMedia(row)} aria-label="Delete media"><Trash2 size={13}/></button></div></div>)}</div></div> : <div className="manager-content"><div className="manager-heading"><div><h2>{config[active].title}</h2><p>Manage records stored in your Supabase database.</p></div><button className="add-button" onClick={() => setEditing({})}><Plus size={16}/> Add new</button></div>{loading ? <div className="admin-empty">Loading records...</div> : rows.length ? <div className="records-table"><div className="records-head"><span>CONTENT</span><span>STATUS</span><span>ACTION</span></div>{rows.map(row => <div className="record-row" key={row.id ?? row.setting_key}><div><b>{row.title ?? row.name ?? row.full_name ?? row.organization ?? row.platform ?? row.setting_key ?? "Untitled"}</b><small>{row.category ?? row.position ?? row.url ?? row.headline ?? row.setting_value ?? ""}</small></div><span className={row.is_published === false ? "status-draft" : "status-live"}>{row.is_published === false ? "DRAFT" : "ACTIVE"}</span><div className="record-actions"><button onClick={() => setEditing({ ...row, responsibilities_text: Array.isArray(row.responsibilities) ? row.responsibilities.join("\n") : "" })}>EDIT</button>{row.id ? <button className="delete-action" onClick={() => deleteRecord(row)}><Trash2 size={14}/></button> : null}</div></div>)}</div> : <div className="admin-empty">No records yet. Select <b>Add new</b> to create your first item.</div>}</div>}
      </section>
      {editing && active !== "overview" && active !== "media_assets" && <div className="admin-modal-backdrop" onClick={() => setEditing(null)}><form className="admin-edit-modal" onSubmit={saveRecord} onClick={e => e.stopPropagation()}><div className="edit-modal-head"><div><small>CONTENT EDITOR</small><h2>{editing.id ? "Edit record" : "Create record"}</h2></div><button type="button" onClick={() => setEditing(null)}><X size={18}/></button></div><div className="edit-fields">{config[active].fields.map(field => <label className={field.long ? "field-long" : ""} key={field.name}>{field.type === "checkbox" ? <span className="checkbox-field"><input name={field.name} type="checkbox" defaultChecked={Boolean(editing[field.name])}/> {field.label}</span> : <><span>{field.label}</span>{field.long ? <textarea name={field.name} defaultValue={editing[field.name] ?? ""} rows={4}/> : <input name={field.name} type={field.type ?? "text"} defaultValue={editing[field.name] ?? ""}/>}</>}</label>)}</div><div className="edit-modal-footer"><button type="button" className="cancel-button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="save-button"><Save size={15}/> Save changes</button></div></form></div>}
    </main>
  );
}
