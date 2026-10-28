"use client";

import * as React from "react";
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Send,
  ChevronDown,
} from "lucide-react";
import type { GroupDTO } from "@/lib/types";
import { SITE } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

/**
 * Share menu — comparte SIEMPRE la página del grupo en gruposhoy.com,
 * nunca el enlace directo chat.whatsapp.com: el tráfico pasa por el
 * directorio y quien recibe el enlace puede ver la ficha y unirse desde ahí.
 */
export function ShareMenu({
  group,
  children,
  iconOnly,
}: {
  group: GroupDTO;
  children?: React.ReactNode;
  /** Compact 44px round trigger (group detail sticky bar) — the wide
   *  "Compartir | ⌄" composite squeezed the Join button on small screens. */
  iconOnly?: boolean;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [canNativeShare, setCanNativeShare] = React.useState(false);

  // La URL que se copia/comparte en todos los canales es la página del grupo.
  const shareUrl = `${SITE.url}/grupo/${group.slug}`;

  // navigator.share solo existe en navegadores con hoja nativa (móvil/tablet);
  // se detecta tras el montaje para no romper la hidratación en SSR.
  React.useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  function trackShare(channel: string) {
    fetch("/api/groups/share?XTransformPort=3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id, channel }),
    }).catch(() => {});
  }

  function copyLink() {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        toast({
          title: "Enlace copiado",
          description:
            "Comparte la página del grupo — quien lo abra podrá unirse desde ahí.",
        });
        trackShare("copy");
      })
      .catch(() => toast({ title: "No se pudo copiar", variant: "destructive" }));
  }

  function nativeShare() {
    navigator
      .share({
        title: `${group.title} — Grupo de WhatsApp`,
        text: `Mira este grupo de WhatsApp: ${group.title}`,
        url: shareUrl,
      })
      .then(() => trackShare("native"))
      .catch(() => {
        /* el usuario canceló la hoja de compartir — sin error */
      });
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Mira este grupo de WhatsApp: ${group.title} — ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
    trackShare("whatsapp");
  }

  function shareX() {
    const text = encodeURIComponent(`Mira este grupo de WhatsApp: ${group.title}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener"
    );
    trackShare("x");
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(group.title)}`,
      "_blank",
      "noopener"
    );
    trackShare("telegram");
  }

  function shareEmail() {
    const subject = encodeURIComponent("Te comparto un grupo de WhatsApp");
    const body = encodeURIComponent(
      `Hola:\n\nTe comparto este grupo de WhatsApp: ${group.title}\n\nMíralo aquí (desde la página puedes unirse):\n${shareUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    trackShare("email");
  }

  const renderMenu = (withNativeShare: boolean) => (
    <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-1.5rem)]">
      {/* Hoja nativa del sistema (solo móvil) — primera opción cuando existe */}
      {withNativeShare && (
        <DropdownMenuItem onClick={nativeShare} className="gap-3 py-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            <Share2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Más apps</span>
            <span className="block truncate text-xs text-muted-foreground">
              Hoja de compartir del sistema
            </span>
          </span>
        </DropdownMenuItem>
      )}
      {/* Copiar enlace — primero y destacado */}
      <DropdownMenuItem onClick={copyLink} className="gap-3 py-2.5">
        <span
          aria-hidden
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-primary-foreground ${
            copied ? "bg-emerald-600" : "bg-primary"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {copied ? shareUrl : "La página del grupo, lista para pegar"}
          </span>
        </span>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1" />

      <DropdownMenuItem onClick={shareWhatsApp} className="gap-3 py-2.5">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-muted/50"
        >
          <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">WhatsApp</span>
          <span className="block text-xs text-muted-foreground">
            Se abre el chat con el enlace de la página
          </span>
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={shareX} className="gap-3 py-2.5">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-muted/50 text-sm font-bold"
        >
          𝕏
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">X (Twitter)</span>
          <span className="block text-xs text-muted-foreground">
            Publica el grupo en tu muro
          </span>
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={shareTelegram} className="gap-3 py-2.5">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-muted/50"
        >
          <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Telegram</span>
          <span className="block text-xs text-muted-foreground">
            Reenvíalo a tus chats y canales
          </span>
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={shareEmail} className="gap-3 py-2.5">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-muted/50"
        >
          <Mail className="h-4 w-4 text-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Correo electrónico</span>
          <span className="block text-xs text-muted-foreground">
            Asunto y enlace ya escritos
          </span>
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  // Trigger personalizado (patrón children): mantiene el dropdown completo.
  if (children) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        {renderMenu(false)}
      </DropdownMenu>
    );
  }

  // Icon-only compact trigger (barra sticky de la ficha): botón redondo de
  // 36px en móvil (uniforme con Unirse/Comparar/Favorito, owner directive
  // 2026-11-04), píldora etiquetada en ≥sm. El dropdown abre con la hoja
  // nativa del sistema como primera opción cuando el dispositivo la tiene.
  if (iconOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Compartir este grupo"
            title="Compartir este grupo"
            className="inline-flex min-h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96] sm:w-auto sm:px-3.5 sm:text-xs sm:font-semibold sm:text-foreground"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </DropdownMenuTrigger>
        {renderMenu(canNativeShare)}
      </DropdownMenu>
    );
  }

  // Con hoja nativa de compartir: el botón principal la usa directamente y
  // el chevron mantiene el dropdown con las redes concretas.
  if (canNativeShare) {
    return (
      <div className="flex min-h-11 flex-1 overflow-hidden rounded-xl border bg-background shadow-sm">
        <button
          type="button"
          onClick={nativeShare}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-accent active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" aria-hidden /> Compartir
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Compartir por una red concreta"
              title="Compartir por una red concreta"
              className="flex min-h-11 items-center justify-center border-l px-3 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          {renderMenu(false)}
        </DropdownMenu>
      </div>
    );
  }

  // Sin hoja nativa (escritorio): el botón abre el dropdown con las redes.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent">
          <Share2 className="h-4 w-4" aria-hidden /> Compartir
        </button>
      </DropdownMenuTrigger>
      {renderMenu(false)}
    </DropdownMenu>
  );
}
