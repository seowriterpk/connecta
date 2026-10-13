# Worklog 10-7 — Cluster 7 "Category plays + bonus"

## Task ID
10-7

## Agent
Content writer — Cluster 7 (category plays + bonus posts)

## Task
Escribir CLUSTER 7 del blog de Grupos Hoy (5 posts, post-134→post-138) siguiendo `agent-ctx/content-brief.md` EXACTAMENTE: seed script `scripts/blog-seeds/cluster-7.mjs`, convenciones de `blog_posts`, voz fácil en español, FAQ final, párrafo-definición, 1.200-2.000 palabras, Antonio C., verificación por curl, worklog propio. Nunca tocar `src/` ni `worklog.md`.

## Work Log

### 1. Preparación
- Leí `agent-ctx/content-brief.md` completo + registros de agentes previos (`agent-ctx/10-2-content-writer.md`, patrón de `scripts/blog-seeds/cluster-2.mjs`).
- Consulté la DB (mariadb runtime): categorías reales (`educacion`, `amistad`, `humor`, `compraventa`, `negocios` — NO existe `memes`, la real es `humor`, tal como avisaba la tarea), grupos live por categoría (UBA, UNAM, mate porteño, memes argentinos, e-commerce Colombia…), y posts existentes.
- Curl-pre-verifiqué todos los destinos de enlace antes de escribir. Detecté que el slug real de cluster-3 es `/blog/crear-grupo-de-whatsapp-sin-agregar-contactos` (sin "como-", el master-map manda) → usado el correcto en post-138.

### 2. Contenido creado (script idempotente, ON DUPLICATE KEY UPDATE del brief)
| Post | Slug | daysAgo | Palabras | metaDesc | Enlaces |
|---|---|---|---|---|---|
| post-134 | como-organizar-un-grupo-de-estudio-en-whatsapp | 9 | 1.318 | 146 | 7 int + 1 ext |
| post-135 | grupos-de-whatsapp-para-hacer-amigos | 8 | 1.328 | 142 | 8 int + 1 ext |
| post-136 | etiqueta-en-grupos-de-whatsapp-2026 | 7 | 1.272 | 150 | 7 int + 1 ext |
| post-137 | limites-de-whatsapp-2026-tabla-completa | 6 | 1.265 | 147 | 8 int + 2 ext |
| post-138 | como-usar-grupos-de-whatsapp-para-vender-sin-spam | 5 | 1.263 | 143 | 7 int + 1 ext |

Ángulos cubiertos según la tarea:
- **post-134**: el playbook completo (normas con horario, roles con tabla, notas en nube tipo Drive, calendario de repasos 7/3 días, sprints de examen con encuestas y llamada de 32, silenciar sin culpa). Link temprano a `/categoria/educacion` (palabra ~64) + `/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar` (cluster 5).
- **post-135**: cómo evaluar antes de entrar (tamaño 15-60, ritmo, reglas, sin datos) + tabla verde/roja + banderas rojas (dinero, "romance", cadenas) + el primer mensaje con ejemplo literal de Ana. Link temprano a `/categoria/amistad` (palabra ~68) + `/ciudad/buenos-aires` + `/blog/es-seguro-unirse-a-grupos-de-whatsapp-publicos`.
- **post-136**: guía de etiqueta con humor (audio de 7 min, buen día 🌹, cadena "reenvía a 10", spoiler del partido, "jaja" suelto, stickers de madrugada, fuera de tema) + tabla de veredictos 2026. Usa la categoría REAL `/categoria/humor` (no /categoria/memes) + `/blog/como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta`.
- **post-137**: LA tabla de límites (8 filas, cada una con su nota "según versión/plataforma"): grupo 1.024 · archivos 2 GB (según plataforma) · comunidad ~50 grupos ("según la documentación actual") · canales sin tope · llamadas 32 · encuestas 12 · descripción ~500 (521 clásicos) · reenvío 5 chats. Sección "por qué WhatsApp limita" (estabilidad/spam/UX) + aviso de revisión (octubre 2026) + por qué 1.024 = 2^10. Link a post-130 (`/blog/grupo-vs-comunidad-vs-canal-de-whatsapp`) + externos whitelist (faq.whatsapp.com, whatsapp.com/community).
- **post-138**: guía para el dueño de negocio (grupo de clientes con QR en el mostrador, catálogo de WhatsApp Business, formato producto+precio+hasta cuándo con tabla, frecuencia 2-3/semana con calendario, permiso siempre, no añadir sin aviso) + "por qué el spam te sale caro" (ético: todos lo sufren, denuncias, límite de reenvíos). Feeds `/categoria/compraventa` + `/categoria/negocios` en las primeras 150 palabras + `/grupo/e-commerce-y-dropshipping-colombia` + externo `https://www.whatsapp.com/business`.

