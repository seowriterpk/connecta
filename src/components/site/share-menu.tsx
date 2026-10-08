"use client";

import * as React from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import type { GroupDTO } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function ShareMenu({ group, children }: { group: GroupDTO; children?: React.ReactNode }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  function copyLink() {
    navigator.clipboard
      .writeText(group.inviteLink)
      .then(() => {
        setCopied(true);
        toast({ title: "Enlace copiado", description: "Pégalo en WhatsApp para unirte." });
        setTimeout(() => setCopied(false), 2000);
        trackShare();
      })
      .catch(() => toast({ title: "No se pudo copiar", variant: "destructive" }));
  }

  function trackShare() {
    fetch("/api/groups/share?XTransformPort=3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id }),
    }).catch(() => {});
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`¡Échale un ojo a este grupo de WhatsApp: ${group.title}!`);
    window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(group.inviteLink)}`, "_blank", "noopener");
    trackShare();
  }

  function shareX() {
    const text = encodeURIComponent(`Encuentra grupos de WhatsApp en español en ConectaGrupos`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(group.inviteLink)}`, "_blank", "noopener");
    trackShare();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <button className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent">
            <Share2 className="h-4 w-4" /> Compartir
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyLink} className="gap-2">
          <Check className={`h-4 w-4 text-emerald-600 ${copied ? "inline" : "hidden"}`} />
              <Copy className={`h-4 w-4 ${copied ? "hidden" : "inline"}`} />
          {copied ? "Copiado" : "Copiar enlace"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareWhatsApp} className="gap-2">
          <MessageCircle className="h-4 w-4 text-emerald-600" /> Compartir en WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareX} className="gap-2">
          <span className="grid h-4 w-4 place-items-center text-xs font-bold">𝕏</span>
          Compartir en X
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
