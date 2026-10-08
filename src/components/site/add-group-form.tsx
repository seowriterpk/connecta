"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Send, Link2, Tag, User, ShieldCheck, ShieldAlert } from "lucide-react";
import type { CategoryDTO, CountryDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { GroupImage } from "@/components/site/group-image";
import { CountryFlag } from "@/components/site/country-flag";

interface Props {
  categories: CategoryDTO[];
  countries: CountryDTO[];
}

const DESC_MIN = 20;
const DESC_MAX = 600;
// Code-point based limit (styled "𝐀𝐃𝐈𝐋" glyphs count once, not twice).
const NAME_MAX_CP = 120;

function cpLen(s: string): number {
  return [...s].length;
}

export function AddGroupForm({ categories, countries }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [csrfToken, setCsrfToken] = React.useState("");
  const [startedAt] = React.useState(Date.now());

  // Step 1 state
  const [inviteUrl, setInviteUrl] = React.useState("");
  const [fetchedName, setFetchedName] = React.useState("");
  const [fetchedImage, setFetchedImage] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [fetched, setFetched] = React.useState(false);

  // Step 2 state
  const [selectedCountry, setSelectedCountry] = React.useState<string>("");
  const [city, setCity] = React.useState("");
  const [countrySearch, setCountrySearch] = React.useState("");

  // Step 3 state
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [catSearch, setCatSearch] = React.useState("");
  // 18+ gate: adult categories stay hidden until the user flips this switch.
  // Without it, adult-group owners had nowhere to put their groups and would
  // submit them into clean categories (production directive: strict silo).
  const [showAdult, setShowAdult] = React.useState(false);
  // Adult categories are fetched ON DEMAND (only when the gate is flipped on)
  // from /api/categories?adult=only — pages keep passing clean-only props, so
  // adult taxonomy never renders in SSR/SEO surfaces.
  const [adultCats, setAdultCats] = React.useState<CategoryDTO[]>([]);
  const [adultCatsLoaded, setAdultCatsLoaded] = React.useState(false);

  async function handleAdultToggle(v: boolean) {
    setShowAdult(v);
    if (v && !adultCatsLoaded) {
      setAdultCatsLoaded(true);
      try {
        const res = await fetch("/api/categories?adult=only&XTransformPort=3000");
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) setAdultCats(json.data);
      } catch {
        setAdultCatsLoaded(false);
      }
    }
    // Turning the gate off un-selects any adult category so a clean group
    // can never be published as adult by accident.
    if (!v && selectedIsAdult) setSelectedCategory("");
  }

  // Step 4 state
  const [groupName, setGroupName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");

  // Step 5 state (publisher)
  const [publishAs, setPublishAs] = React.useState<"guest" | "profile">("guest");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Fetch CSRF on mount
  React.useEffect(() => {
    fetch("/api/groups/csrf-token?XTransformPort=3000")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCsrfToken(d.token); })
      .catch(() => {});
  }, []);

  // Prefill group name when fetched
  React.useEffect(() => {
    if (fetchedName && !groupName) setGroupName(fetchedName);
  }, [fetchedName, groupName]);

  // Filtered lists
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const cleanCategories = categories.filter((c) => !c.isAdult);
  // Merge (dedupe) any adult categories passed via props with the lazy-fetched
  // ones, so the gate works on pages that pass the full taxonomy too.
  const propAdults = categories.filter((c) => !!c.isAdult);
  const adultCategories = [
    ...propAdults,
    ...adultCats.filter((a) => !propAdults.some((p) => p.id === a.id)),
  ];
  const filteredCategories = cleanCategories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredAdultCategories = adultCategories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const selectedCat = categories.find((c) => c.id === selectedCategory) ?? adultCategories.find((c) => c.id === selectedCategory);
  const selectedIsAdult = !!selectedCat?.isAdult;


  // === STEP 1: Fetch invite ===
  async function verifyInvite() {
    setError(null);
    const url = inviteUrl.trim();
    if (!url.match(/^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]+/i)) {
      setError("Introduce un enlace válido de WhatsApp (chat.whatsapp.com/...)");
      return;
    }
    setLoading(true);
    setFetched(false);
    try {
      const res = await fetch("/api/groups/verify-invite?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "No se pudo verificar el enlace.");
      if (json.data.status === "revoked") {
        throw new Error("Este enlace está revocado o ha expirado. Usa un enlace activo.");
      }
      // Both "active" and "unknown" allow proceeding
      setFetchedName(json.data.groupName || "");
      setFetchedImage(json.data.imageUrl || "");
      setInviteCode(json.data.inviteCode || "");
      setFetched(true);
      if (json.data.warning) {
        toast({ title: "Aviso", description: json.data.warning });
      }
      // Don't auto-advance — show preview first, let user click Continuar
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // === STEP 4: Add tag ===
  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9áéíóúñ\s-]/g, "").trim();
    if (!t || tags.includes(t) || tags.length >= 6) return;
    setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  // === Submit ===
  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const elapsed = (Date.now() - startedAt) / 1000;
      if (elapsed < 3) {
        setError("Demasiado rápido. Tómate un momento para revisar los datos.");
        setSubmitting(false);
        return;
      }

      const body: Record<string, any> = {
        inviteUrl,
        inviteCode,
        groupName,
        description,
        categoryId: selectedCategory,
        countryId: selectedCountry,
        city: city || undefined,
        tags,
        csrfToken,
        startedAt,
        website_url: "", // honeypot
      };

      if (publishAs === "profile" && username && password) {
        body.contributorName = username;
        body.contributorPasskey = password;
      }

      const res = await fetch("/api/groups/submit-ugc?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "No se pudo enviar el grupo.");
      }

      // Handle different submission statuses
      if (json.status === "rejected") {
        toast({
          title: "Envío en revisión",
          description: "Tu grupo ha sido recibido. Nuestro equipo lo revisará antes de publicarlo.",
        });
        setTimeout(() => router.push("/"), 1500);
        return;
      }

      toast({
        title: "¡Grupo enviado!",
        description: json.message || "Tu grupo ha sido publicado o está en revisión.",
      });

      if (json.slug) {
        router.push(`/grupo/${json.slug}`);
      } else {
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // === Validation ===
  function canProceed(s: number): boolean {
    switch (s) {
      case 1: return fetched;
      case 2: return !!selectedCountry;
      case 3: return !!selectedCategory;
      case 4: return cpLen(groupName.trim()) >= 3 && description.trim().length >= DESC_MIN;
      case 5: return true;
      default: return false;
    }
  }

  const steps = [
    { num: 1, label: "Enlace" },
    { num: 2, label: "País" },
    { num: 3, label: "Categoría" },
    { num: 4, label: "Detalles" },
    { num: 5, label: "Publicar" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicators */}
      <div className="mb-8 flex items-center justify-between">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition ${
                step > s.num ? "bg-primary text-primary-foreground" :
                step === s.num ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </span>
              <span className={`text-xs font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${step > s.num ? "bg-primary" : "bg-muted"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Link */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Pega el enlace de tu grupo de WhatsApp</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                value={inviteUrl}
                onChange={(e) => setInviteUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="pl-10"
                autoComplete="off"
              />
            </div>
            <Button onClick={verifyInvite} disabled={loading} className="gap-2">
              <Loader2 className={`h-4 w-4 animate-spin ${loading ? "inline" : "hidden"}`} />
              <CheckCircle2 className={`h-4 w-4 ${loading ? "hidden" : "inline"}`} />
              Verificar
            </Button>
          </div>

          {/* Fetched preview */}
          {fetched && (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <GroupImage src={fetchedImage} alt={fetchedName || "Grupo de WhatsApp"} size={56} className="rounded-xl" fallbackEmoji="💬" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{fetchedName || "Grupo de WhatsApp (nombre no disponible)"}</div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> {fetchedImage ? "Imagen y nombre verificados" : "Enlace aceptado"}
                </div>
              </div>
            </div>
          )}

          {fetched && (
            <Button onClick={() => setStep(2)} className="w-full">
              Continuar
            </Button>
          )}
        </div>
      )}

      {/* STEP 2: Country */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Selecciona el país</h2>
          <Input
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Buscar país..."
            className="mb-2"
          />
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto cg-scroll">
            {filteredCountries.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  selectedCountry === c.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <CountryFlag code={c.code} name={c.name} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          {selectedCountry && (
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad (opcional)</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Madrid, Ciudad de México..."
                className="max-w-xs"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(3)} disabled={!selectedCountry} className="flex-1">Continuar</Button>
          </div>
        </div>
      )}

      {/* STEP 3: Category */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Selecciona la categoría</h2>

          {/* 18+ gate — adult categories hidden until the user opts in.
              Prevents adult groups landing in clean categories. */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/70 bg-rose-50/60 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/25">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 grid h-6 shrink-0 place-items-center rounded-md bg-rose-500/15 px-1.5 text-[11px] font-extrabold text-rose-600 dark:text-rose-400">18+</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Contenido para adultos</div>
                <div className="text-xs text-muted-foreground">Actívalo para publicar tu grupo en la zona 18+. Confirmas tener 18 años o más.</div>
              </div>
            </div>
            <Switch
              checked={showAdult}
              onCheckedChange={handleAdultToggle}
              aria-label="Mostrar categorías de contenido adulto (18+)"
              className="data-[state=checked]:bg-rose-500"
            />
          </div>

          <Input
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="mb-2"
          />

          {/* Clean categories */}
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto cg-scroll">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  selectedCategory === c.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          {/* Adult categories — only rendered when the 18+ gate is on */}
          {showAdult && (
            <div className="space-y-2 rounded-xl border border-rose-200/70 bg-rose-50/40 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" /> Categorías 18+ · zona para adultos
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredAdultCategories.length === 0 && (
                  <span className="text-xs text-muted-foreground">Cargando categorías 18+…</span>
                )}
                {filteredAdultCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                      selectedCategory === c.id
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                    <span className="grid h-4 place-items-center rounded bg-rose-500/20 px-1 text-[10px] font-extrabold">18+</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Los grupos 18+ se publican en una zona separada, no aparecen en el directorio público ni en Google, y solo son visibles para usuarios que activan el modo adulto.
              </p>
            </div>
          )}

          {selectedCategory && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              selectedIsAdult
                ? "border-rose-200 bg-rose-50/60 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300"
                : "border-primary/30 bg-primary/5 text-primary"
            }`}>
              {selectedIsAdult ? <ShieldAlert className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {selectedIsAdult
                ? "Tu grupo se publicará en la zona 18+ (contenido para adultos)."
                : `Categoría: ${selectedCat?.icon} ${selectedCat?.name}`}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={() => setStep(4)} disabled={!selectedCategory} className="flex-1">Continuar</Button>
          </div>
        </div>
      )}

      {/* STEP 4: Description + Tags (group name/image already fetched) */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Describe tu grupo</h2>

          {/* Fetched group card — show image + name, editable */}
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
            <GroupImage src={fetchedImage} alt={groupName} size={56} className="rounded-xl" fallbackEmoji="💬" />
            <div className="min-w-0 flex-1">
              <Input
                value={groupName}
                onChange={(e) => {
                  // Code-point clamp: styled glyphs (𝐀 = 2 UTF-16 units)
                  // must not hit the limit twice as fast as plain text.
                  const v = e.target.value;
                  if (cpLen(v) <= NAME_MAX_CP) setGroupName(v);
                }}
                className="border-0 bg-transparent px-0 text-base font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Nombre del grupo (se admite cualquier estilo: 𝐀𝐃𝐈𝐋, emojis, símbolos…)"
                maxLength={200}
              />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Verificado desde WhatsApp
                </span>
                <span className={`tabular-nums ${cpLen(groupName) > NAME_MAX_CP ? "text-destructive" : "text-muted-foreground"}`}>
                  {cpLen(groupName)}/{NAME_MAX_CP}
                </span>
              </div>
            </div>
          </div>

          {/* Description (mandatory) */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descripción * <span className="text-muted-foreground">({description.length}/{DESC_MAX})</span></Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
              placeholder={`Describe tu grupo: de qué trata, qué tipo de conversaciones hay, normas básicas... (mínimo ${DESC_MIN} caracteres)`}
              rows={4}
            />
            {description.length > 0 && description.length < DESC_MIN && (
              <p className="text-xs text-amber-600">Faltan {DESC_MIN - description.length} caracteres mínimo</p>
            )}
          </div>

          {/* Tags (optional) */}
          <div className="space-y-1.5">
            <Label>Etiquetas (opcional, máx. 6)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Ej: fútbol, memes, música..."
                className="flex-1"
                maxLength={30}
              />
              <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 6 || !tagInput.trim()}>
                <Tag className="h-4 w-4" /> Añadir
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs">
                    {t}
                    <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
            <Button onClick={() => setStep(5)} disabled={description.trim().length < DESC_MIN} className="flex-1">
              Continuar
            </Button>
          </div>
          {description.trim().length < DESC_MIN && (
            <p className="text-center text-xs text-muted-foreground">
              Escribe la descripción (mín. {DESC_MIN} caracteres) para continuar
            </p>
          )}
        </div>
      )}

      {/* STEP 5: Publisher */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Perfil del publicador</h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPublishAs("guest")}
              className={`rounded-xl border p-4 text-left transition ${publishAs === "guest" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="mt-2 font-semibold text-sm">Invitado</div>
              <div className="text-xs text-muted-foreground">Publicar anónimamente</div>
            </button>
            <button
              onClick={() => setPublishAs("profile")}
              className={`rounded-xl border p-4 text-left transition ${publishAs === "profile" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
            >
              <User className="h-5 w-5 text-primary" />
              <div className="mt-2 font-semibold text-sm">Crear perfil</div>
              <div className="text-xs text-muted-foreground">Guarda y rastrea tus grupos</div>
            </button>
          </div>

          {publishAs === "profile" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="uname">Nombre de usuario</Label>
                <Input
                  id="uname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  maxLength={40}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass">Contraseña</Label>
                <Input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Elige una contraseña"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="font-semibold">Resumen</div>
            {selectedIsAdult && (
              <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5" /> Se publicará en la zona 18+ (contenido para adultos)
              </div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Enlace:</span> <span className="truncate ml-2">{inviteUrl.slice(0, 40)}...</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Grupo:</span> <span className="truncate ml-2">{groupName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">País:</span> <span className="ml-2 inline-flex items-center gap-1.5">{(() => { const c = countries.find((x) => x.id === selectedCountry); return c ? <><CountryFlag code={c.code} name={c.name} /> {c.name}</> : "—"; })()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Categoría:</span> <span className="ml-2">{selectedCat?.icon} {selectedCat?.name}{selectedIsAdult ? " · 18+" : ""}</span></div>
            {city && <div className="flex justify-between"><span className="text-muted-foreground">Ciudad:</span> <span className="ml-2">{city}</span></div>}
            {tags.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Etiquetas:</span> <span className="ml-2">{tags.join(", ")}</span></div>}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(4)}>Atrás</Button>
            <Button onClick={submit} disabled={submitting} className="flex-1 gap-2">
              <Loader2 className={`h-4 w-4 animate-spin ${submitting ? "inline" : "hidden"}`} />
              <Send className={`h-4 w-4 ${submitting ? "hidden" : "inline"}`} />
              {submitting ? "Publicando..." : "🚀 Publicar grupo"}
            </Button>
          </div>
          <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Al publicar aceptas nuestras normas. No publiques contenido ilegal o spam.
          </p>
        </div>
      )}
    </div>
  );
}
