import { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import GlassSurface from "@/components/cherry/GlassSurface";

export const metadata: Metadata = {
  title: "Typamine - Admin Login",
  icons: {
    icon: [
      {
        url: "/images/icons/admin-icon.png",
      }
    ]
  }
};
export default function LoginPage() {
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden font-otfits">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: "url('/images/admin/admin-bg.png')" }}
      />
      <div className="absolute inset-0 z-10 bg-blue/30 dark:bg-red/20" />

      {/* Login Card Container */}
      <div className="w-full max-w-xl relative z-20 flex flex-col items-center">
        <div className="p-4 sm:p-6">

          <GlassSurface width="100%" height="auto" backgroundOpacity={0.4} brightness={80} borderRadius={32} borderWidth={1}>
            <div className="w-full relative z-10 px-8">
              <LoginForm />
            </div>
          </GlassSurface>
        </div>

        <p className="mt-8 mb-4 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-white">
          &copy; {new Date().getFullYear() + " "} Typamine&reg; - All rights reserved.
        </p>
      </div>
    </div>
  );
}
