"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { IconDashboard, IconProjects } from "@/components/Icons";
import { NotificationBell, ProfileMenu } from "@/components/NavbarMenus";
import { UserProvider, useSessionUser } from "@/components/UserProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AppShellInner>{children}</AppShellInner>
    </UserProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSessionUser();
  const hideNav = pathname === "/login" || pathname === "/signup";

  return (
    <>
      {!hideNav && (
        <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-[#0c1222]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/dashboard" prefetch className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8 shrink-0" />
              <span className="text-lg font-semibold tracking-tight text-sky-300 hover:text-sky-200">
                Ethara WorkBoard
              </span>
            </Link>
            <nav className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
              <NavLink href="/dashboard" icon={<IconDashboard />}>
                Dashboard
              </NavLink>
              <NavLink href="/projects" icon={<IconProjects />}>
                Projects
              </NavLink>
              <NotificationBell />
              <ProfileMenu user={user} />
            </nav>
          </div>
        </header>
      )}
      <main
        className={
          hideNav
            ? "mx-auto max-w-none p-0"
            : "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
    </>
  );
}

function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      prefetch
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
        active
          ? "bg-slate-800/80 text-sky-300"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
