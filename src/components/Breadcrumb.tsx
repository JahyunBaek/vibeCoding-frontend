import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

function isNumericOrId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export default function Breadcrumb() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const PATH_LABELS: Record<string, string> = {
    dashboard: t("nav.dashboard"),
    boards: t("nav.boards"),
    write: t("breadcrumb.write"),
    posts: t("breadcrumb.posts"),
    admin: t("nav.admin"),
    users: t("nav.users"),
    roles: t("nav.roles"),
    orgs: t("nav.orgs"),
    menus: t("nav.menus"),
    codes: t("nav.codes"),
    screens: t("nav.screens"),
    settings: t("nav.settings"),
    audit: t("nav.audit"),
    "super-admin": t("nav.system"),
    tenants: t("nav.tenants"),
    "my-info": t("nav.myInfo"),
    sample: t("sample.medical"),
    patients: t("sample.patients"),
    trials: t("sample.trials"),
  };

  const crumbs: { label: string; path: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const path = "/" + segments.slice(0, i + 1).join("/");

    // Skip numeric/dynamic ID segments (e.g., /boards/3, /boards/3/posts/5)
    if (isNumericOrId(segment)) continue;

    // For "posts" under boards/:id/posts/:postId, show "게시글"
    const label = PATH_LABELS[segment] ?? segment;
    crumbs.push({ label, path });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        {t("breadcrumb.home")}
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
