"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Tent, 
  Settings, 
  Shield,
  UserCog,
  Type,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SeventiesThemeToggle } from "@/components/common/SeventiesThemeToggle";
import DynamicLogo from "@/components/layout/DynamicLogo";
import { useThemeStore } from "@/store/themeStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { canAccessResource, Resource } from "@/lib/rbac";

const menuItems: { name: string; href: string; icon: any; resource?: Resource }[] = [
  { name: "Dashboard", href: "/admin", icon: Tent },
  { name: "Fonts", href: "/admin/fonts", icon: Type },
  { name: "Users", href: "/admin/users", icon: UserCog, resource: 'user' },
  { name: "User Roles", href: "/admin/roles", icon: Shield, resource: 'role' },
  { name: "Settings", href: "/admin/settings", icon: Settings, resource: 'user' },
];

export default function AdminSidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const [collapsed, setCollapsed] = useState(false);

  const filteredMenuItems = menuItems.filter(item => 
    !item.resource || canAccessResource(session, item.resource)
  );

  return (
    <div
      className={cn(
        "hidden lg:flex h-[100dvh] shrink-0 relative z-10 transition-all duration-500 ease-in-out",
        collapsed ? "w-[100px] px-3 py-6" : "w-[320px] p-6"
      )}
    >
      <aside className="w-full h-full rounded-2xl border border-zinc-200/20 bg-white/10 dark:bg-zinc-900/20 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500">
        
        <div className={cn(
          "flex items-center justify-center shrink-0 transition-all duration-500",
          collapsed ? "h-20" : "h-36 pb-3"
        )}>
          <DynamicLogo 
            className="text-zinc-900 dark:text-white" 
            squareGlow={theme === "light"} 
            squareIsButton={true}
            squareButtonAction={() => setCollapsed(!collapsed)}
            collapsed={collapsed}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 border-t border-zinc-200/20 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {filteredMenuItems.map((item) => {
            const isActive = item.href === "/admin" 
              ? pathname === "/admin" 
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={cn(
                  "flex items-center px-4 py-4 rounded-xl transition-all duration-300 group",
                  collapsed ? "justify-center" : "justify-start gap-4",
                  isActive 
                    ? "bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white shadow-sm" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors duration-300", isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white")} />
                <span className={cn(
                  "font-otfits font-extrabold uppercase tracking-tighter text-xl leading-none whitespace-nowrap transition-all duration-500 ease-in-out",
                  collapsed ? "opacity-0 w-0 scale-90 translate-x-[-10px] pointer-events-none" : "opacity-100 w-auto scale-100 translate-x-0"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={cn(
          "border-t border-zinc-200/20 transition-all duration-500 shrink-0",
          collapsed ? "h-20 flex items-center justify-center p-0" : "p-6"
        )}>
          <SeventiesThemeToggle size={collapsed ? 28 : 40} variant={collapsed ? "mini" : "full"} />
        </div>
      </aside>
    </div>
  );
}
