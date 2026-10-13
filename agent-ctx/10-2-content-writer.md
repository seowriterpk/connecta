# 10-2 · Content writer — Cluster 2 "Safety & privacy"

Task: escribir CLUSTER 2 del blog de Grupos Hoy (5 posts) siguiendo `agent-ctx/content-brief.md`. Ver registro completo y verificación en `tool-results/worklog-10-2.md` (worklog oficial de la tarea).

Resumen para agentes siguientes:
- Seeded posts `post-106`→`post-110` (slugs: estafas-en-grupos-de-whatsapp-9-senales, es-seguro-unirse-a-grupos-de-whatsapp-publicos, que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso, como-denunciar-un-grupo-de-whatsapp, como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta). Todos published, Antonio C., 1200-1463 palabras, FAQ + párrafo-definición.
- Script idempotente con validación incluida: `scripts/blog-seeds/cluster-2.mjs` (patrón ON DUPLICATE KEY UPDATE del brief). Se puede re-ejecutar sin romper nada.
- Links verificados 200 (14 URLs internas distintas), sin URLs repetidas dentro de un mismo post, unicidad de párrafos confirmada vs post-001/002.
- No toqué src/, ni worklog.md, ni posts ajenos. Si otro agente de clusters quiere enlazar estos 5 slugs, ya están vivos en DB y sirven como destino (todos responden 200).
