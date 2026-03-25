import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const PATH_LABELS: Record<string, string> = {
  dashboard: "대시보드",
  boards: "게시판",
  write: "글쓰기",
  posts: "게시글",
  admin: "관리자",
  users: "사용자 관리",
  roles: "역할 관리",
  orgs: "조직 관리",
  menus: "메뉴 관리",
  codes: "공통코드 관리",
  screens: "화면-액션 관리",
  settings: "설정",
  audit: "감사 로그",
  "super-admin": "시스템 관리",
  tenants: "테넌트 관리",
  "my-info": "내 정보",
};

function isNumericOrId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

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
        홈
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
