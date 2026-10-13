// Cluster 6 — Communities & channels (posts 129-133) — Task 10-6
// Seed script per shared brief conventions. Idempotent (ON DUPLICATE KEY UPDATE).
import mysql from "mysql2/promise";

const posts = [
  {
    id: "post-129",
    slug: "comunidad-de-whatsapp-que-es-y-para-que-sirve",
    title: "Comunidad de WhatsApp: qué es, para qué sirve y cómo funciona",
    excerpt:
      "Las comunidades de WhatsApp agrupan varios grupos bajo un mismo techo. Te lo explico con un club de barrio real: qué ve cada socio, quién puede crearlas y cómo entrar y salir.",
    coverEmoji: "🏘️",
    tags: JSON.stringify(["whatsapp", "comunidades", "grupos", "guia"]),
    metaDescription:
      "Qué es una comunidad de WhatsApp, para qué sirve y cómo funciona, con un ejemplo real de club, quién puede crearla y cómo entrar y salir sin líos.",
    daysAgo: 15,
    content: `Un club de barrio con tres grupos de WhatsApp suena a orden. En la práctica era un desfile: el partido se anunciaba en un grupo, la cuota en otro y la lluvia suspendía todo en los tres a la vez.

—Che, ¿dónde se jugaba el sábado? —preguntaba un socio en tres chats distintos. Nadie sabía en cuál contestar. El club terminó hartándose y armó una comunidad. Cada cosa quedó en su sala y el lío se acabó.

Aquí vas a ver qué es una comunidad de WhatsApp, para qué sirve y cómo funciona por dentro. Lo recorremos con un club real, socio por socio. También verás quién puede crear una, cómo entrar y cómo salir. Y si lo tuyo es jugar y no administrar, la categoría de [grupos de fútbol en español](/categoria/deportes) sigue siendo tu cancha.

**Una comunidad de WhatsApp** es un conjunto de grupos reunidos bajo un mismo techo. Incluye un grupo de anuncios, donde solo escriben los administradores, y varios grupos de temas relacionados. Cada miembro elige a cuáles unirse, y un administrador controla la estructura.

## El ejemplo real: un club con 70 socios

El Club Social del barrio tenía 70 socios y tres líos crónicos. Los avisos se repetían en todos los grupos. La gente se perdía los partidos. Y la cuota se pagaba tarde porque el recordatorio se ahogaba entre memes.

Con una comunidad lo ordenaron así:

- **Anuncios del club.** El grupo oficial donde solo escriben los administradores: partidos, asambleas, cortes de cancha. Los 70 socios están ahí, sí o sí.
- **Fútbol sábado.** Donde se arma el equipo de cada fin de semana. Escribe todo el que juega.
- **Cuota y finanzas.** Pagos, vencimientos y el resumen mensual del tesorero.

Cada sala funciona como un grupo normal: tiene sus administradores, su descripción y su chat aparte en tu lista. La diferencia es que las tres viven dentro de la misma comunidad, con el mismo nombre arriba y una sola puerta de entrada.

### Cómo quedó el día a día

Marta, la del kiosco, solo participa en Anuncios: quiere el horario y nada más. Diego está en Anuncios y en Fútbol sábado. La tesorera entra a los tres. Nadie recibe mensajes que no le sirven y nadie reenvía nada dos veces.

El mismo truco funciona para escuelas, edificios y peñas. Si administras algo con ramas, esta herramienta es para ti.

## Qué ve cada miembro por dentro

Al entrar a una comunidad, en la mayoría de las versiones actuales, pasa esto:

1. Caes directo al **grupo de anuncios**. Lees las reglas y los avisos, pero no escribes.
2. Abres la información de la comunidad y ves la **lista de grupos internos**, con nombre y descripción.
3. Entras donde quieras con el botón **Unirme al grupo**. Un toque y listo.
4. Cada subgrupo aparece como un chat aparte en tu lista. Los silencias por separado, como cualquier grupo.

Un detalle honesto: al unirte a un subgrupo, sus miembros ven tu número, igual que en cualquier grupo. Si eso te preocupa, pasa antes por la guía de [qué ven los desconocidos cuando entras a un grupo](/guias/es-seguro-unirse-a-grupos-de-whatsapp-publicos) y ajusta tu privacidad.

Otra cosa que conviene saber: los avisos del grupo de anuncios no se pueden responder. En versiones recientes la gente puede reaccionar con emojis, pero la conversa va en los subgrupos.

## Una comunidad, un solo enlace

Antes, el club tenía un enlace de invitación por grupo. Si el administrador restablecía uno, la mitad de la gente se quedaba fuera sin enterarse.

Con la comunidad eso se termina: hay **un enlace único** para toda la estructura. Quien lo abre ve la pantalla de entrada con el nombre, la descripción y las salas. Si un administrador restablece ese enlace, el viejo muere y nace uno nuevo, igual que en los grupos.

Ese enlace único es oro para pegarlo en el cartel del club, mandarlo por correo o compartirlo en tu estado. Uno solo, para todo el mundo.

## El grupo de anuncios: el altavoz central

Es la pieza que hace funcionar el invento. Ahí publican solo los administradores y leen todos los demás. Es, en la práctica, un [grupo de WhatsApp en modo solo lectura](/guias/grupo-de-whatsapp-solo-lectura), pero incluido de fábrica.

¿Por qué importa tanto? Porque la mayoría de la gente no quiere chatear: quiere enterarse. Con el altavoz central, el aviso del partido llega sin competencia de cadenas ni bromas. Y el que sí quiere charla, se mete al subgrupo que le toque.

Regla práctica para administradores: el grupo de anuncios se usa poco y se usa bien. Dos o tres mensajes por semana, claros y directos. Si lo conviertes en megáfono de todo, la gente lo silencia y adiós comunidad.

## Para qué sirve (y para qué no)

Una comunidad brilla cuando hay **un tema grande con ramas claras**:

- Clubes y peñas: avisos, equipo y finanzas.
- Escuelas y colegios: dirección, cursos y excursiones.
- Edificios y barrios: administración, eventos y reclamos.
- Eventos puntuales: bodas, torneos, retiros.
- Tiendas con clientela: novedades, pedidos y retiros.

No sirve, en cambio, cuando:

- El tema es uno y la charla es una sola: basta un grupo.
- Es tu familia: una comunidad para «¿quién lleva el postre?» es matar moscas a cañonazos.
- Solo quieres anunciar a gente que no se conoce: para eso está el canal, y en la [comparativa de grupo, comunidad y canal](/guias/grupo-vs-comunidad-vs-canal-de-whatsapp) lo ves en una tabla.

La pregunta clave es simple: ¿tu gente necesita elegir qué leer? Si sí, comunidad. Si todos leen todo, grupo.

## Quién puede crear una comunidad

Hasta hoy, las condiciones son estas:

- Se crea desde la **app personal de WhatsApp**, en Android o iPhone. La creación se hace desde el móvil; en el WhatsApp de escritorio no siempre está disponible, según la versión.
- Cualquier persona con cuenta activa puede hacerlo. No hay que verificar nada ni pagar nada. Es función oficial: WhatsApp la explica en su [página sobre comunidades](https://www.whatsapp.com/community).
- **No se crea desde WhatsApp Business.** Esa app es otra cosa y hoy no trae el botón. Te desarmo ese mito entero en [comunidades y WhatsApp Business: mito resuelto](/guias/comunidad-de-whatsapp-business-mito-resuelto).

Un caso típico: administras un grupo grande y desordenado, del estilo de [La Mesa de Debate de fútbol argentino](/grupo/futbol-argentino-la-mesa-de-debate), y ya no sabes dónde empieza cada tema. Ese es el momento de dar el salto. El procedimiento completo está en la guía de [cómo crear una comunidad en WhatsApp](/guias/como-crear-una-comunidad-en-whatsapp).

## Cómo entrar (si te invitan)

Entrar toma menos de un minuto:

1. Abre el **enlace de la comunidad** que te compartieron.
2. Revisa la pantalla previa: nombre, descripción y salas internas.
3. Toca **Unirme a la comunidad**. Caes al grupo de anuncios.
4. Entra a la info y únete a los subgrupos que te sirvan.

No hay aprobación de nadie: el enlace te deja entrar solo, mientras siga vigente. Si te dice que no está disponible, avísale al administrador para que revise el enlace.

## Cómo salir sin dejar ruido

- Para **un subgrupo**: sales como de cualquier grupo. Solo los administradores de ese grupo lo notan, y entre ellos, según la versión.
- Para **toda la comunidad**: abre la info de la comunidad y toca **Salir de la comunidad**. Te saca de todos los grupos internos de una vez. En la mayoría de las versiones, si sales del grupo de anuncios, WhatsApp te pregunta si quieres dejar la comunidad entera.

Salir no bloquea nada. Si te arrepientes y el enlace sigue vigente, vuelves a entrar igual que la primera vez.

## Lo que sigue

Ya sabes qué es una comunidad, para qué sirve y cómo funciona. Si vas a administrar una, ya viste dónde está la guía de creación con su plan de lanzamiento. Si solo quieres participar y descubrir grupos por tema, las [guías del sitio](/guias) y el buscador te esperan.

## Preguntas frecuentes

### ¿Una comunidad cuesta dinero?

No. Es gratis, igual que los grupos y los canales. No hay suscripción ni límite de tiempo.

### ¿Cuántos grupos puede tener una comunidad?

Según la versión, varias decenas. Cada grupo interno mantiene su límite de 1.024 miembros. Los números exactos cambian con las actualizaciones, así que tómalos como referencia.

### ¿Puedo quedarme solo en el grupo de anuncios?

Sí. En la mayoría de las versiones entras ahí de forma automática y puedes no unirte a ningún subgrupo. Siléncialo y lee cuando quieras.

### ¿Los administradores de la comunidad ven mi número?

Los miembros de cada subgrupo al que entres lo ven, como en cualquier grupo. Si no compartes subgrupo con alguien, no tiene por qué verlo. Repasa tus ajustes de privacidad si te importa.

### ¿Es lo mismo que un canal?

No. El canal es de una sola vía y pensado para seguidores que no se conocen. La comunidad es de ida y vuelta, para gente con algo en común y temas por separado.`,
  },
  {
    id: "post-130",
    slug: "grupo-vs-comunidad-vs-canal-de-whatsapp",
    title:
      "Grupo vs. comunidad vs. canal de WhatsApp: diferencias y cuándo usar cada uno",
    excerpt:
      "Grupo, comunidad y canal de WhatsApp no son lo mismo. Tabla comparativa definitiva (miembros, quién escribe, quién ve tu número) y 4 escenarios para saber cuál necesitas tú.",
    coverEmoji: "🆚",
    tags: JSON.stringify(["whatsapp", "grupos", "comunidades", "canales"]),
    metaDescription:
      "No, comunidad y grupo de WhatsApp no son lo mismo: tabla comparativa con miembros, quién escribe y quién ve tu número, más 4 escenarios para decidir.",
    daysAgo: 14,
    content: `—¿Comunidad y grupo de WhatsApp no son lo mismo? —No. Y la confusión tiene culpable conocido: el nombre. WhatsApp tomó una palabra de todos los días y le dio un sentido técnico.

Te habrá pasado. La mamá del colegio dice «te paso el grupo» y te manda una comunidad. La tienda del barrio dice «únete a mi grupo de ofertas» y es un canal. Los [grupos de memes](/categoria/humor) que compartes con tus amigos son, al menos, grupos de verdad.

Aquí va la tabla comparativa definitiva entre grupo, comunidad y canal. Después, una guía de decisión con cuatro escenarios reales. Vale: al final vas a saber cuál necesitas tú, sin mareos.

Un **grupo de WhatsApp** es una conversación entre iguales: todos escriben. Una **comunidad** reúne varios grupos bajo un mismo techo y la controlan administradores. Un **canal** es una emisión de una sola vía: el dueño publica y el resto solo lee. Tres herramientas, tres usos.

## La tabla comparativa definitiva

| Qué comparas | Grupo | Comunidad | Canal |
|---|---|---|---|
| Qué es | Una sola conversación | Varios grupos bajo un techo común | Emisión en una sola dirección |
| Límite de gente | 1.024 miembros | Varios grupos, cada uno con hasta 1.024 | Seguidores sin límite conocido |
| Quién escribe | Todos, salvo ajuste de admins | En anuncios, solo admins; en salas, sus miembros | Solo el administrador y sus editores |
| Quién ve tu número | Todos los del grupo | Los de cada sala a la que entres | Nadie: los seguidores no lo ven |
| Cómo se entra | Enlace, QR o te agrega un admin | Enlace de la comunidad y luego eliges salas | Enlace, QR o el buscador de canales |
| Para qué sirve | Charlar entre iguales | Organizar un tema con ramas | Anunciar a seguidores |

Los detalles finos cambian según la versión de la app. La estructura de la tabla es la estable: quiénes escriben, quién te ve y para qué sirve cada pieza. WhatsApp describe cada una en su [página de comunidades](https://www.whatsapp.com/community) y en la de [canales](https://www.whatsapp.com/channel).

## Grupo: la charla entre iguales

El clásico. Un solo chat, todos escriben, límite de 1.024 miembros. El enlace de invitación se puede restablecer cuando se compromete, y también se entra escaneando el código QR del grupo.

Sus virtudes son sus defectos: la misma libertad para escribir convierte cualquier grupo grande en una olla de ruido. Por eso los administradores tienen herramientas para poner orden: fijar mensajes, cerrar el envío a todos y dejar el grupo como [solo lectura para que únicamente escriba el admin](/guias/grupo-de-whatsapp-solo-lectura).

Si vas a crear el tuyo, empieza por la [guía completa para crear un grupo de WhatsApp](/guias/como-crear-un-grupo-de-whatsapp-guia-completa): pasos, ajustes y errores de novato.

## Comunidad: el edificio con salas

Una comunidad es un grupo de grupos. Hay un grupo de anuncios donde solo publican los administradores y varias salas de tema. Cada persona elige a cuáles entrar y silencia el resto.

Es la herramienta de los clubes, las escuelas y los barrios: mucha gente, temas distintos y necesidad de que cada uno lea solo lo suyo. El caso de un club de barrio, contado socio por socio, está en [qué es una comunidad de WhatsApp y para qué sirve](/guias/comunidad-de-whatsapp-que-es-y-para-que-sirve).

Su costo: exige administración. Alguien tiene que mantener las salas ordenadas y el altavoz central limpio. Sin organizador, una comunidad se llena de salas muertas y gente confundida.

## Canal: el altavoz

Un canal es una emisora. El administrador publica y los seguidores leen. Sin comentarios, sin respuestas y sin que nadie vea el número de nadie.

No hay límite conocido de seguidores, y la gente puede encontrarte desde el buscador de canales de la propia app, según la versión. Es la pieza para anunciar resultados, ofertas, novedades o avisos del día a desconocidos que no necesitan hablar entre sí.

Si vas a lanzar el tuyo, sigue la guía de [cómo crear un canal de WhatsApp y conseguir los primeros seguidores](/guias/como-crear-un-canal-de-whatsapp).

## ¿Cuál necesitas? Cuatro escenarios

### Escenario 1: la familia o los amigos

Tema único, poca gente, todos se conocen. **Grupo.** Una comunidad para organizar un asado sería demasiado aparato, y un canal no deja conversar. Aquí manda la charla libre.

### Escenario 2: el club, la escuela o los vecinos

Mucha gente, temas con ramas, cada quien necesita información distinta. **Comunidad.** Anuncios para todos y salas para cada interés. Si arrancas de cero, ten a mano el [paso a paso para crear una comunidad](/guias/como-crear-una-comunidad-en-whatsapp), que incluye el plan de lanzamiento.

### Escenario 3: anunciar a seguidores

Quieres que gente desconocida reciba tus avisos sin poder responderte. **Canal.** Partidos, ofertas, novedades de tu negocio o avisos del día. Tu número queda a salvo y no hay límite conocido de seguidores.

### Escenario 4: la tienda que atiende y anuncia

Necesitas las dos cosas: responder consultas de clientes y avisar ofertas sin repetir el mensaje cien veces. **Grupo + canal**, o comunidad si tu clientela se divide por zona o por producto. En la categoría de [grupos de negocios](/categoria/negocios) hay ejemplos vivos de cada modelo.

## Cuando conviene mezclarlos

Las tres piezas se alimentan entre sí:

- El **canal** anuncia y lleva la gente al grupo donde se conversa.
- El **grupo** charla y en su descripción lleva el enlace del canal para quien solo quiere avisos.
- La **comunidad** ordena los grupos por tema y usa su grupo de anuncios para difundir el canal.

El embudo completo funciona así: el canal capta, el grupo conversa, la comunidad ordena. Cada pieza hace una sola cosa y la hace bien.

## Errores de elección comunes

- Usar un canal para dar soporte: nadie puede responderte ahí.
- Crear una comunidad para la familia: demasiado aparato para un solo tema.
- Meter a 900 personas en un grupo para solo anunciar: el ruido tapa el aviso.
- Hacer tres grupos sueltos donde una comunidad haría el trabajo: la gente se cansa de enlaces por separado.

La regla de oro: cuanta más variedad de lectores tengas, más estructura necesitas. Y si todavía dudas, las [guías del sitio](/guias) cubren cada pieza por separado.

## Preguntas frecuentes

### ¿Puedo convertir mi grupo en comunidad?

Sí, a medias. Al crear la comunidad puedes añadir grupos donde ya seas administrador. La gente del grupo pasa a ver la estructura y, según la versión, entra también al grupo de anuncios. No pierdes el grupo original: queda como sala.

### ¿La gente ve mi número en un canal?

No. En las versiones actuales, los seguidores no ven el número del administrador ni el de otros seguidores. Es la gran diferencia con grupos y comunidades.

### ¿Un canal reemplaza a un grupo?

No. Un canal informa, un grupo conversa. Si tu gente necesita preguntar y responder, necesitas un grupo. El canal solo reparte el aviso.

### ¿Cuál crece más rápido?

Un canal, porque cualquiera puede seguirlo sin invitación y sin límite conocido. Pero miles de seguidores no es lo mismo que una comunidad viva: para eso están los grupos y las comunidades.

### ¿Puedo tener las tres cosas a la vez?

Sí, y suele ser la mejor jugada. Grupo para la charla, comunidad para ordenar y canal para difundir. Solo asegúrate de poder mantenerlas: tres herramientas vivas exigen tiempo.`,
  },
  {
    id: "post-131",
    slug: "como-crear-una-comunidad-en-whatsapp",
    title:
      "Cómo crear una comunidad en WhatsApp paso a paso (y poblarla sin spam)",
    excerpt:
      "Los pasos exactos para crear una comunidad en WhatsApp desde Android e iPhone, más el manual de lanzamiento: invitar por grupos, usar el grupo de anuncios como puerta y las primeras 2 semanas.",
    coverEmoji: "🛠️",
    tags: JSON.stringify(["whatsapp", "comunidades", "crear", "organizacion"]),
    metaDescription:
      "Cómo crear una comunidad en WhatsApp paso a paso en Android e iPhone, con requisitos, grupos existentes y un plan de lanzamiento para poblarla sin spam.",
    daysAgo: 13,
    content: `Crear una comunidad toma cinco minutos. Que no nazca muerta toma dos semanas. Ese es el verdadero desafío, y casi nadie lo escribe.

La academia de baile de Laura, en Sevilla, lo vivió: armó la comunidad perfecta, invitó a doscientas personas y a los diez días solo quedaban silencios. El problema no fue la herramienta: fue el lanzamiento.

Aquí tienes el paso a paso para crear una comunidad en WhatsApp desde el móvil, y el manual completo para poblarla sin hacer spam. Si el concepto todavía te da vueltas, arranca por [qué es una comunidad de WhatsApp y para qué sirve](/guias/comunidad-de-whatsapp-que-es-y-para-que-sirve) y luego vuelve por este plan.

Crear una comunidad en WhatsApp toma cinco minutos: abres la pestaña de comunidades, tocas «Nueva comunidad», defines el grupo de anuncios, añades grupos de temas e invitas gente. La app pide usar tu cuenta personal, y cada grupo interno admite hasta 1.024 personas.

## Requisitos antes de tocar el botón

Un inventario rápido, dos minutos:

- **App personal de WhatsApp**, actualizada, en Android o iPhone. La creación no siempre está disponible en la versión de escritorio, según la versión.
- **No uses WhatsApp Business para esto**: esa app, hasta hoy, no crea comunidades. La explicación completa está en [comunidades y WhatsApp Business: mito resuelto](/guias/comunidad-de-whatsapp-business-mito-resuelto).
- **Ser administrador de los grupos** que quieras meter dentro. Los grupos de otros no se pueden incluir.
- **Diseño previo por escrito**: un grupo de anuncios y entre 2 y 4 salas. Ni más ni menos para empezar.
- Un nombre claro y una descripción de dos líneas que expliquen para qué existe la comunidad.

Ese último punto parece menor y no lo es. La gente decide quedarse o irse leyendo la descripción de entrada. Es función oficial y gratuita: WhatsApp la detalla en su [página de comunidades](https://www.whatsapp.com/community).

## Paso a paso: crear tu comunidad

1. Abre WhatsApp y busca la pestaña **Comunidades**. En la mayoría de las versiones está en la barra inferior, junto a Chats y Novedades.
2. Toca **Nueva comunidad** y confirma con **Empezar**.
3. Primero define el **grupo de anuncios**: nombre y descripción. Usa algo explícito, tipo «Anuncios de la academia».
4. Luego nombra la **comunidad** completa, con foto y descripción general.
5. Añade las salas: crea grupos nuevos o incorpora **grupos existentes** donde seas administrador.
6. Invita: comparte el **enlace de la comunidad** con tu gente.
7. Publica el primer mensaje en anuncios: bienvenida, mapa de salas y quién es quién.

Del paso 1 al 7 hay cinco minutos. Ahora viene la parte que de verdad importa.

### Cómo añadir grupos que ya existen

Tres reglas, sin vueltas:

- Solo puedes añadir grupos donde **eres administrador**.
- Al añadir un grupo, sus miembros ven la comunidad y, según la versión, entran también al grupo de anuncios. Quien quiera, se va: la salida es libre y silenciosa.
- El grupo conserva su historial, su gente y su configuración. No se borra nada: solo pasa a vivir bajo el techo de la comunidad.

Si nunca armaste un grupo propio, cubre primero eso con la [guía de crear un grupo de WhatsApp](/guias/como-crear-un-grupo-de-whatsapp-guia-completa). Una comunidad se llena de grupos vivos, no de salas vacías.

## El manual del lanzamiento: poblarla sin spam

### Regla de oro: invita por grupos, no persona por persona

Añadir gente suelta, una por una, es la receta del fracaso. La persona entra sin saber de qué va el lugar, ve silencio y se va o se queda molesta.

Invita **grupos enteros que ya conversan**: el equipo del sábado ya es un grupo; las madres del curso ya se escriben. La comunidad les ofrece orden, no un nuevo compromiso.

### El grupo de anuncios como puerta de entrada

Todo recién llegado cae primero al altavoz central. Ahí debe encontrar, el primer día:

- Un mensaje de bienvenida con el mapa de salas.
- La regla de participación: «elige tu sala y preséntate ahí».
- El enlace de la comunidad para que lo comparta con quien le sirva.

Así evitas las cadenas de saludos repetidas en cinco salas. El que quiere presentarse, lo hace donde corresponde.

### Las primeras dos semanas, día por día

**Día 1:** bienvenida oficial en anuncios, reglas breves y presentación de los administradores.

**Días 2 a 4:** contenido útil en cada sala: horarios, listas, fechas. Nada de discursos: datos concretos que la gente necesite hoy.

**Día 5:** una encuesta o pregunta simple que se responda en una línea. El objetivo es romper el hielo en las salas.

**Semana 2:** ritmo de crucero: un mensaje diario en anuncios, máximo. Cede la palabra: pregunta en anuncios y que la gente responda en la sala correcta. Cierra la semana con un logro compartido: «ya somos 180, gracias a todos».

### Lo que nunca funciona

- Cadenas de reenvío: «compártelo con 10 personas».
- Silencio de dos semanas justo después del lanzamiento.
- Añadir desconocidos para llenar: número no es comunidad.
- Publicar lo mismo en las tres salas: cada sala, su tema.

## Errores que matan una comunidad recién nacida

- Abrir con 10 salas y 12 miembros: las salas vacías espantan.
- Dejar el grupo de anuncios sin uso durante semanas: la gente olvida que existe.
- Poner a un solo administrador para todo: quema a cualquiera.
- Responder todo desde anuncios: el altavoz no es para debatir.
- No escribir las reglas: lo que no está escrito no existe.

## Mantenerla viva después del lanzamiento

La comunidad sana necesita tres cosas: ritmo, orden y vocerías.

- **Ritmo:** un mensaje fijo semanal en anuncios, mismo día, misma hora. La gente aprende el calendario.
- **Orden:** un «prefecto» por sala, con permisos de administrador solo ahí. Reparte el trabajo y evita cuellos de botella.
- **Vocerías:** personas que levanten la mano en cada tema. Una comunidad con cinco voces activas vale más que una con quinientas silenciosas.

La moderación fina tiene su propio manual: sigue la [guía para moderar un grupo exitoso](/guias/como-moderar-un-grupo-de-whatsapp-exitoso), que aplica sala por sala.

## Si ya administras grupos

Muchos organizadores llegan a la comunidad tras años de administrar grupos sueltos. Si es tu caso, dos jugadas:

- Agrupa tus grupos bajo una comunidad y usa el anuncio central para lo importante.
- Da a conocer tus grupos donde la gente ya busca: la categoría de [grupos de deportes](/categoria/deportes) reúne a quienes buscan equipo, y puedes [añadir tu grupo al directorio](/agregar-grupo) para que te encuentren.

Y para seguir leyendo sobre organización, las [guías de WhatsApp](/guias) del sitio cubren grupos, comunidades y canales.

## Preguntas frecuentes

### ¿Cuánta gente necesito para arrancar?

No hay mínimo oficial. En la práctica, dos grupos ya vivos bastan: la comunidad ordena lo que existe. Empezar de cero con salas vacías casi nunca funciona.

### ¿Puedo crear la comunidad desde la computadora?

La creación se hace desde el móvil. En la versión de escritorio, según la versión, puedes administrar y escribir, pero el botón de «Nueva comunidad» no siempre aparece.

### ¿Cuesta algo crear una comunidad?

No. Es gratis, como los grupos. No hay planes ni pagos para administradores.

### ¿Puedo meter un grupo que no administro?

No. Solo grupos donde eres administrador. Si quieres incluir el grupo de otra persona, pídele que te haga administrador o que esa persona lo añada a su propia comunidad.

### ¿Cuántas salas conviene al principio?

Entre 2 y 4. Mejor una sala con conversación que cinco vacías. Ya crecerás cuando la gente lo pida.`,
  },
  {
    id: "post-132",
    slug: "comunidad-de-whatsapp-business-mito-resuelto",
    title:
      "¿Se puede crear una comunidad desde WhatsApp Business? Mito resuelto",
    excerpt:
      "No: hoy las comunidades se crean desde la app personal, no desde WhatsApp Business. Te explico por qué, qué puedes hacer con tu número y las combinaciones que sí funcionan.",
    coverEmoji: "💼",
    tags: JSON.stringify(["whatsapp", "business", "comunidades", "mitos"]),
    metaDescription:
      "No, WhatsApp Business no permite crear comunidades por ahora: te explico por qué y las soluciones reales para combinar ambas apps sin volverte loco.",
    daysAgo: 12,
    content: `—Órale, ¿y dónde está el botón? —se preguntó Carmen, dueña de una tienda de manualidades en Puebla. Le habían dicho que con comunidades de WhatsApp su clientela se ordenaría sola. Abrió su app de WhatsApp Business, buscó «Nueva comunidad» y no encontró nada. Ni actualizando. Ni reiniciando.

Carmen no hizo nada mal: el botón no existe ahí. Y media internet insiste en que sí. Este artículo desarma el mito y te deja las soluciones reales, con sus costos a la vista.

Si el concepto todavía te da vueltas, pásale primero por [qué es y para qué sirve una comunidad de WhatsApp](/guias/comunidad-de-whatsapp-que-es-y-para-que-sirve); luego vuelve por el plan.

Hoy, las comunidades de WhatsApp se crean desde la app personal, no desde WhatsApp Business. Business es una app aparte, pensada para atender clientes una a una o con listas y etiquetas. No trae el botón de comunidades y no hay fecha oficial de cambio. La alternativa: gestionar tu comunidad desde la cuenta personal.

## De dónde nace el mito

La confusión tiene tres fuentes, y las tres son comprensibles:

- **Nombre parecido.** «Comunidad» suena a grupo de clientes, y muchos negocios llaman comunidad a su grupo de compras. La función técnica de WhatsApp es otra cosa.
- **Tutoriales viejos o genéricos.** Artículos que hablan de «cuentas de empresa» sin aclarar de qué app hablan. Las dudas de qué app hace qué se repiten hasta en el [centro de ayuda oficial](https://faq.whatsapp.com/).
- **La plataforma empresarial.** Las empresas grandes usan una versión distinta, con sus propias herramientas de mensajería. No es la app que descargas del móvil, pero aparece en las mismas búsquedas.

A eso se suma que WhatsApp mueve funciones entre apps con el tiempo. Lo que hoy es imposible, mañana puede ser un botón. Por eso conviene verificar antes de jurar.

## La respuesta corta: hoy, no

En la app **WhatsApp Business** de móvil, hasta la fecha y en la mayoría de las versiones, no aparece la opción de crear comunidades. El botón vive en la app personal.

No hay anuncio oficial de llegada. Puede cambiar con cualquier actualización; cuando eso pase, este artículo toca actualizarse. Mientras tanto, la [página oficial de WhatsApp Business](https://www.whatsapp.com/business) detalla qué sí trae esa app: catálogo, etiquetas, respuestas rápidas y herramientas de atención.

## Por qué Business no trae comunidades

No es capricho: es diseño.

WhatsApp Business está pensado para **atender de a uno o de a muchos con etiquetas**: contestar consultas, mandar catálogo, organizar clientes. Su fuerte es la conversación privada y el orden interno del negocio.

Las comunidades son una herramienta de **organización de grupos**, con altavoz central y salas. Es lógica de club, no de mostrador.

Que hoy no coincidan no significa que nunca coincidan. Pero planificar tu negocio esperando un botón que no existe es jugarle a la lotería.

## El detalle que casi nadie te dice: tu número vive en una sola app

Aquí viene el punto clave del mito.

Un mismo número de teléfono **no puede estar activo en WhatsApp y WhatsApp Business al mismo tiempo**. Si el número de tu tienda está en Business, no puedes saltar a la app personal un rato para crear la comunidad con ese número.

Tus caminos reales, entonces, son tres:

1. **Otro número para la comunidad.** Un chip económico, una eSIM o ese número viejo que tenías libre. Creas la comunidad ahí y administras con ese teléfono.
2. **Migrar tu número a la app personal.** El historial se puede pasar entre apps, con copia de seguridad previa. Pierdes las herramientas Business de ese número: catálogo, etiquetas, respuestas rápidas.
3. **Quedarte con grupos en Business.** Business sí crea grupos normales. Si tu clientela cabe en dos grupos, quizás no necesitas una comunidad.

## Combinación 1: comunidad en un número personal + atención por Business

La más usada por tiendas con clientela activa:

- **Número personal (un chip nuevo o el tuyo propio):** la comunidad, con «Anuncios», «Pedidos y horarios» y «Novedades».
- **Número de la tienda (en Business):** atención por privado, catálogo y etiquetas.

Pros: cada app hace lo suyo y tu número de tienda no se mezcla con la comunidad. Contras: dos teléfonos que vigilar (o doble SIM) y una división que hay que explicar a los clientes.

El procedimiento completo de la comunidad, incluido el plan para poblarla sin spam, está en [cómo crear una comunidad en WhatsApp paso a paso](/guias/como-crear-una-comunidad-en-whatsapp).

## Combinación 2: grupos de atención en Business + comunidad de anuncios en el otro número

Al revés de la anterior, y útil cuando el volumen de consultas es alto:

- **Business** concentra los grupos de atención por zona o por producto, con etiquetas y respuestas rápidas.
- **La comunidad** funciona como altavoz: anuncios de horarios, cambios y promos que llegan a todos sin repetir el mensaje en cada grupo.

Así el mostrador no se contagia del ruido y los avisos llegan una sola vez. Requiere disciplina: lo que es conversa va a Business; lo que es aviso, a la comunidad.

## Qué app sirve para qué cosa

| Tarea | App personal | WhatsApp Business |
|---|---|---|
| Crear comunidad | Sí | No, hasta hoy |
| Crear canal | Sí | No, hasta hoy |
| Crear grupo normal | Sí | Sí |
| Catálogo de productos | No | Sí |
| Etiquetas y respuestas rápidas | No | Sí |
| Listas de difusión | Sí | Sí |
| Atención uno a uno | Sí | Sí, con más herramientas |

Nota: los canales tampoco se crean desde Business. Si tu plan incluye difusión, mira [cómo crear un canal de WhatsApp](/guias/como-crear-un-canal-de-whatsapp) desde la app personal.

Ojo con la tabla: «no, hasta hoy» significa exactamente eso. Las apps se actualizan y las funciones se mueven.

## Tres perfiles, tres combinaciones

- **Tienda de barrio (el caso de Carmen):** comunidad en número personal para avisos y Business en el número de la tienda para atender. Simple y ordenado.
- **Academia o curso:** comunidad para el alumnado y los avisos, Business para recordatorios de pago con etiquetas. El cobro por un lado, la comunidad por el otro.
- **Emprendedor digital:** ni siquiera necesitas Business para arrancar: canal para difundir y comunidad para ordenar. Los [grupos de negocios](/categoria/negocios) dan ideas de cómo otros lo resuelven; uno bien armado, como [Emprendedores MX: ideas y flujo de caja](/grupo/emprendedores-mx-ideas-y-flujo-de-caja), muestra la cultura que se puede construir.

Y para no perderte entre apps y funciones, las [guías del sitio](/guias) van tema por tema.

## Preguntas frecuentes

### ¿Puedo usar el mismo número en las dos apps a la vez?

No. Un número solo puede estar activo en una de las dos apps al mismo tiempo. Por eso las combinaciones usan dos números o una migración.

### ¿Perderé mis chats al pasar de Business a la app personal?

El traspaso de historial entre apps está soportado. Aun así, haz copia de seguridad antes de migrar y verifica que se restauró completo.

### ¿La versión empresarial tiene comunidades?

La plataforma para empresas grandes tiene sus propias herramientas de mensajería, que no son las comunidades de la app. Si tu negocio la usa, tu proveedor te dirá qué cubre.

### ¿Cuándo llegará el botón a Business?

No hay fecha oficial. Actualiza la app de vez en cuando y revisa las novedades oficiales. Hasta entonces, las combinaciones de arriba funcionan hoy.

### ¿Puedo administrar la comunidad con el número de la tienda?

Sí, siempre que ese número viva en la app personal. El punto no es el número: es en cuál app está activo.`,
  },
  {
    id: "post-133",
    slug: "como-crear-un-canal-de-whatsapp",
    title:
      "Cómo crear un canal de WhatsApp y conseguir tus primeros seguidores",
    excerpt:
      "Crea tu canal de WhatsApp en minutos y consigue los primeros seguidores con contenido de una sola vía: horario fijo, mensajes cortos y enlaces a tus grupos.",
    coverEmoji: "📢",
    tags: JSON.stringify(["whatsapp", "canales", "seguidores", "crear"]),
    metaDescription:
      "Cómo crear un canal de WhatsApp paso a paso, qué contenido funciona en una vía sin comentarios y cómo conseguir tus primeros seguidores sin molestar.",
    daysAgo: 11,
    content: `—Che, el grupo ya tiene 990 personas y la mitad solo quiere los resultados, no la discusión —le contaba Julián a un amigo en Rosario. Administra un grupo de resultados al estilo de [La Liga MX: resultados y memes](/grupo/la-liga-mx-resultados-y-memes), y el asunto se le venía encima: gente que pedía callar, otros que pedían más charla, todos en el mismo chat.

La salida de Julián fue un canal: el aviso llega a miles sin abrir conversación. Aquí tienes el paso a paso para crear el tuyo, qué contenido funciona en una vía sin comentarios y cómo conseguir los primeros seguidores sin molestar a nadie.

Un canal de WhatsApp es una emisión de una sola vía: tú publicas, tus seguidores leen. Nadie comenta ni ve tu número, y no hay límite conocido de seguidores. Se crea desde la app personal, en la pestaña de Novedades, y aparece en el buscador de canales.

## Qué es un canal (y qué no es)

Lo que sí es:

- **Emisión en una sola dirección.** Publica el administrador; el resto lee.
- **Anónimo para el seguidor.** Nadie ve tu número y tú no ves el de nadie.
- **Sin límite conocido de seguidores.** Escala sin llenarse, a diferencia de un grupo.
- **Visible en el buscador de canales.** La gente puede encontrarte sin enlace, según la versión.

Lo que no es:

- **No es un grupo.** Los seguidores no escriben. Si necesitan conversar, necesitas un grupo.
- **No es un chat.** En versiones recientes la gente puede reaccionar con emojis y, a veces, responder encuestas. Pero no hay conversación.
- **No es una comunidad.** No hay salas ni miembros: hay un altavoz y una audiencia. La comparación fina está en [grupo vs. comunidad vs. canal](/guias/grupo-vs-comunidad-vs-canal-de-whatsapp).

## Paso a paso: crear tu canal

1. Abre WhatsApp y entra a la pestaña **Novedades** (en algunas versiones se llama **Actualizaciones**). Ahí viven los estados y los canales.
2. Toca el botón **+** y elige **Canal nuevo**.
3. Nombra tu canal. Que se entienda de qué va en tres palabras: «Resultados Liga MX», «Ofertas doña Carmen».
4. Escribe la descripción y elige el emoji de foto. Sí: los canales usan un emoji como imagen por defecto. Simple y reconocible.
5. Toca **Crear canal**. Ya existe tu emisora.
6. Publica el primer mensaje: qué vas a publicar, cada cuánto y por qué conviene seguirte.
7. Consigue el **enlace de invitación** desde la info del canal y compártelo donde pueda importar.

Todo el proceso se hace desde el móvil, con la app personal. Hasta hoy tampoco se crea desde WhatsApp Business: ese detalle está desarmado en [el mito de las comunidades en Business](/guias/comunidad-de-whatsapp-business-mito-resuelto), que aplica igual para canales.

WhatsApp mantiene su [página oficial sobre canales](https://www.whatsapp.com/channel) con lo básico, y el [blog oficial](https://blog.whatsapp.com/) anuncia cada función nueva cuando llega.

### Ajustes que valen la pena

- **Editar nombre, descripción y emoji** cuando quieras. No hay bloqueo.
- **Sumar administradores** para repartir la publicación.
- **Ver el total de seguidores**, no los nombres: la privacidad es la regla.
- **Reacciones y encuestas** (según la versión) para medir sin abrir el micrófono.
- **Borrar el canal** si te equivocaste: es permanente, piénsalo antes.

## Qué contenido funciona en un canal

### Reglas del contenido de una vía

- **Horario fijo.** Mismo momento del día o de la semana. La audiencia aprende tu calendario y te espera.
- **Formato corto.** Dos a cuatro líneas por mensaje. En el móvil, el párrafo largo asusta.
- **Una idea por mensaje.** Cinco enlaces juntos se pierden; uno solo se clickea.
- **Negrita en lo clave.** Día, hora, precio. El resto, texto plano.
- **Enlaces a tus grupos** cuando toque conversar: el canal avisa, el grupo debate.
- **Encuestas** para medir interés, si tu versión las trae.

### Qué se hunde rápido

- Cadenas de reenvío y publicidad ajena.
- Publicar a horas sueltas: nadie genera hábito.
- Novelas de diez párrafos: el canal no es un blog.
- Duplicar en el canal todo lo que ya está en tus grupos: la gente se aburre de lo mismo dos veces.

### La primera semana de un canal de resultados

- **Lunes:** horario de la semana y partido estelar.
- **Martes:** encuesta de pronóstico.
- **Jueves:** previa del fin de semana, en tres líneas.
- **Domingo:** resultado y enlace al grupo para el debate.
- **Domingo noche:** resumen de la fecha y «nos vemos el lunes».

Cinco publicaciones, quince minutos de trabajo, un hábito armado.

## Cómo conseguir tus primeros seguidores

1. **Tu propia red.** Estado de WhatsApp, firma de tus correos, tu perfil. Lo que ya tienes gratis.
2. **El grupo que ya administras.** Fija el enlace del canal en la descripción del grupo y anúncialo una vez, con permiso y sin insistir. El grupo sigue para charlar; el canal, para avisos.
3. **QR en el mundo físico.** Cartel del local, mesa, recibo, cartel del club. El canal también tiene su código para escanear.
4. **Cruces con otros canales.** Menciones mutuas con colegas que no compitan directo contigo.
5. **Directorios y listas.** Que te encuentren donde la gente ya busca: el [buscador de grupos de WhatsApp](/buscar) reúne a quienes ya están en modo sumarme.

Lo que no: comprar seguidores (no existe de verdad), añadir gente a la fuerza a grupos para venderles el canal o hacer spam en comunidades ajenas. Eso quema tu nombre antes de empezar.

## Cómo una comunidad o un directorio alimentan tu canal

El canal no nace solo: nace mejor cuando ya tienes estructura.

- **Si administras una comunidad:** pega el enlace del canal en el grupo de anuncios y fíjalo. La comunidad entera lo verá en el altavoz central. El paso a paso para armarla está en [cómo crear una comunidad en WhatsApp](/guias/como-crear-una-comunidad-en-whatsapp).
- **Si administras grupos sueltos:** tu grupo popular es el trampolín. Anuncia el canal una vez, deja el enlace en la descripción y deja que crezca solo.
- **Si partes de cero:** crea primero el grupo que converse y después el canal que avise. Así el embudo queda completo: el canal capta, el grupo conversa y la comunidad ordena, si la necesitas. La anatomía de las tres piezas está en [qué es una comunidad de WhatsApp](/guias/comunidad-de-whatsapp-que-es-y-para-que-sirve).

El orden importa: primero la conversación, después la audiencia. Un canal sin nada detrás es un altavoz apuntando a la nada.

## Preguntas frecuentes

### ¿Los seguidores ven mi número?

No. En las versiones actuales, ni los seguidores ven el tuyo ni tú el de ellos. Es una de las grandes ventajas frente a los grupos.

### ¿Puedo ver quién sigue mi canal?

Ves el total de seguidores y las reacciones, no la lista de nombres. La privacidad es parte del diseño.

### ¿Cuántos seguidores admite un canal?

No hay límite conocido, a diferencia de los grupos y su tope de 1.024. Por eso los canales son la herramienta de difusión masiva de WhatsApp.

### ¿Puedo convertir mi grupo en un canal?

No hay conversión automática. Creas el canal, lo anuncias en el grupo y quien quiere te sigue. El grupo y el canal pueden convivir sin problema.

### ¿Cuánto cuesta?

Nada. Crear un canal es gratis, igual que grupos y comunidades. Lo que cuesta es el contenido: un horario fijo y mensajes cortos, semana tras semana.`,
  },
];

