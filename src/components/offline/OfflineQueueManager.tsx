"use client";

/**
 * The offline queue screen: every record captured on this phone, in one
 * place. The officer can see what is waiting, what is incomplete, what
 * failed and why, fix a mistake (the fix is added to the record's edit
 * trail automatically), attach a missing photo, delete a record that has
 * not synced, and sync on demand.
 *
 * Synced records are locked and stay as history, with the application
 * number the server gave them.
 */
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileWarning,
  History,
  Paperclip,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { tokenManager } from "@/services/apiAuth";
import { OFFLINE_QUEUE_EVENT, type OfflineQueueRecord } from "@/lib/offline/db";
import {
  addFileToRecord,
  deleteRecord,
  editRecord,
  getRecordFiles,
  listRecords,
} from "@/lib/offline/queue";
import { syncAllForOfficer } from "@/lib/offline/syncEngine";

const STATUS_LABEL: Record<OfflineQueueRecord["status"], string> = {
  draft: "Needs evidence",
  ready: "Waiting to sync",
  syncing: "Syncing",
  failed: "Sync failed",
  synced: "Synced",
};

function StatusIcon({ status }: { status: OfflineQueueRecord["status"] }) {
  switch (status) {
    case "synced":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "draft":
      return <FileWarning className="h-4 w-4 text-amber-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function OfflineQueueManager() {
  const [officerId, setOfficerId] = useState<string | null>(null);
  const [records, setRecords] = useState<OfflineQueueRecord[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [syncingNow, setSyncingNow] = useState(false);

  const load = useCallback(async (id: string) => {
    const rows = await listRecords(id);
    setRecords(rows);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.clientRecordId] = (await getRecordFiles(row.clientRecordId))
        .length;
    }
    setFileCounts(counts);
  }, []);

  useEffect(() => {
    const user = tokenManager.getUser();
    if (!user) return;
    setOfficerId(user.id);
    void load(user.id);
    const onChange = () => void load(user.id);
    window.addEventListener(OFFLINE_QUEUE_EVENT, onChange);
    return () => window.removeEventListener(OFFLINE_QUEUE_EVENT, onChange);
  }, [load]);

  if (!officerId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Sign in as a field officer to see the offline queue on this device.
        </CardContent>
      </Card>
    );
  }

  const waiting = records.filter((r) => r.status !== "synced");
  const synced = records.filter((r) => r.status === "synced");

  const startEdit = (record: OfflineQueueRecord) => {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(record.formData)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        values[key] = String(value);
      }
    }
    setDraft(values);
    setEditingId(record.clientRecordId);
  };

  const saveEdit = async (record: OfflineQueueRecord) => {
    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(draft)) {
      const original = record.formData[key];
      if (typeof original === "number") {
        changes[key] = value === "" ? value : Number(value);
      } else if (typeof original === "boolean") {
        changes[key] = value === "true";
      } else {
        changes[key] = value;
      }
    }
    await editRecord(record.clientRecordId, changes);
    setEditingId(null);
    toast.success("Record updated. The change was added to its edit trail.");
    void load(officerId);
  };

  const handleDelete = async (record: OfflineQueueRecord) => {
    if (
      !window.confirm(
        `Delete "${record.title}" from this phone? It has not synced, so this cannot be undone.`,
      )
    ) {
      return;
    }
    await deleteRecord(record.clientRecordId);
    void load(officerId);
  };

  const handleAddFile = async (
    record: OfflineQueueRecord,
    fileList: FileList | null,
  ) => {
    const file = fileList?.[0];
    if (!file) return;
    const missing = record.requiredDocumentTypes.find(
      (t) =>
        !(fileCounts[record.clientRecordId] > 0) ||
        t.toLowerCase().includes("photo"),
    );
    await addFileToRecord(
      record.clientRecordId,
      missing ?? "supporting_document",
      file,
    );
    toast.success("File attached to the record.");
    void load(officerId);
  };

  const handleSyncNow = async () => {
    setSyncingNow(true);
    try {
      const count = await syncAllForOfficer(officerId);
      if (count > 0) toast.success(`${count} record(s) synced.`);
    } finally {
      setSyncingNow(false);
      void load(officerId);
    }
  };

  const renderRecord = (record: OfflineQueueRecord) => (
    <Card key={record.clientRecordId}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{record.title}</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <StatusIcon status={record.status} />
            {STATUS_LABEL[record.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {record.recordType === "violation" ? "Violation" : "Application"} ·
          Captured{" "}
          {new Date(record.capturedAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {fileCounts[record.clientRecordId] ?? 0} file(s)
          {record.editHistory.length > 0 && (
            <span className="inline-flex items-center gap-1">
              {" "}
              · <History className="h-3 w-3" /> {record.editHistory.length}{" "}
              edit(s) on record
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {record.status === "synced" && (
          <p className="text-sm text-emerald-700">
            On the server
            {record.serverApplicationNumber
              ? ` as application ${record.serverApplicationNumber}`
              : ""}
            {record.syncedAt
              ? ` · Synced ${new Date(record.syncedAt).toLocaleString("en-GB")}`
              : ""}
          </p>
        )}
        {record.status === "draft" && (
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <FileWarning className="h-4 w-4" />
            This record still needs its photo or document evidence before it
            can sync.
          </p>
        )}
        {record.status === "failed" && record.failureReason && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {record.failureReason}
          </p>
        )}

        {editingId === record.clientRecordId ? (
          <div className="space-y-3 rounded-md border p-3">
            {Object.entries(draft).map(([field, value]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`${record.clientRecordId}-${field}`}>
                  {field}
                </Label>
                <Input
                  id={`${record.clientRecordId}-${field}`}
                  value={value}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [field]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void saveEdit(record)}>
                Save changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Every change is recorded in this record&apos;s edit trail and
              sent to the server with the sync.
            </p>
          </div>
        ) : (
          record.status !== "synced" && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEdit(record)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Label
                htmlFor={`file-${record.clientRecordId}`}
                className="inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-sm hover:bg-muted"
              >
                <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Add file
              </Label>
              <Input
                id={`file-${record.clientRecordId}`}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) =>
                  void handleAddFile(record, e.target.files)
                }
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => void handleDelete(record)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Offline Queue</h1>
          <p className="text-sm text-muted-foreground">
            Records captured on this phone. They sync automatically when the
            network returns. Payments are never taken offline; citizens pay
            later through the normal channels.
          </p>
        </div>
        <Button
          onClick={handleSyncNow}
          disabled={syncingNow || waiting.length === 0}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${syncingNow ? "animate-spin" : ""}`}
          />
          Sync now
        </Button>
      </div>

      {records.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing captured yet. Applications and violations you record with
            no network will appear here.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">{waiting.map(renderRecord)}</div>

      {synced.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Synced from this phone
          </h2>
          {synced.map(renderRecord)}
        </div>
      )}
    </div>
  );
}
