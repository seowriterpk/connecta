"use client";

/**
 * BlogEditorForm — create/edit form for blog posts.
 * - Title → slug auto-generation (editable).
 * - Markdown content with a lightweight preview toggle.
 * - Save as draft / publish. Delete for existing posts.
 * - All button text is wrapped in <span> (translation-extension crash guard).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Save, Send, Trash2, Loader2, ExternalLink, Eye, EyeOff, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { BlogPostDTO } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface Props {
  csrfToken: string;
  post: BlogPostDTO | null;
  postId: string | null;
}

function slugifyEs(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function BlogEditorForm({ csrfToken, post, postId }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [slug, setSlug] = React.useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(!!post?.slug);
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [content, setContent] = React.useState(
    post?.content ?? "## Introducción\n\nEscribe aquí tu artículo en Markdown…\n"
  );
  const [coverEmoji, setCoverEmoji] = React.useState(post?.coverEmoji ?? "📝");
  const [tagsRaw, setTagsRaw] = React.useState(post?.tags.join(", ") ?? "");
  const [authorName, setAuthorName] = React.useState(post?.authorName ?? "Equipo ConectaGrupos");
  const [metaTitle, setMetaTitle] = React.useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = React.useState(post?.metaDescription ?? "");
  const [status, setStatus] = React.useState<"draft" | "published">(post?.status ?? "draft");
  const [preview, setPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(words / 200));

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugifyEs(v));
  }

  async function save(nextStatus: "draft" | "published") {
    if (saving) return;
    if (title.trim().length < 3) {
      toast({ title: "El título es demasiado corto", variant: "destructive" });
      return;
    }
    if (content.trim().length < 50) {
      toast({ title: "El contenido debe tener al menos 50 caracteres", variant: "destructive" });
      return;
    }
    setSaving(true);
    setStatus(nextStatus);
    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugifyEs(title),
      excerpt: excerpt.trim(),
      content,
      coverEmoji: coverEmoji || "📝",
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 10),
      authorName: authorName.trim() || "Equipo ConectaGrupos",
      status: nextStatus,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      csrf: csrfToken,
    };
    try {
      const res = await fetch(
        postId ? `/api/admin/blog/${postId}?XTransformPort=3000` : "/api/admin/blog?XTransformPort=3000",
        {
          method: postId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json.ok) {
        toast({
          title: nextStatus === "published" ? "Entrada publicada" : "Borrador guardado",
          description: json.post.title,
        });
        if (!postId) {
          router.push(`/admin/blog/${json.post.id}`);
        } else {
          router.refresh();
          setSlug(json.post.slug);
        }
      } else {
        toast({ title: "Error", description: json.error ?? "No se pudo guardar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de red", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!postId || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/blog/${postId}?csrf=${encodeURIComponent(csrfToken)}&XTransformPort=3000`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.ok) {
        toast({ title: "Entrada eliminada" });
        router.push("/admin/blog");
      } else {
        toast({ title: "Error", description: json.error ?? "No se pudo eliminar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de red", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contenido</CardTitle>
            <CardDescription>
              Markdown admitido: encabezados (##), listas, negritas, enlaces y citas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="post-title">Título</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Ej.: Cómo encontrar grupos de WhatsApp seguros"
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-slug">Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">/blog/</span>
                <Input
                  id="post-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugifyEs(e.target.value));
                  }}
                  placeholder="como-encontrar-grupos-seguros"
                  maxLength={191}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-excerpt">Resumen (excerpt)</Label>
              <Textarea
                id="post-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Un párrafo corto que resume el artículo (se muestra en listados y meta description de respaldo)."
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="post-content">Contenido (Markdown)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview((p) => !p)}
                  className="h-8 gap-1.5 text-xs"
                >
                  {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{preview ? "Editar" : "Vista previa"}</span>
                </Button>
              </div>
              {preview ? (
                <div className="min-h-[320px] rounded-lg border bg-background p-4">
                  <div className="prose-cg text-sm">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <Textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="## Introducción…"
                  rows={16}
                  className="font-mono text-[13px]"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {words.toLocaleString("es-ES")} palabras · ~{readingMinutes} min de lectura
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar column */}
      <div className="space-y-4">
        <Card className="lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Publicación</CardTitle>
            <CardDescription>
              Estado actual:{" "}
              {status === "published" ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                  <span>Publicada</span>
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <span>Borrador</span>
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => save("published")}
              disabled={saving}
              className="w-full gap-1.5"
            >
              {saving && status === "published" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{postId ? "Guardar y publicar" : "Publicar ahora"}</span>
            </Button>
            <Button
              onClick={() => save("draft")}
              disabled={saving}
              variant="outline"
              className="w-full gap-1.5"
            >
              {saving && status === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Guardar borrador</span>
            </Button>
            {postId && post?.status === "published" && (
              <Button asChild variant="ghost" className="w-full gap-1.5 text-xs">
                <Link href={`/blog/${post.slug}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver publicada</span>
                </Link>
              </Button>
            )}

            {postId && (
              <div className="border-t pt-3">
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-destructive">
                      ¿Eliminar la entrada definitivamente?
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={remove} disabled={deleting} className="flex-1">
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        <span>Eliminar</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                        <span>Cancelar</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Eliminar entrada</span>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detalles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="post-emoji">Emoji de portada</Label>
                <Input
                  id="post-emoji"
                  value={coverEmoji}
                  onChange={(e) => setCoverEmoji(e.target.value)}
                  maxLength={8}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-author">Autor</Label>
                <Input
                  id="post-author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-tags">Etiquetas (separadas por comas)</Label>
              <Input
                id="post-tags"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="whatsapp, seguridad, guías"
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              SEO
            </CardTitle>
            <CardDescription>Opcional — si se deja vacío se usan título y resumen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="post-metattile">Meta título</Label>
              <Input
                id="post-metatitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">{metaTitle.length}/60 recomendado</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-metadesc">Meta descripción</Label>
              <Textarea
                id="post-metadesc"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{metaDescription.length}/160 recomendado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
