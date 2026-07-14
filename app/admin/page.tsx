// src/app/[locale]/admin/page.tsx
import { getServerAuthSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

export default async function AdminDashboard() {
  console.log('[AdminDashboard] Getting session with getServerSession...');
  
  // Usa getServerSession con authOptions
  const session = await getServerAuthSession();
  console.log('[AdminDashboard] Session:', session ? 'exists' : 'null');
  
  if (!session) {
    console.log('[AdminDashboard] No session, redirecting to login');
    // Il redirect sarà gestito dal layout
  }

  // Fetch some stats



  return (
    <div className="space-y-10">



      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <h1 className="text-5xl text-white">Hello Admin</h1>
      </div>
    </div>
  );
}