import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

type MenuNode = {
  menuId: number;
  parentId: number | null;
  name: string;
  path: string | null;
  icon: string | null;
  sortOrder: number;
  useYn: boolean;
  menuType: string;
  boardId: number | null;
  children: MenuNode[];
};

function MenuItem({ node, depth = 0 }: { node: MenuNode; depth?: number }) {
  const loc = useLocation();
  const active = node.path && loc.pathname === node.path;

  if (!node.useYn) return null;

  const padding = depth === 0 ? "px-3" : "px-3 pl-8";

  if (!node.path && node.children?.length) {
    return (
      <div className="mt-2">
        <div className={cn("text-xs font-semibold text-muted-fg", padding)}>{node.name}</div>
        <div className="mt-1 space-y-1">
          {node.children.map((c) => (
            <MenuItem key={c.menuId} node={c} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  if (!node.path) return null;

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
  const { data } = useQuery({
    queryKey: ["menus", "my"],
    queryFn: api.menusMy
  });

  return (
    <aside className="hidden h-screen w-[280px] shrink-0 border-r border-base bg-surface md:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-7 w-7 rounded-md bg-foreground" />
          <div className="text-sm font-semibold text-foreground">Common System</div>
        </div>

        <div className="px-2">
          <div className="text-xs font-semibold text-muted-fg px-3">Navigation</div>
          <div className="mt-2 space-y-1">
            {(data ?? []).map((n: MenuNode) => (
              <MenuItem key={n.menuId} node={n} />
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 space-y-3">
          <div className="rounded-xl border border-base bg-surface p-4">
            <div className="text-sm font-semibold text-foreground">Download</div>
            <div className="mt-1 text-xs text-muted-fg">
              샘플 카드 영역입니다. (예시안 레이아웃 참고)
            </div>
            <Button className="mt-3 w-full" variant="outline">
              Download
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-base bg-surface p-3">
            <Avatar>
              <AvatarFallback>{user?.name?.slice(0, 1) ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{user?.name ?? "User"}</div>
              <div className="truncate text-xs text-muted-fg">{user?.username ?? ""}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
