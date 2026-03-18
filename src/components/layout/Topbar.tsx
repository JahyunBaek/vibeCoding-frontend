import { Bell, Moon, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

export default function Topbar() {
  const { user, clear } = useAuthStore();
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
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="flex h-14 items-center gap-3 px-6">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input placeholder="Search..." className="max-w-[420px]" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:inline-flex">
            16 Jan 2026 - 12 Feb 2026
          </Button>
          <Button variant="outline" size="sm">
            Download
          </Button>
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Theme">
            <Moon className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1 hover:bg-slate-50">
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
