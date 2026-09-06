import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { auditActionLabel, type AuditEntry } from "./types";

/** The last few things that happened to this receipt (spårbarhet). */
export function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-brand-600" aria-hidden /> Historik
        </CardTitle>
        <CardDescription>De senaste händelserna för kvittot. Allt loggas så att du kan visa vad som hänt.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-500">Inga händelser ännu.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-ink-200 pl-5">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-200" aria-hidden />
                <div className="text-sm font-medium text-ink-900">{auditActionLabel(entry.action)}</div>
                <time dateTime={entry.createdAt} className="text-xs text-ink-500">
                  {formatDateTime(entry.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
