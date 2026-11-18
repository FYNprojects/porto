import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: admin } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/");
  return <AdminDashboard email={user.email ?? "Administrator"} role={admin.role} />;
}
