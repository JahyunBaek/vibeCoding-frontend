import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyInfoPage() {
  const { data, refetch } = useQuery({ queryKey: ["me"], queryFn: api.me });
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const onSave = async () => {
    await api.updateMe(name || data?.name, newPassword || undefined);
    setNewPassword("");
    await refetch();
    alert("Saved");
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="text-xl font-semibold">My Info</div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-slate-600">Username: <span className="font-mono">{data?.username}</span></div>

          <div>
            <div className="text-xs text-slate-600 mb-1">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={data?.name ?? ""} />
          </div>

          <div>
            <div className="text-xs text-slate-600 mb-1">New password</div>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="(optional)" />
          </div>

          <Button onClick={onSave}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}
