import PortfolioView from "@/components/portfolio-view";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  let profile = null;
  let skills: Record<string, unknown>[] = [];
  let projects: Record<string, unknown>[] = [];
  let experiences: Record<string, unknown>[] = [];
  let achievements: Record<string, unknown>[] = [];
  let socialLinks: Record<string, unknown>[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = await createClient();
    const [p, s, pr, ex, ac, so] = await Promise.all([
      supabase.from("profiles").select("*").eq("is_published", true).limit(1).maybeSingle(),
      supabase.from("skills").select("*").eq("is_published", true).order("display_order"),
      supabase.from("projects").select("*, project_images(*), project_technologies(*)").eq("is_published", true).order("display_order"),
      supabase.from("experiences").select("*").eq("is_published", true).order("start_date", { ascending: false }),
      supabase.from("achievements").select("*").eq("is_published", true).order("achievement_date", { ascending: false }),
      supabase.from("social_links").select("*").eq("is_published", true).order("display_order"),
    ]);
    profile = p.data;
    skills = (s.data ?? []) as Record<string, unknown>[];
    projects = (pr.data ?? []) as Record<string, unknown>[];
    experiences = (ex.data ?? []) as Record<string, unknown>[];
    achievements = (ac.data ?? []) as Record<string, unknown>[];
    socialLinks = (so.data ?? []) as Record<string, unknown>[];
  }

  return <PortfolioView profile={profile as Record<string, unknown> | null} skills={skills} projects={projects} experiences={experiences} achievements={achievements} socialLinks={socialLinks} />;
}
