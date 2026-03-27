import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import type { MenuNode } from "@/types/menu";

function MenuItem({
  node,
  depth = 0,
  collapsed,
}: {
  node: MenuNode;
  depth?: number;
  collapsed: boolean;
}) {
  const loc = useLocation();
  const active = node.path && loc.pathname === node.path;

  if (!node.useYn) return null;

  // 그룹 헤더 (path 없고 자식 있음)
  if (!node.path && node.children?.length) {
    return (
      <div className="mt-2">
        {!collapsed && (
          <div className="px-3 text-xs font-semibold text-muted-fg">
            {node.name}
          </div>
        )}
        {collapsed && <div className="my-1 h-px bg-border" />}
        <div className="mt-1 space-y-1">
          {node.children.map((c) => (
            <MenuItem key={c.menuId} node={c} depth={depth + 1} collapsed={collapsed} />
          ))}
        </div>
      </div>
    );
  }

  if (!node.path) return null;

  if (collapsed) {
    return (
      <Link
        to={node.path}
        title={node.name}
        className={cn(
          "flex h-9 w-9 mx-auto items-center justify-center rounded-md text-sm font-medium text-foreground hover:bg-accent",
          active && "bg-accent"
        )}
      >
        {node.name.charAt(0)}
      </Link>
    );
  }

  const padding = depth === 0 ? "px-3" : "px-3 pl-8";
  return (
    <Link
      to={node.path}
      className={cn(
        "block rounded-md py-2 text-sm text-foreground hover:bg-accent",
        padding,
        active && "bg-accent font-medium"
      )}
    >
      {node.name}
    </Link>
  );
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const { data } = useQuery({
    queryKey: ["menus", "my"],
    queryFn: api.menusMy,
  });

  const { data: branding } = useQuery({
    queryKey: ["tenant", "branding"],
    queryFn: () => api.tenantBranding(),
    staleTime: 5 * 60 * 1000,
  });

  const companyName = branding?.companyName || "Common System";
  const logoUrl = branding?.logoUrl || "";

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 border-r border-base bg-surface md:flex flex-col transition-[width] duration-200",
        collapsed ? "w-16" : "w-[280px]"
      )}
    >
      {/* 로고 + 토글 */}
      <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-0")}>
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-7 w-7 shrink-0 rounded-md object-cover" />
        ) : (
          <Avatar className="h-7 w-7 shrink-0 rounded-md">
            <AvatarFallback className="rounded-md text-xs font-bold">
              {companyName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        {!collapsed && (
          <div className="flex-1 text-sm font-semibold text-foreground">{companyName}</div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto shrink-0 rounded-md p-1 text-muted-fg hover:bg-accent hover:text-foreground"
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      {/* 메뉴 */}
      <div className={cn("flex-1 overflow-y-auto px-2", collapsed && "px-1")}>
        {!collapsed && (
          <div className="px-3 text-xs font-semibold text-muted-fg">{t("sidebar.navigation")}</div>
        )}
        <div className="mt-2 space-y-1">
          {(data ?? []).map((n: MenuNode) => (
            <MenuItem key={n.menuId} node={n} collapsed={collapsed} />
          ))}
        </div>
      </div>

      {/* 사용자 */}
      {user && (
        <div className={cn(
          "border-t border-base p-3",
          collapsed ? "flex justify-center" : "flex items-center gap-2"
        )}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs">
              {user.name?.slice(0, 1) ?? "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{user.name ?? "User"}</div>
              <div className="truncate text-xs text-muted-fg">{user.username ?? ""}</div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
