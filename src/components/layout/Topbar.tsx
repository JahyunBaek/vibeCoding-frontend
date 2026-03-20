import { Bell, Moon, Search, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { api } from "@/lib/api";

export default function Topbar() {
  const { user, clear } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const nav = useNavigate();

  const onLogout = async () => {
    try {
      await api.logout();
    } finally {
      clear();
      nav("/login");
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-base bg-surface">
      <div className="flex h-14 items-center gap-3 px-6">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-muted-fg" />
          <Input placeholder="Search..." className="max-w-[420px]" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Theme" onClick={toggle}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full border border-base bg-surface px-2 py-1 hover:bg-accent">
                <Avatar>
                  <AvatarFallback>{user?.name?.slice(0, 1) ?? "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{user?.name ?? "User"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => nav("/me")}>My Info</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
