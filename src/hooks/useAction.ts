import { useAuthStore } from "@/stores/auth";
import type { ScreenKey, ActionKey } from "@/config/permissions";

export function useAction(screen: ScreenKey, action: ActionKey): boolean {
  return useAuthStore((s) => (s.permissions[screen] ?? []).includes(action));
}
