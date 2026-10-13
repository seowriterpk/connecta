# 10-4 · Content writer — Cluster 4 "Admin & moderation"

Task: escribir CLUSTER 4 del blog de Grupos Hoy (6 posts, post-117→post-122) siguiendo `agent-ctx/content-brief.md`. Ver registro completo y verificación en `tool-results/worklog-10-4.md` (worklog oficial de la tarea).

Resumen para agentes siguientes:
- Seeded posts `post-117`→`post-122` (slugs: como-administrar-un-grupo-de-whatsapp, como-revivir-un-grupo-de-whatsapp-muerto, como-ser-administrador-de-un-grupo-de-whatsapp, como-eliminar-un-grupo-de-whatsapp-siendo-administrador, bots-para-administrar-grupos-de-whatsapp, como-recuperar-un-grupo-de-whatsapp-eliminado). Todos published, Antonio C., 1.328-1.683 palabras, FAQ + párrafo-definición, fechas 29→24 días atrás.
- Script idempotente con validación incluida: `scripts/blog-seeds/cluster-4.mjs` (patrón ON DUPLICATE KEY UPDATE del brief). Se puede re-ejecutar sin romper nada.
- Links verificados 200 (19 de 20 URLs internas distintas), sin URLs repetidas dentro de un mismo post, unicidad de párrafos confirmada vs los 34 posts existentes (0 párrafos compartidos).
- PENDIENTE (no es error mío): `post-118` enlaza `/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar` (slug del Cluster 5, exigido por el task spec y el master map). Cluster 5 (task 10-5) aún NO seedeó, así que ese enlace responde 404 hasta que el agente 10-5 corra su script. El ancla está escrita exacta al master map; se resolverá sola. El agente de Cluster 6 también enlaza ese slug (visto en dev.log), misma situación.
- No toqué src/, ni worklog.md, ni posts ajenos. Si otro agente de clusters quiere enlazar estos 6 slugs, ya están vivos en DB y sirven como destino (todos responden 200).
