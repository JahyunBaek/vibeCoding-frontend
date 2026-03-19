import { useAction } from "@/hooks/useAction";
import type { ScreenKey, ActionKey } from "@/config/permissions";

type Props = {
  screen: ScreenKey;
  action: ActionKey;
  condition?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function Can({ screen, action, condition = true, children, fallback = null }: Props) {
  const allowed = useAction(screen, action);
  return (allowed && condition) ? <>{children}</> : <>{fallback}</>;
}
