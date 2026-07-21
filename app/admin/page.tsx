// src/app/[locale]/admin/page.tsx
import { getServerAuthSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { hasFontsNeedingAIRating } from "@/lib/actions/font";
import AIFontRatingButton from "@/components/admin/AIFontRatingButton";

export default async function AdminDashboard() {
  console.log('[AdminDashboard] Getting session with getServerSession...');

  // Usa getServerSession con authOptions
  const session = await getServerAuthSession();
  console.log('[AdminDashboard] Session:', session ? 'exists' : 'null');

  if (!session) {
    console.log('[AdminDashboard] No session, redirecting to login');
    // Il redirect sarà gestito dal layout
  }

  // Bottone visibile solo se esistono font ancora da arricchire (creator
  // "Google Fonts" / "Typamine Import"), altrimenti non ha nulla da fare.
  const canReadFonts = hasPermission(session, "font", "read");
  const showAIRating = canReadFonts && (await hasFontsNeedingAIRating());

  return (
    <div className="space-y-10">

      <div className="flex items-center justify-between">
        <h1 className="text-5xl text-white">Hello Admin</h1>
        {showAIRating && <AIFontRatingButton />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      </div>
    </div>
  );
}