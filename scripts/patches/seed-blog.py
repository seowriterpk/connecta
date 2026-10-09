#!/usr/bin/env python3
"""
Seed the first blog post (idempotent).
Run: python3 scripts/patches/seed-blog.py | mariadb -u root -S mysql-runtime/tmp/mysql.sock gruposwhatsapp
"""

POST = {
    "id": "post-001",
    "slug": "como-encontrar-grupos-de-whatsapp-seguros-2026",
    "title": "Cómo encontrar grupos de WhatsApp seguros en 2026: guía completa",
    "excerpt": "Aprende a identificar comunidades fiables de WhatsApp, evitar estafas y enlaces caducados, y unirte a grupos activos de tu país en pocos pasos. Guía práctica en español.",
    "cover_emoji": "🔍",
    "tags": '["whatsapp", "seguridad", "guías", "consejos"]',
    "author_name": "Equipo ConectaGrupos",
    "content": """## Por qué importa elegir bien el grupo

Unirse a un grupo de WhatsApp es de las cosas más fáciles del mundo: un clic en el enlace de invitación y ya estás dentro. Lo difícil es salir bien parado. En 2026 siguen circulando comunidades abandonadas, enlaces caducados y, en el peor de los casos, grupos usados para estafas o spam masivo.

Esta guía resume el método que usamos a diario en [ConectaGrupos](/) para revisar los grupos que publicamos: los mismos criterios que puedes aplicar tú antes de dar el salto.

## 1. Comprueba que el enlace está vivo

El primer filtro es el más obvio y el más ignorado: **el enlace de invitación debe funcionar**. WhatsApp muestra un aviso claro («Este enlace de invitación ya no es válido») cuando el grupo se llenó, el administrador revocó el enlace o el grupo se eliminó.

En nuestro directorio cada grupo pasa por una verificación periódica del enlace y verás el estado en la propia ficha. Si un enlace falla, puedes [reportar el grupo](/reportar-grupo) y lo revisamos.

## 2. Mira el tamaño, pero no te obsesiones

- **Grupos pequeños (menos de 50 miembros):** conversaciones cercanas, casi todo el mundo participa. Perfecto para temas locales o nichos.
- **Grupos medianos (50–256):** el punto dulce para la mayoría de temas: hay vida pero aún se puede seguir el hilo.
- **Grupos grandes (más de 256):** mucho movimiento y contenido, pero también más ruido. Activa silencios y revisa el historial antes de escribir.

## 3. Revisa la descripción y las normas

Un grupo cuidado casi siempre publica normas claras: qué se puede compartir, horarios, idioma y qué pasa si haces spam. Si la descripción es vaga o directamente no existe, alza una ceja. Los grupos del [directorio](/#grupos) incluyen descripción, categoría y país para que decidas con contexto.

## 4. Fíjate en la actividad reciente

No hay nada más frustrante que entrar a un grupo donde el último mensaje es de hace tres meses. Antes de unirte:

1. Busca la fecha del último mensaje visible.
2. Comprueba si el administrador participa.
3. Observa la proporción de enlaces: si el 90% de los mensajes son promociones, es spam con disfraz.

En [ConectaGrupos](/populares) marcamos los grupos con más movimiento reciente para que no pierdas el tiempo.

## 5. Cuida tu privacidad desde el primer día

Cuando entras a un grupo, tu número de teléfono es visible para todos los miembros. Algunos consejos rápidos:

- Usa la función de **WhatsApp Business** o un número secundario si vas a participar en muchos grupos públicos.
- Nunca compartas datos bancarios, contraseñas ni documentos personales en un grupo.
- Configura tu foto de perfil como visible «solo para mis contactos» si no quieres que extraños la vean.
- Si alguien te escribe en privado sin haber hablado antes en el grupo, desconfía: es el patrón clásico del estafador.

## 6. Aprovecha las categorías y los países

La forma más rápida de encontrar comunidades que valgan la pena es filtrar por tema y región. No es lo mismo un grupo de fútbol de tu ciudad que uno genérico internacional: los horarios, la jerga y las costumbres cambian.

Explora por [categorías](/categorias) (humor, tecnología, música, estudio…) o por [país](/paises) para dar con grupos donde la conversación encaja contigo.

## 7. Salir de un grupo no es un drama

Si el grupo no es lo que esperabas, salir es tan simple como pulsar «Salir del grupo» en la propia conversación. No se notifica a los demás miembros y no tienes que dar explicaciones. Si el contenido era inadecuado, además puedes reportarlo a WhatsApp desde el propio chat (Toque y mantener > Reportar).

## Resumen: checklist antes de unirte

- ✅ El enlace funciona y el grupo tiene miembros activos.
- ✅ La descripción explica el tema y las normas.
- ✅ El tamaño encaja con lo que buscas (íntimo, equilibrado o masivo).
- ✅ Es de tu país o tu zona horaria.
- ✅ No te piden datos personales para «entrar» (ningún grupo legítimo lo hace).

Si administras una comunidad y quieres que aparezca en el directorio, puedes [enviar tu grupo](/agregar-grupo) gratis: lo revisamos en menos de 24 horas y queda disponible para miles de hispanohablantes.

¡Feliz búsqueda!
""",
}


def sql_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main():
    c = POST
    print(f"""INSERT INTO `blog_posts`
  (`id`, `slug`, `title`, `excerpt`, `content`, `coverEmoji`, `tags`, `authorName`, `status`, `metaTitle`, `metaDescription`, `readingMinutes`, `views`, `publishedAt`)
VALUES
  ('{c["id"]}', '{sql_escape(c["slug"])}', '{sql_escape(c["title"])}', '{sql_escape(c["excerpt"])}',
   '{sql_escape(c["content"])}', '{c["cover_emoji"]}', '{c["tags"]}', '{sql_escape(c["author_name"])}',
   'published',
   '{sql_escape(c["title"])}',
   '{sql_escape(c["excerpt"])}',
   6, 0, NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `content` = VALUES(`content`), `excerpt` = VALUES(`excerpt`), `status` = 'published', `publishedAt` = NOW();
COMMIT;""")


if __name__ == "__main__":
    main()