Extras de cumplimiento del brief: intro 2-3 párrafos con promesa; párrafo-definición 40-55 palabras tras la intro; H2/H3; numerados; tablas; **negritas**; FAQ final 4-5 preguntas (136 y 135 llevan 5); español fácil con toques regionales puntuales (un "órale", un "che", el mate, el asado); cifras reales con hedging donde toca; tags planos; coverEmoji 1 por post; views=0; metaTitle NULL.

### 3. Ajustes durante la verificación
- Primera corrida: 4 posts bajo 1.200 palabras → amplié con secciones útiles (afición vs ciudad, el fantasma del grupo, responder a todos o a uno, fuera de tema, paso 6 "mide sin complicarte", FAQ extra grupo vs lista de difusión) → todos quedaron 1.263-1.328.
- post-137 no tenía enlace interno en las primeras 150 palabras → añadí "En [Grupos Hoy](/) escribimos guías como esta…" en el párrafo 2 (palabra ~48).
- Conté enlaces reales: 135 y 137 tenían 9 internos (máx. del brief: 8) → recorté el segundo enlace de ciudad (CDMX como texto plano) y el enlace redundante al post de crear grupo en 137 → 7-8 internos por post, sin URLs repetidas dentro de cada post.

### 4. Verificación (curl only, sin agent-browser)
1. `node scripts/blog-seeds/cluster-7.mjs` corre limpio, idempotente, con validación de palabras/metaDesc por post (0 warnings). Corrido 4 veces sin errores.
2. Los 5 posts responden **200** y contienen `<title>` correcto, el `<h1>` con el título exacto, `Antonio C.` y decenas de hrefs internos (template + contenido).
3. **32 URLs internas distintas** enlazadas (incluidos mis propios 5 posts) → todas **200**, cero 404. Los destinos de cluster 5/6 (reglas-para-grupos…, grupo-vs-comunidad…, como-crear-una-comunidad…, como-crear-un-canal…, reglas-grupos-de-whatsapp-trabajo-y-ventas) empezaron en 404 porque los agentes paralelos aún no seedeaban; hice polling y quedaron vivos antes del cierre (cluster 6 ~min 3, cluster 5 ~min 15).
4. Externos: solo whitelist (faq.whatsapp.com ×4, whatsapp.com/community, whatsapp.com/business) — verificados en el HTML renderizado.
5. Unicidad: script `tool-results/uniq-check-10-7.mjs` compara párrafos ≥80 chars normalizados contra los 40 posts de la DB → **0 párrafos compartidos**.
6. Primer enlace interno por post: palabra 55/59/52/48/84 → todos dentro de las primeras 150 palabras (`tool-results/firstlink-check-10-7.mjs`).
7. `dev.log` final: solo GET 200 de mis verificaciones; los warnings mysql2 viejos son de otro módulo (yo uso `mysql2/promise` en proceso aparte).
8. Evidencia extra: `tool-results/linkcount-check-10-7.mjs` (7-8 internos, 1-2 externos, sin duplicados por post).

## Stage Summary
CLUSTER 7 completo y verificado: 5 posts (post-134→post-138) publicados, firmados por Antonio C., 1.263-1.328 palabras, con FAQ y párrafo-definición, jugo de enlaces dentro de rango (7-8 internos + 1-2 externos whitelist, primer enlace temprano, cero 404 en las 32 URLs internas), unicidad confirmada contra toda la DB. Script `scripts/blog-seeds/cluster-7.mjs` idempotente y re-ejecutable. No toqué `src/`, ni `worklog.md`, ni posts de otros clusters. El mapa de enlaces cruzados queda: 134↔reglas(cluster5), 135↔es-seguro/estafas/que-nadie(cluster2)+agregar-grupo, 136↔salir-del-grupo(cluster2)+moderar(post-002)+reglas(cluster5), 137↔comunidad/canal(cluster6)+134+136, 138↔crear-sin-contactos(cluster3)+denunciar(cluster2)+reglas-ventas(cluster5).
