import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, History as HistoryIcon, Stamp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AvailableAction } from "@/lib/api/workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLOR_MAP: Record<string, string> = {
  default: "",
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

const STATE_BADGE_COLOR: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  cyan: "bg-cyan-100 text-cyan-700",
  amber: "bg-amber-100 text-amber-700",
  gray: "bg-gray-100 text-gray-700",
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  green: "bg-green-100 text-green-700",
  slate: "bg-slate-100 text-slate-700",
  orange: "bg-orange-100 text-orange-700",
};

type Props = {
  entityType: string;
  entityId: number;
  /** 전이 후 콜백 (도메인 데이터도 새로고침해야 할 때) */
  onTransition?: () => void;
};

/**
 * 워크플로우 액션 버튼 자동 렌더링.
 * - 백엔드의 availableActions 를 그대로 버튼으로 표시
 * - 현재 상태 배지, 이력 보기 토글 포함
 */
export default function WorkflowActions({ entityType, entityId, onTransition }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [pendingAction, setPendingAction] = useState<AvailableAction | null>(null);
  const [comment, setComment] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["workflow", entityType, entityId],
    queryFn: () => api.workflowInstance(entityType, entityId),
  });

  const transitionMut = useMutation({
    mutationFn: (action: AvailableAction) =>
      api.workflowTransition(entityType, entityId, {
        actionCode: action.actionCode,
        comment: comment || undefined,
      }),
    onSuccess: () => {
      toast.success(t("workflow.transitioned"));
      qc.invalidateQueries({ queryKey: ["workflow", entityType, entityId] });
      onTransition?.();
      setPendingAction(null);
      setComment("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onClickAction = (action: AvailableAction) => {
    if (action.commentRequired || action.requiresApproval) {
      setPendingAction(action);
    } else {
      transitionMut.mutate(action);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-fg">{t("common.loading")}</div>;
  if (!data) return null;

  const stateBadgeClass = data.currentStateColor
    ? (STATE_BADGE_COLOR[data.currentStateColor] ?? "bg-gray-100 text-gray-700")
    : "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-3 rounded-lg border bg-surface p-3">
      {/* 상태 헤더 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-fg">{t("workflow.currentState")}:</span>
        <Badge className={stateBadgeClass}>{data.currentStateName}</Badge>
        {data.status === "PENDING_APPROVAL" && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Stamp className="mr-1 h-3 w-3" />
            {t("workflow.pendingApproval")}
          </Badge>
        )}
        {data.assigneeName && (
          <span className="text-xs text-muted-fg">
            · {t("workflow.assignee")}: <strong>{data.assigneeName}</strong>
          </span>
        )}
        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setShowHistory(!showHistory)}>
          <HistoryIcon className="mr-1 h-3 w-3" />
          {t("workflow.history")}
        </Button>
      </div>

      {/* 액션 버튼 */}
      {data.availableActions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {data.availableActions.map((action) => (
            <Button
              key={action.transitionId}
              size="sm"
              className={COLOR_MAP[action.buttonColor ?? "default"] ?? ""}
              variant={action.buttonColor === "default" ? "outline" : "default"}
              disabled={transitionMut.isPending}
              onClick={() => onClickAction(action)}
            >
              {transitionMut.isPending && transitionMut.variables?.actionCode === action.actionCode && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {action.actionName}
              {action.requiresApproval && <Stamp className="ml-1 h-3 w-3 opacity-70" />}
            </Button>
          ))}
        </div>
      )}

      {/* 종료 상태 안내 */}
      {data.availableActions.length === 0 && data.status === "ACTIVE" && (
        <div className="text-xs text-muted-fg border-t pt-3">{t("workflow.noActionsAvailable")}</div>
      )}
      {data.status === "COMPLETED" && (
        <div className="text-xs text-muted-fg border-t pt-3">{t("workflow.completed")}</div>
      )}

      {/* 이력 */}
      {showHistory && data.history.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-muted-fg mb-2">{t("workflow.history")}</div>
          <ul className="space-y-1.5">
            {data.history.map((h) => (
              <li key={h.historyId} className="text-xs text-muted-fg">
                <span className="font-mono">{new Date(h.createdAt).toLocaleString()}</span>
                {" — "}
                <span className="text-foreground">{h.actionCode}</span>
                {h.fromStateCode && h.toStateCode && (
                  <>
                    {" "}
                    <span className="text-muted-fg">
                      ({h.fromStateCode} → {h.toStateCode})
                    </span>
                  </>
                )}
                {h.actorName && <span> · {h.actorName}</span>}
                {h.comment && <div className="ml-4 italic">"{h.comment}"</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 의견/결재 입력 다이얼로그 */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPendingAction(null)}
        >
          <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-3">{pendingAction.actionName}</h3>
            {pendingAction.requiresApproval && (
              <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                <Stamp className="inline h-3 w-3 mr-1" />
                {t("workflow.approvalRequired")}
              </div>
            )}
            <label className="text-xs text-muted-fg">
              {t("workflow.comment")}
              {pendingAction.commentRequired && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <textarea
              className="mt-1 w-full rounded-md border bg-surface p-2 text-sm"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("workflow.commentPlaceholder")}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPendingAction(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                disabled={transitionMut.isPending || (pendingAction.commentRequired && !comment.trim())}
                onClick={() => transitionMut.mutate(pendingAction)}
              >
                {t("common.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
