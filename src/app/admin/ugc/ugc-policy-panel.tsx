"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AdminSettings } from "@/lib/admin-settings";

interface Props {
  csrfToken: string;
  settings: AdminSettings;
}

/**
 * Publishing policy + limits, editable from the dashboard (Task 22).
 * Writes to admin_settings; the submit flow reads them with a 30s cache,
 * so changes take effect almost immediately without a rebuild.
 */
export function UgcPolicyPanel({ csrfToken, settings }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    autoPublishEnabled: settings.autoPublishEnabled,
    autoPublishScoreMin: String(settings.autoPublishScoreMin),
    reviewScoreMin: String(settings.reviewScoreMin),
    maxSubmissionsPerDeviceDay: String(settings.maxSubmissionsPerDeviceDay),
    maxSubmissionsPerIpDay: String(settings.maxSubmissionsPerIpDay),
    linkCheckBatchSize: String(settings.linkCheckBatchSize),
    imageBatchSize: String(settings.imageBatchSize),
    linkCheckCronBatch: String(settings.linkCheckCronBatch),
    dripFeedPerRun: String(settings.dripFeedPerRun),
  });

  // Resync when the server sends fresh settings (e.g. after router.refresh)
  React.useEffect(() => {
    setForm({
      autoPublishEnabled: settings.autoPublishEnabled,
      autoPublishScoreMin: String(settings.autoPublishScoreMin),
      reviewScoreMin: String(settings.reviewScoreMin),
      maxSubmissionsPerDeviceDay: String(settings.maxSubmissionsPerDeviceDay),
      maxSubmissionsPerIpDay: String(settings.maxSubmissionsPerIpDay),
      linkCheckBatchSize: String(settings.linkCheckBatchSize),
      imageBatchSize: String(settings.imageBatchSize),
      linkCheckCronBatch: String(settings.linkCheckCronBatch),
      dripFeedPerRun: String(settings.dripFeedPerRun),
    });
  }, [settings]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrf: csrfToken,
          settings: {
            autoPublishEnabled: form.autoPublishEnabled,
            autoPublishScoreMin: Number(form.autoPublishScoreMin),
            reviewScoreMin: Number(form.reviewScoreMin),
            maxSubmissionsPerDeviceDay: Number(form.maxSubmissionsPerDeviceDay),
            maxSubmissionsPerIpDay: Number(form.maxSubmissionsPerIpDay),
            linkCheckBatchSize: Number(form.linkCheckBatchSize),
            imageBatchSize: Number(form.imageBatchSize),
            linkCheckCronBatch: Number(form.linkCheckCronBatch),
            dripFeedPerRun: Number(form.dripFeedPerRun),
          },
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo guardar la política.");
        return;
      }
      toast.success("Política actualizada. Los cambios aplican en ≤30 s.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4" />
          Política de publicación
          <span
            className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              settings.autoPublishEnabled
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
          >
            {settings.autoPublishEnabled ? "AUTO ON" : "AUTO OFF"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Política de publicación y límites
          </DialogTitle>
          <DialogDescription>
            Se guarda en la base de datos y aplica a los nuevos envíos sin
            reconstruir nada. Los valores se validan contra límites seguros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Auto-publish */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Auto-publicación</h3>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <div className="text-sm font-medium">
                  Publicar automáticamente los envíos con score alto
                </div>
                <p className="text-xs text-muted-foreground">
                  Desactívalo para revisarlo TODO a mano aquí en la cola.
                </p>
              </div>
              <Switch
                checked={form.autoPublishEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, autoPublishEnabled: v }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-auto-min">
                  Score mínimo para auto-publicar (40–100)
                </Label>
                <Input
                  id="policy-auto-min"
                  type="number"
                  min={40}
                  max={100}
                  value={form.autoPublishScoreMin}
                  onChange={(e) => setForm((f) => ({ ...f, autoPublishScoreMin: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-review-min">
                  Score mínimo para cola de revisión (20–90)
                </Label>
                <Input
                  id="policy-review-min"
                  type="number"
                  min={20}
                  max={90}
                  value={form.reviewScoreMin}
                  onChange={(e) => setForm((f) => ({ ...f, reviewScoreMin: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Daily limits */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Límites diarios de envíos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-device-max">
                  Por dispositivo al día (1–200)
                </Label>
                <Input
                  id="policy-device-max"
                  type="number"
                  min={1}
                  max={200}
                  value={form.maxSubmissionsPerDeviceDay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxSubmissionsPerDeviceDay: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-ip-max">
                  Por IP al día (1–1000)
                </Label>
                <Input
                  id="policy-ip-max"
                  type="number"
                  min={1}
                  max={1000}
                  value={form.maxSubmissionsPerIpDay}
                  onChange={(e) => setForm((f) => ({ ...f, maxSubmissionsPerIpDay: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Bulk tools + crons */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Herramientas en masa y crons</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-link-batch">
                  Lote del comprobador de enlaces (5–100)
                </Label>
                <Input
                  id="policy-link-batch"
                  type="number"
                  min={5}
                  max={100}
                  value={form.linkCheckBatchSize}
                  onChange={(e) => setForm((f) => ({ ...f, linkCheckBatchSize: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-img-batch">
                  Lote de imágenes en masa (5–100)
                </Label>
                <Input
                  id="policy-img-batch"
                  type="number"
                  min={5}
                  max={100}
                  value={form.imageBatchSize}
                  onChange={(e) => setForm((f) => ({ ...f, imageBatchSize: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-cron-link">
                  Cron link-checker: filas por ejecución (20–2000)
                </Label>
                <Input
                  id="policy-cron-link"
                  type="number"
                  min={20}
                  max={2000}
                  value={form.linkCheckCronBatch}
                  onChange={(e) => setForm((f) => ({ ...f, linkCheckCronBatch: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="policy-drip">
                  Cron drip-feed: grupos por ejecución (1–100)
                </Label>
                <Input
                  id="policy-drip"
                  type="number"
                  min={1}
                  max={100}
                  value={form.dripFeedPerRun}
                  onChange={(e) => setForm((f) => ({ ...f, dripFeedPerRun: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Nota: los dos últimos valores son el tamaño por defecto que usan los
              crons si no lo cambias en sus comandos (<code>node scripts/crons/*.mjs</code>).
              El resto aplica al instante.
            </p>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={save}
            disabled={saving || num(form.autoPublishScoreMin) < num(form.reviewScoreMin)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar política
          </Button>
        </DialogFooter>
        {num(form.autoPublishScoreMin) < num(form.reviewScoreMin) && (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            El score de auto-publicar debe ser mayor o igual que el de revisión.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