// --- validation + insert ---
const wordCount = (md) => md.split(/\s+/).filter(Boolean).length;
const rm = (md) => Math.max(1, Math.round(wordCount(md) / 180));
const links = (md) => [...md.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1].trim());

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "grupos",
  password: "",
  database: "gruposwhatsapp",
  connectionLimit: 2,
});

for (const p of posts) {
  const wc = wordCount(p.content);
  const ml = p.metaDescription.length;
  const ls = links(p.content);
  const internal = ls.filter((u) => u.startsWith("/"));
  const external = ls.filter((u) => u.startsWith("http"));
  const dups = ls.filter((u, i) => ls.indexOf(u) !== i);
  const first150 = p.content.split(/\s+/).slice(0, 150).join(" ");
  const earlyLink = internal.some((u) => first150.includes("](" + u + ")"));
  const warn = [];
  if (wc < 1200 || wc > 2000) warn.push(`WORDS ${wc} out of 1200-2000`);
  if (ml < 140 || ml > 155) warn.push(`METADESC ${ml} chars out of 140-155`);
  if (internal.length < 4 || internal.length > 8)
    warn.push(`INTERNAL ${internal.length} out of 4-8`);
  if (external.length < 1 || external.length > 2)
    warn.push(`EXTERNAL ${external.length} out of 1-2`);
  if (dups.length) warn.push(`DUP URLS ${dups.join(", ")}`);
  if (!earlyLink) warn.push("NO internal link in first 150 words");
  console.log(
    `${p.id} ${p.slug} | words=${wc} readingMinutes=${rm(p.content)} metaDesc=${ml} internal=${internal.length} external=${external.length} earlyLink=${earlyLink}${warn.length ? " | WARN: " + warn.join("; ") : ""}`
  );

  await pool.execute(
    `INSERT INTO blog_posts (id,slug,title,excerpt,content,coverEmoji,tags,authorName,status,metaTitle,metaDescription,readingMinutes,views,publishedAt)
     VALUES (?,?,?,?,?,?,?,?, 'published', NULL, ?, ?, 0, UTC_TIMESTAMP() - INTERVAL ? DAY)
     ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content),
     coverEmoji=VALUES(coverEmoji), tags=VALUES(tags), authorName=VALUES(authorName),
     metaDescription=VALUES(metaDescription), readingMinutes=VALUES(readingMinutes)`,
    [
      p.id,
      p.slug,
      p.title,
      p.excerpt,
      p.content,
      p.coverEmoji,
      p.tags,
      "Antonio C.",
      p.metaDescription,
      rm(p.content),
      p.daysAgo,
    ]
  );
}

await pool.end();
console.log(`cluster-6: ${posts.length} posts seeded`);
