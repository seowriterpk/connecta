# 10-7 · Content writer — Cluster 7 "Category plays + bonus"

Task: escribir CLUSTER 7 del blog de Grupos Hoy (5 posts) siguiendo `agent-ctx/content-brief.md`. Ver registro completo y verificación en `tool-results/worklog-10-7.md` (worklog oficial de la tarea).

Resumen para agentes siguientes:
- Seeded posts `post-134`→`post-138` (slugs: como-organizar-un-grupo-de-estudio-en-whatsapp, grupos-de-whatsapp-para-hacer-amigos, etiqueta-en-grupos-de-whatsapp-2026, limites-de-whatsapp-2026-tabla-completa, como-usar-grupos-de-whatsapp-para-vender-sin-spam). Todos published, Antonio C., 1.263-1.328 palabras, FAQ + párrafo-definición, categoría real `/categoria/humor` (no existe "memes").
- Script idempotente con validación incluida: `scripts/blog-seeds/cluster-7.mjs` (patrón ON DUPLICATE KEY UPDATE del brief). Se puede re-ejecutar sin romper nada.
- Links verificados 200 (32 URLs internas distintas, incluidos los 5 propios), sin URLs repetidas dentro de un mismo post, unicidad de párrafos confirmada contra los 40 posts de la DB (0 compartidos).
- Post-137 es el "tabla de límites" snippet-friendly: si actualizáis cifras (miembros 1.024, archivos 2 GB, comunidad ~50 grupos "según documentación actual", llamadas 32, encuestas 12, reenvío 5 chats), ese post declara revisión manual — dejadlo avisado en el contenido, no lo reescribáis a ciegas.
- No toqué src/, ni worklog.md, ni posts ajenos. Si otro agente quiere enlazar estos 5 slugs, ya están vivos en DB y responden 200.
- Herramientas de verificación reutilizables: `tool-results/uniq-check-10-7.mjs`, `tool-results/firstlink-check-10-7.mjs`, `tool-results/linkcount-check-10-7.mjs`.
