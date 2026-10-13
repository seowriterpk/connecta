// CLUSTER 5 — "Rules & names" (6 posts: post-123 … post-128)
// Task 10-5 · site: gruposhoy.com · author: Antonio C. · voice: easy neutral Spanish
import mysql from "mysql2/promise";

const posts = [
  {
    id: "post-123",
    slug: "reglas-para-grupos-de-whatsapp-copiar-y-pegar",
    title: "Reglas para grupos de WhatsApp: 7 plantillas listas para copiar y pegar",
    excerpt:
      "Siete plantillas de reglas para grupos de WhatsApp listas para copiar y pegar tal cual: familia, amigos, trabajo, ventas, estudio, vecinos y padres. Con dónde fijarlas y qué hacer cuando alguien las rompe.",
    coverEmoji: "📋",
    tags: JSON.stringify(["whatsapp", "reglas", "grupos", "plantillas"]),
    metaDescription:
      "Reglas para grupos de WhatsApp para copiar y pegar: 7 plantillas de familia, amigos, trabajo, ventas, estudio, vecinos y padres, con sanciones claras.",
    daysAgo: 22,
    content: `Todo grupo de WhatsApp arranca igual: ilusión, fotos y cero reglas. A la tercera semana ya hay cadenas, memes a las 2 de la mañana y una pelea por un audio de siete minutos. Si tú administras, esto te suena: en la guía de [cómo moderar un grupo de WhatsApp con éxito](/blog/como-moderar-un-grupo-de-whatsapp-exitoso) ya cubrimos la parte técnica. Falta la otra mitad: las reglas mismas.

La buena noticia es que no tienes que escribir nada. Abajo tienes **7 plantillas de reglas para grupos de WhatsApp listas para copiar y pegar**: familia, amigos, trabajo, ventas, estudio, vecinos y padres de familia. Cada una cabe en un solo mensaje y se pega tal cual.

Al terminar tendrás tu grupo con reglas fijadas y un plan claro para cuando alguien las rompa. Sin discusiones de tres días.

Las **reglas de un grupo de WhatsApp** son un texto corto que dice qué se publica, en qué horario y qué pasa si alguien se pasa de la raya. Se pegan en la descripción o en un mensaje fijado. Un grupo con reglas escritas discute menos y cumple su propósito.

## Por qué las reglas no escritas no existen

"Todos sabíamos que no se podía" es la frase que más se repite antes de que un grupo explote. No es cierto: la regla que nadie escribió nunca fue un acuerdo.

El grupo recuerda mal. La mitad cree que los memes estaban prohibidos; la otra mitad, que solo los de política. Y cuando entra alguien nuevo, nadie le explica nada: se entera rompiendo la regla.

María administra el grupo de su familia en Monterrey. Un primo reenviaba cadenas de la suerte cada mañana. "Pensé que se sabía", dijo ella. No se sabía: nadie lo había escrito nunca. Las reglas escritas evitan ese malentendido gratis.

## Dónde poner las reglas: descripción o mensaje fijado

WhatsApp te da dos lugares, y conviene usarlos con roles distintos:

1. **La descripción del grupo.** Acepta hasta 500 caracteres y la ve todo el mundo. Ideal para la versión resumida: propósito, horario y la regla más importante.
2. **Un mensaje fijado.** Manda el mensaje con las reglas completas y fíjalo al inicio del chat. Toca el mensaje, elige **Fijar** y escoge la duración: 24 horas, 7 días o 30 días. Según la versión, se pueden fijar hasta tres mensajes por chat.

| Lugar | Límite | Mejor uso |
| --- | --- | --- |
| Descripción | 500 caracteres | Resumen permanente, visible antes de entrar |
| Mensaje fijado | Hasta 3 mensajes | Reglas completas siempre arriba del chat |

Un consejo extra: limita quién edita los datos del grupo. En la información del grupo, **Editar datos del grupo → Solo administradores**. Así nadie "edita" las reglas de madrugada.

## Cómo escribirlas para que la gente las lea

Las reglas que nadie lee comparten tres defectos: son largas, suenan a contrato y no dicen qué pasa si se rompen. Tres arreglos:

- **Siete reglas máximo.** La gente memoriza siete líneas, no veinte.
- **Verbos simples.** "Aquí solo avisos de la escuela" se entiende. "El presente grupo tiene por objeto…" no.
- **La consecuencia, al final.** Un recordatorio, dos recordatorios y fuera. Escrito así, nadie lo puede tomar como algo personal.

## Las 7 plantillas para copiar y pegar

Copia el bloque que necesites y pégalo tal cual. Cámbiale solo lo que va entre corchetes. Después fíjalo o pégalo en la descripción, como vimos arriba.

### 1. Plantilla para familia

> **Reglas del grupo de la familia**
> 1. Este grupo es para avisos de la familia: citas, salud, reuniones y viajes.
> 2. Fotos de niños: solo si quien las manda tiene permiso de los papás.
> 3. Cadenas de "reenvía a 10 personas": no. Ni las de suerte, ni las de salud.
> 4. Audios de más de 2 minutos: mejor una llamada.
> 5. Política y religión se hablan en la mesa, no en el chat.
> 6. Horario del grupo: de 7:00 a 22:00. Las urgencias reales van con llamada.
> Si alguien rompe una regla, se le recuerda por privado. A la tercera, sale del grupo. Con cariño, pero sale.

### 2. Plantilla para amigos

> **Reglas de la peña**
> 1. Aquí mandamos memes, planes y el chisme del barrio. Todo con humor.
> 2. Cadena que mandes, cadena que te devolvemos: cero cadenas.
> 3. Audios de máximo 2 minutos. Si el cuento es largo, cuéntalo el sábado.
> 4. Lo que se habla en el grupo se queda en el grupo.
> 5. Los planes se confirman 24 horas antes, del dicho al hecho.
> 6. Se puede borrar un mensaje: que no se convierta en costumbre.
> Regla de oro: nadie se enoja, todos se burlan. El que insista con cadenas, paga el asado.

### 3. Plantilla para trabajo

> **Reglas del grupo de [equipo]**
> 1. Horario del grupo: de 8:00 a 18:00, de lunes a viernes.
> 2. Aquí solo temas de trabajo. Memes y cumpleaños, al grupo social.
> 3. Responde citando el mensaje, para no abrir diez hilos.
> 4. Audios solo si estás en movimiento: máximo 1 minuto.
> 5. Urgencias reales fuera de horario: llamada, no mensaje.
> 6. Los archivos importantes van con una línea que explique qué son.
> El que escribe a las 2 de la mañana no espera respuesta: no es urgente si puede esperar a mañana.

### 4. Plantilla para ventas

> **Reglas de [nombre del grupo] — compra y venta**
> 1. Cada publicación lleva: PRODUCTO, PRECIO, ESTADO y UBICACIÓN. Foto real obligatoria.
> 2. Una misma publicación se repite máximo una vez por semana.
> 3. Precio en claro. "Consultar" cuenta como publicación incompleta.
> 4. Prohibido: enlaces acortados, pagos por adelantado y datos de terceros.
> 5. Los tratos son entre comprador y vendedor; el grupo no intermedia.
> Primera falta: recordatorio. Segunda: fuera del grupo, sin discusión.

### 5. Plantilla para estudio

> **Reglas del grupo de [materia o curso]**
> 1. Aquí compartimos apuntes, fechas y dudas de [materia].
> 2. La pregunta va al chat, no al privado: tu duda le sirve a todos.
> 3. La foto del pizarrón llega el mismo día, antes de que se borre.
> 4. Sin memes en semana de examen. El pánico ya alcanza.
> 5. Horario: de 8:00 a 23:00. La madrugada es para dormir, no para debatir.
> El que comparte apuntes la víspera merece un monumento. El que pregunta "¿entra esto?" ya conoce la respuesta.

### 6. Plantilla para vecinos

> **Reglas del grupo — [edificio o barrio]**
> 1. Aquí van avisos del edificio: agua, luz, basura, reuniones y seguridad.
> 2. Lo urgente empieza con "AVISO:". Lo demás puede esperar.
> 3. Alertas de seguridad con datos: qué pasó, dónde y a qué hora. Sin pánico.
> 4. Nada de ventas, política ni cadenas.
> 5. De 22:00 a 8:00 solo urgencias: la gente duerme.
> 6. Conflictos con un vecino: en persona o por privado. No en el grupo.
> Quien insista en romper las reglas después de dos recordatorios, sale del grupo.

### 7. Plantilla para padres de familia

> **Reglas del grupo de [grado] — avisos**
> 1. Aquí solo avisos oficiales de la escuela: citas, tareas, salidas y cambios.
> 2. Escriben la profesora y la delegada de [grado]. Los demás leen.
> 3. Las dudas se mandan por privado a la delegada. Se responden agrupadas.
> 4. Sin cadenas, sin ventas, sin felicitaciones en cadena.
> 5. Horario: de 7:00 a 21:00. Urgencia real: llamada.
> 6. Las fiestas y las bromas van al grupo de charla de los papás.
> El grupo de avisos guarda información: cada mensaje innecesario la entierra.

Tres de estas plantillas tienen guía propia con más detalle: la de [padres de familia](/blog/reglas-grupo-de-whatsapp-padres-de-familia), la de [vecinos](/blog/reglas-grupo-de-whatsapp-vecinos) y la de [trabajo y ventas](/blog/reglas-grupos-de-whatsapp-trabajo-y-ventas).

## Qué hacer cuando alguien rompe las reglas

Las reglas solo sirven si tienen consecuencias. El camino sano tiene tres pasos, en este orden:

1. **Advertencia en privado.** Nunca el regaño público. Un privado de dos líneas: "Te paso las reglas del grupo, che: el horario cierra a las 22." El tono importa más que la norma.
2. **Silencio.** Seamos honestos: WhatsApp no tiene botón para silenciar a una sola persona. Lo que sí puedes hacer es enfriar el grupo: cambia el permiso de envío a **solo administradores** unas horas. El grupo respira, el tema se enfría, y luego reabres la conversación.
3. **Expulsión.** Última instancia. En la información del grupo, toca el nombre de la persona y elige **Quitar del grupo**. En versiones recientes, estos avisos los ven sobre todo los administradores. Ojo: otro admin puede volver a agregarla. Si el problema es grave, el reporte existe: cualquier miembro puede reportar contenido, como explica el [centro de ayuda de WhatsApp](https://faq.whatsapp.com/).

| Paso | Qué haces | Herramienta |
| --- | --- | --- |
| 1. Advertencia | Privado de dos líneas, tono tranquilo | Mensaje directo |
| 2. Silencio | Enfrías el grupo un rato | Permisos: solo administradores |
| 3. Expulsión | Quitas al reincidente | Quitar del grupo |

El orden importa. Saltar al paso tres en la primera falta convierte al admin en el villano de la película. Y si piensas abrir las puertas del grupo al público, antes deja las reglas escritas y pasa por [cómo agregar tu grupo al directorio](/agregar-grupo): los grupos publicados con reglas claras duran más.

## Preguntas frecuentes

### ¿Cuántas reglas debe tener un grupo de WhatsApp?

Siete como máximo. La gente lee las tres primeras, recuerda dos más y el resto se pierde. Si tu grupo necesita más de siete reglas, quizás necesita dos grupos.

### ¿Dónde se ponen mejor: descripción o mensaje fijado?

En los dos. La descripción lleva el resumen (hasta 500 caracteres) y la ve quien entra por enlace. El mensaje fijado lleva las reglas completas y queda siempre arriba del chat. Se complementan.

### ¿Puedo expulsar a alguien por romper las reglas?

Sí, si eres administrador. Conviene hacerlo después de al menos una advertencia por privado, y con las reglas por escrito desde antes. Si las reglas no existían, no eran reglas.

### ¿Quién puede poner las reglas del grupo?

Cualquiera puede proponerlas, pero conviene que las aprueben los administradores. El ajuste "editar datos del grupo" decide quién puede cambiar la descripción: todos o solo admins. En grupos abiertos, mejor solo admins.

### ¿Las plantillas sirven para grupos grandes?

Sí. El límite de WhatsApp es de 1.024 miembros por grupo, y a ese tamaño las reglas escritas importan más, no menos. En grupos muy grandes, valora el formato de comunidad: un grupo de anuncios controlado por admins y subgrupos por tema.`,
  },

  {
    id: "post-124",
    slug: "reglas-grupo-de-whatsapp-padres-de-familia",
    title: "Reglas para el grupo de WhatsApp de padres de familia que sí funcionan",
    excerpt:
      "El grupo de WhatsApp de los padres puede ser un desastre o un salvavidas. Reglas que sí funcionan: avisos separados de la charla, el rol de la profesora, respuestas agrupadas y la plantilla del grupo de avisos.",
    coverEmoji: "🎒",
    tags: JSON.stringify(["whatsapp", "reglas", "padres", "escuela"]),
    metaDescription:
      "Reglas para el grupo de WhatsApp de padres de familia: separa avisos de charla, define el rol de la profesora y copia la plantilla del grupo de clase.",
    daysAgo: 21,
    content: `El grupo de padres de familia tiene un don: convertir un aviso de "traigan bata de laboratorio" en 130 mensajes. Hay cadenas, audios de madrugada y la pregunta eterna de si mañana hay clase. La escuela de María, en Monterrey, lo sufre igual que cualquier colegio de Sevilla. Es caos universal, no culpa de tu delegada.

Lo que cambia la ecuación son las reglas. Ya publicamos el pack general de [reglas para grupos de WhatsApp listas para copiar y pegar](/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar); esta es la versión escuela, la más pedida de todas.

Aquí van las reglas que sí funcionan, el truco de los dos grupos y la plantilla del grupo de avisos, lista para copiar tal cual.

Las **reglas del grupo de WhatsApp de padres de familia** separan los avisos del ruido: qué se publica, quién lo publica y en qué horario. Con ese acuerdo, la información de la escuela llega el mismo día y las charlas van a su propio grupo. Sin reglas, el grupo se hunde en cadenas y audios.

## Por qué el grupo de padres es el más caótico de todos

La receta del desastre junta tres ingredientes que solo se combinan en la escuela:

- **Urgencia real de fondo.** Un aviso perdido no es tema menor: es el hijo sin traje de natación el día de la clase.
- **Gente que no se eligió.** Los papás comparten hijos, no gustos. Hay de todo, como en la farmacia.
- **Cero estructura.** Todos escriben a todas horas y la información importante se entierra en cinco minutos.

Por eso el grupo de padres no se arregla con paciencia. Se arregla con estructura.

## La regla número uno: dos grupos, no uno

El error clásico es querer que un solo grupo sea a la vez el periódico y la plaza pública. No puede. La solución son dos grupos con nombres que se expliquen solos:

- **Grupo de avisos, [grado].** Solo entra información oficial. Escriben la profesora y la delegada; los demás leen. WhatsApp lo resuelve de fábrica: el grupo se configura para que solo los administradores envíen mensajes. El paso a paso está en [cómo poner un grupo de WhatsApp en modo solo lectura](/blog/grupo-de-whatsapp-solo-lectura).
- **Grupo de charla, [grado].** Felicitaciones, memes escolares y planes del fin de semana. Aquí sí es libre: quien quiera hablar, habla.

En Chile le dicen grupo de apoderados; en España, grupo de clase; en México, de mamás y papás. El truco de los dos grupos funciona igual en los tres países. Y si la escuela tiene varios cursos, WhatsApp tiene un formato a la medida: la [comunidad con grupo de anuncios y subgrupos](https://www.whatsapp.com/community). Cada curso en su subgrupo y los avisos arriba de todo.

## El papel de la profesora

La profesora ya trabaja de sobra. Estas cuatro costumbres la mantienen dentro del grupo sin quemarla:

1. **Admin del grupo de avisos, si acepta.** La información directa de ella no necesita intermediarios.
2. **Nunca escribirle por el grupo.** Las dudas van a la delegada. A la profesora se le escribe por privado, si ella lo autoriza.
3. **Un mensaje semanal agrupado.** La delegada junta las dudas y manda una sola respuesta los miércoles. Cinco preguntas, un mensaje.
4. **Sin mencionarla en discusiones.** Si hay conflicto, se pide reunión. El chat no es un acta.

Si la profesora prefiere no participar, no pasa nada: la delegada copia y pega los avisos de la escuela. El sistema funciona igual.

## Las 7 reglas que sí funcionan

1. **Solo avisos oficiales en el grupo de avisos.** Cada mensaje extra entierra el aviso anterior.
2. **Horario: de 7:00 a 21:00.** A las 23:50 nadie resuelve nada de la escuela.
3. **Cero cadenas.** "Reenvía a 10 mamás" no es un aviso: es ruido. Y muchas cadenas esconden [estafas clásicas de WhatsApp](/blog/estafas-en-grupos-de-whatsapp-9-senales).
4. **Dudas por privado a la delegada.** Ahí se agrupan y se responden juntas.
5. **Respuestas agrupadas un día fijo.** El miércoles, por ejemplo. El día fijo quita ansiedad: ya nadie persigue la respuesta.
6. **Sin audios largos.** Un aviso que hay que escuchar dos veces ya no es un aviso.
7. **Nada de ventas ni fotos de niños ajenos.** Los grupos de padres no son vitrinas ni quioscos.

## La plantilla del grupo de avisos (para copiar y pegar)

> **Grupo: Avisos [grado] — solo información**
> 1. Aquí solo se publican avisos oficiales de la escuela, de la profesora o de la delegada.
> 2. Las dudas van por privado a la delegada. Se agrupan y se responden los miércoles.
> 3. Sin cadenas, sin felicitaciones en cadena, sin ventas.
> 4. Sin audios: los avisos llegan en texto, para que se puedan buscar.
> 5. Horario: de 7:00 a 21:00. Urgencias reales: llamada.
> 6. Las fiestas y las bromas van al grupo de charla de [grado].
> Quien rompa la regla recibe un recordatorio por privado. Si insiste, pasa al grupo de charla. En el grupo de avisos, molestar es doble: tapa la información de todos.

Adapta la plantilla a tu escuela: cambia [grado] por el tuyo y el día de respuestas por el que mejor le quede a la delegada. Si el colegio ya manda circular por su propio canal, la plantilla se simplifica: la delegada solo repite lo oficial y el resto de las reglas no hace falta escribirlas.

## Cómo presentar las reglas sin pelearte con nadie

Las reglas que se imponen por chat se leen como imposición. Las que se aprueban en reunión, como acuerdos. En la reunión de inicio de año alcanzan cinco minutos:

"Propuesta: grupo de avisos solo con información, grupo de charla libre y dudas a la delegada. ¿Les parece?"

Se aprueba, se copia la plantilla y listo. Vale, alguien va a protestar igual: siempre hay uno. La mayoría lo agradecerá en silencio.

La primera semana es de transición. Recuerda las reglas con humor y en privado. A la segunda semana, el grupo ya se autorregula solo.

## Preguntas frecuentes

### ¿La profesora tiene que ser administradora?

Solo si ella quiere. Si acepta, los avisos salen directos de la fuente. Si no, la delegada repite lo que la escuela manda por circular. El sistema funciona con las dos variantes.

### ¿Y si los padres quieren un solo grupo?

Se puede empezar así, pero el grupo único se divide solo a los dos meses. Es más sano abrir los dos grupos desde el día uno, con nombres claros: "Avisos 3°B" y "Charla 3°B".

### ¿Cómo moderar a la mamá que manda cadenas?

Primero un privado amable: "Hola, te paso las reglas del grupo: sin cadenas, para que no se pierdan los avisos." Si sigue, pásala al grupo de charla. El grupo de avisos no es castigo: es una caja de información.

### ¿Cuándo se cierra el grupo del año escolar?

Con el ciclo. En diciembre se agradece, se archiva y se abre el grupo nuevo en marzo. Para irse sin drama, ya tenemos la guía de [cómo salir de un grupo de WhatsApp sin que se den cuenta](/blog/como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta).

### ¿Funciona igual en primaria y secundaria?

Sí. En primaria lo administran los papás; en secundaria pueden entrar los propios chicos como subdelegados. La estructura de dos grupos y respuestas agrupadas no cambia. Y para los estudiantes que ya organizan sus propios chats, en el directorio hay [grupos de educación y estudio](/categoria/educacion) por país.`,
  },

  {
    id: "post-125",
    slug: "reglas-grupo-de-whatsapp-vecinos",
    title: "Reglas para grupos de WhatsApp de vecinos: convivencia sin guerras",
    excerpt:
      "Un grupo de vecinos bien organizado evita las peleas del edificio; mal organizado, las multiplica. Reglas para grupos de WhatsApp de vecinos: urgencias, alertas sin pánico, spam de ventas y horario nocturno, con plantilla.",
    coverEmoji: "🏠",
    tags: JSON.stringify(["whatsapp", "reglas", "vecinos", "comunidad"]),
    metaDescription:
      "Reglas para grupos de WhatsApp de vecinos: urgencias sin pánico, horario nocturno, control del spam y rotación de administradores, con plantilla lista.",
    daysAgo: 20,
    content: `El grupo de vecinos parece lo más tranquilo del mundo. Hasta que alguien menciona el ascensor. O la basura. O el ruido del 4°B. Ahí el chat de "buenos días, ya llegó el agua" se convierte en una asamblea sin fin y sin moderador.

La convivencia se juega en esos detalles. Un edificio de Sevilla y un barrio de Buenos Aires sufren los mismos temas con distinto acento: che, del tema del agua no se salva nadie. Bien organizado, el grupo de vecinos evita peleas de escalera. Mal organizado, las multiplica.

Las reglas generales ya están en nuestro pack de [reglas para grupos de WhatsApp para copiar y pegar](/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar). Aquí va la versión edificio y barrio, con plantilla incluida.

Las **reglas de un grupo de vecinos** organizan la convivencia: qué cuenta como urgencia, qué horario se respeta y qué se hace con el spam de ventas. Sirven para un edificio de 20 departamentos y para un barrio de cientos de casas. El objetivo es simple: avisos claros y cero guerras.

## Por qué los grupos de vecinos explotan

Tres motivos, y ninguno tiene que ver con gente "mala":

- **Todos son parte interesada.** El ruido, la expensa y el ascensor tocan el bolsillo y el sueño de todos.
- **El grupo nunca cierra.** El chat vive 24 horas, siete días. La reunión mensual, no.
- **Los temas se mezclan.** Una fuga de agua termina en una discusión de política en cuatro mensajes.

Sin estructura, el grupo amplifica todo. Con reglas, el mismo grupo se vuelve la mejor herramienta del edificio: una fuga a las 7 de la mañana, un vecino que avisa y un plomero que llega en media hora.

## Urgente o conversación: la distinción que lo cambia todo

La regla más útil de todas cuesta una palabra: **AVISO:** al inicio del mensaje.

- **Urgencia real:** fugas, cortes de luz o agua, portón abierto de noche, seguridad. Empieza con AVISO: y lleva datos concretos.
- **Todo lo demás:** preguntas, propuestas y quejas del día. Sin mayúsculas y sin cadenas de exclamaciones: ya se va a leer igual.

Compara los dos estilos:

> "AVISO: fuga en el baño del gimnasio. Ya corté la llave de paso. Avisen al administrador."

> "ALGUIEN SABE ALGO DEL AGUA?? HAY ALGO RARO EN EL GIMNASIO Y NADIE CONTESTA"

El primero despierta a la persona correcta. El segundo despierta a los cuarenta.

## Alertas de seguridad sin sembrar pánico

El grupo de vecinos brilla cuando la seguridad importa. También es donde más se exagera. El acuerdo sano tiene cuatro puntos:

1. **Hechos, no sensaciones.** Qué pasó, en qué puerta, a qué hora y si ya se avisó a la policía.
2. **Sin fotos fuertes.** El grupo tiene familias enteras adentro.
3. **Sin reenviar alarmas de otros barrios.** Si no pasó en tu cuadra, es un rumor con patas.
4. **El episodio se cierra.** "Resuelto: la policía revisó y era falso" termina con el miedo, no lo alimenta.

## El spam de ventas y los permisos

Alguien va a vender empanadas. Alguien más va a promocionar clases de inglés. El grupo necesita una política escrita desde el día uno:

- **Modelo prohibición:** nada de ventas, y punto. Limpio, aunque pierdes al panificador del edificio.
- **Modelo feria:** se vende solo los fines de semana, con foto y precio. Ordenado y tolerante.

Cualquiera de los dos funciona. Lo que no funciona es no decidir: entonces cada vendedor empuja su propio límite y el grupo se llena de catálogos.

## El acuerdo de horario nocturno

Nada revolucionario: entre las 22:00 y las 8:00, solo urgencias. No es una función de WhatsApp: es un acuerdo de vecinos, y por eso va escrito en las reglas.

De madrugada, un mensaje no urgente despierta a la mitad del edificio. Y al que despertaste no le importa la regla que no existía.

## La rotación de administradores

El admin eterno se quema. Y el grupo quemado queda huérfano en el peor momento. Dos acuerdos que sí funcionan:

1. **Dos o tres admins a la vez.** Nunca uno solo: las vacaciones, la mudanza y el sueño existen.
2. **Rotación anual, votada en asamblea.** Cada año entra un admin nuevo y sale el más veterano.

El admin que se va entrega el mando con tres cosas: las reglas actualizadas, el enlace de invitación y la lista de vecinos autorizados.

Antes de agregar a nadie de la nada, pídele permiso por privado. La cortesía funciona en las dos direcciones: si te molesta que te agreguen sin consultar, la guía de [cómo evitar que te agreguen a grupos sin permiso](/blog/que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso) te va a resultar familiar.

## Plantilla de reglas para grupos de vecinos

> **Reglas del grupo — Vecinos de [edificio/barrio]**
> 1. Grupo para la convivencia: avisos del edificio, seguridad y acuerdos.
> 2. Las urgencias empiezan con "AVISO:" y van con datos. El resto, sin mayúsculas.
> 3. Alertas de seguridad: hecho, lugar, hora y si se avisó a la policía. Sin fotos fuertes.
> 4. Ventas: [prohibidas / solo fines de semana]. La feria de vecinos va en su grupo aparte.
> 5. De 22:00 a 8:00 solo urgencias.
> 6. Administración: tres vecinos, rotación anual votada en asamblea.
> 7. Conflictos entre vecinos: en persona o por privado. En el grupo no se juzga a nadie.
> Dos recordatorios y fuera: quien insista en romper las reglas sale del grupo y se informa en la próxima asamblea.

## Lo local manda: grupos de vecinos por ciudad

El grupo de vecinos funciona cuando los miembros viven cerca: cuanto más cerca, mejor. En el directorio se ve claro: los [grupos de WhatsApp de Madrid](/ciudad/madrid) o los [grupos de WhatsApp de Buenos Aires](/ciudad/buenos-aires) muestran cómo cada ciudad arma sus comunidades.

Ojo con el tamaño: WhatsApp admite hasta 1.024 miembros por grupo. Si tu barrio es enorme, el formato pensado para eso es la [comunidad de WhatsApp](https://www.whatsapp.com/community): un grupo de anuncios para los avisos y subgrupos por manzana o por torre. Para más órdenes de este estilo, la [sección de guías](/guias) del sitio sigue creciendo.

## Preguntas frecuentes

### ¿Quién debe administrar el grupo de vecinos?

Dos o tres personas dispuestas, con rotación anual. Un buen criterio: el admin no debería ser el portavoz de ninguna queja puntual, para que el grupo no tome partido.

### ¿Cómo evito que entren desconocidos por el enlace?

Si el enlace de invitación se compartió fuera del edificio, restablécelo. En la información del grupo: **Invitar mediante enlace → Restablecer enlace**. El enlace viejo muere al instante y se genera uno nuevo, para repartir solo entre vecinos.

### ¿Puedo echar a un vecino del grupo?

Puedes, si eres admin y el grupo lo tiene acordado por escrito. Conviene que la expulsión sea consecuencia de las reglas, no de una pelea del momento. Y que se informe en asamblea: el grupo no es un juicio, pero tampoco un misterio.

### ¿Un barrio entero cabe en un grupo de WhatsApp?

Hasta 1.024 miembros, sí. Más allá de eso, o para mantener el orden, el formato de comunidad encaja mejor: anuncios arriba y subgrupos por zona o por tema.

### ¿Qué hago si el grupo ya está en guerra?

Enfríalo. Cambia los permisos a "solo administradores" un par de días, publica las reglas de nuevo y reabre la conversación con un tema concreto. Las guerras de vecinos se apagan cortando el ruido, no gritando por encima de él.`,
  },

  {
    id: "post-126",
    slug: "reglas-grupos-de-whatsapp-trabajo-y-ventas",
    title: "Reglas para grupos de WhatsApp de trabajo y de ventas",
    excerpt:
      "Dos manuales con plantillas para copiar: la etiqueta del grupo de trabajo (horario, off-topic, audios) y el formato obligatorio del grupo de ventas (producto, precio, foto y ubicación).",
    coverEmoji: "💼",
    tags: JSON.stringify(["whatsapp", "reglas", "trabajo", "ventas"]),
    metaDescription:
      "Reglas para grupos de WhatsApp de trabajo y de ventas: etiqueta laboral y formato obligatorio de publicación, con dos plantillas para copiar y pegar.",
    daysAgo: 19,
    content: `Un grupo de WhatsApp de trabajo sin reglas termina contestando mensajes a las 23:00. Y lo peor: nadie lo decidió. Simplemente no había regla de horario, y el chat se comió la noche.

El grupo de ventas sufre el mal contrario. Sin formato, cada publicación es distinta, el "se vende" se repite diez veces y el grupo se vuelve ruido. Nadie compra en un mercado donde no se entiende nada.

Son dos mundos con dos males distintos. Por eso este artículo trae **dos sets de reglas**: uno de etiqueta laboral y otro de formato de venta. Las plantillas generales están en [reglas para grupos de WhatsApp para copiar y pegar](/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar); aquí van los dos manuales específicos.

Las **reglas de un grupo de WhatsApp de trabajo** ordenan los mensajes laborales: quién escribe, en qué horario y qué tema va a otro grupo. Las de un grupo de ventas definen el formato de cada publicación: producto, precio, foto y ubicación. Sin reglas, el grupo laboral quema y el de ventas se vuelve ruido.

## Reglas para grupos de trabajo: la etiqueta que nadie te enseña

El grupo de trabajo no es un chat de amigos con otro horario. Tiene etiqueta propia, y casi nadie la escribe. Vamos por partes.

### El horario es la regla número uno

Define una ventana: por ejemplo, de 8:00 a 18:00, de lunes a viernes. Fuera de ella, nadie está obligado a leer ni a responder. Contestar "lo veo el lunes" es una respuesta completa y educada.

La urgencia real existe. Pero la urgencia real se dice con una llamada, no con un mensaje a las 23:47 esperando el visto.

### El off-topic va a otro grupo

Los memes, los cumpleaños y la fanaticada por el equipo van al grupo social del equipo. El laboral se abre para trabajar. La prueba es simple: si un mensaje no cambiaría nada del lunes, no va ahí.

### Audios, citas y archivos

- **Audios de máximo un minuto.** Si el tema es más largo, es una reunión.
- **Responde citando el mensaje.** Diez hilos sueltos son diez conversaciones perdidas.
- **Archivos con cartel.** El archivo importante se anuncia con una línea: qué es y para quién.

### Plantilla de reglas para el grupo de trabajo

> **Reglas del equipo [nombre]**
> 1. Horario del grupo: de 8:00 a 18:00, de lunes a viernes.
> 2. Solo temas de trabajo. Memes y cumpleaños, al grupo social del equipo.
> 3. Se responde citando el mensaje, sin abrir hilos sueltos.
> 4. Audios de máximo 1 minuto.
> 5. Urgencias fuera de horario: llamada. Un mensaje de madrugada no es urgencia.
> 6. Los archivos van con una línea que explique qué son y para quién.
> 7. Nadie está obligado a contestar en su día libre.
> El que escribe a las 2 de la mañana no espera respuesta: si esperara, habría llamado.

## Reglas para grupos de ventas: el formato lo es todo

Un grupo de compraventa se gana o se pierde en el formato. Con formato, un grupo de 300 personas se lee en dos minutos. Sin formato, ni 30.

### El formato obligatorio de publicación

Toda publicación lleva cinco cosas: **PRODUCTO, ESTADO, PRECIO, UBICACIÓN y FOTO real**. Míralo en acción:

> VENDO: bicicleta rodada 26, urbana.
> ESTADO: usada, frenos nuevos.
> PRECIO: 180.000, negociables.
> UBICACIÓN: [ciudad, zona].
> FOTO: adjunta, real.

Ese mensaje se entiende en cinco segundos, se compara con otros y atrae mensajes serios. "Vendo bici, interés privado" no.

### Sin repetir publicación

La misma publicación se repite máximo una vez por semana. El repetidor profesional entierra a los demás vendedores y vacía el grupo.

Detalle honesto: el administrador no puede borrar mensajes ajenos. Se le pide al autor que lo borre y, si insiste, sale del grupo. Por eso la regla escrita importa tanto: es la única autoridad que queda.

### Quién puede publicar

En grupos grandes, la entrada se filtra: los administradores aprueban a los nuevos y el enlace de invitación se comparte solo por canales de confianza. Si el grupo se llena de gente rara, se restablece el enlace y queda limpio.

### Plantilla de reglas para grupo de ventas

> **Reglas de [nombre del grupo] — compra y venta**
> 1. Cada publicación lleva: PRODUCTO, ESTADO, PRECIO, UBICACIÓN y FOTO real.
> 2. Una misma publicación se repite máximo una vez por semana.
> 3. Precio en claro: "consultar" cuenta como publicación incompleta.
> 4. Vende solo lo tuyo. Revendedores con catálogo: hablar primero con un admin.
> 5. Prohibido: enlaces acortados, pagos por adelantado a desconocidos, datos de terceros.
> 6. Los tratos son entre las partes: el grupo no intermedia ni garantiza.
> Primera falta, recordatorio. Segunda falta, fuera del grupo.

## Herramientas de WhatsApp que ayudan

- **Permisos de envío.** El grupo del equipo se puede cerrar a "solo administradores" durante las horas no laborables o los fines de semana.
- **Comunidad con subgrupos.** Un formato intermedio: grupo de anuncios arriba y subgrupos por zona o por categoría. Buen equilibrio entre orden y participación.
- **WhatsApp Business.** Es una app aparte, pensada para vender: catálogo de productos y respuestas automáticas. No es obligatoria para vender en grupos, pero quien vende seguido la agradece. Los detalles los cuentan los propios de [WhatsApp Business](https://www.whatsapp.com/business).

Aclaremos algo honesto: WhatsApp no tiene botón para silenciar a una sola persona ni moderación automática. La moderación de un grupo de ventas es artesanal: reglas escritas y un admin despierto.

## Seguridad en la compraventa

Los grupos de venta atraen estafas como el azúcar a las hormigas. Tres señales clásicas: "págame por adelantado y te lo envío", "se me cayó la cuenta, págale a mi hermana" y precios de regalo de un desconocido sin historial. La lista completa de nueve señales está en nuestra guía de [estafas en grupos de WhatsApp](/blog/estafas-en-grupos-de-whatsapp-9-senales). Regla de oro: entrega en persona y pago al ver el producto.

## Dónde buscar y publicar grupos de venta

Si estás armando el tuyo o buscando dónde vender, el directorio ayuda:

- Los [grupos de compra y venta](/categoria/compraventa) por país y ciudad, con enlaces revisados.
- Los [grupos de negocios](/categoria/negocios) para emprendedores que buscan socios y proveedores.
- Un ejemplo de grupo serio y activo: [e-commerce y dropshipping Colombia](/grupo/e-commerce-y-dropshipping-colombia).
- En México, la tecnología tiene su propio mercado: [compra y venta CDMX: tecnología](/grupo/compra-y-venta-cdmx-tecnologia).

## Preguntas frecuentes

### ¿Puedo prohibir los audios en el grupo de trabajo?

Sí, y conviene escribirlo: "audios de máximo 1 minuto". La prohibición total también es válida, aunque suele bastar el límite. Lo que no funciona es la norma no escrita: cada uno graba lo que quiere.

### ¿El administrador puede borrar publicaciones de otros?

No. WhatsApp solo permite borrar los mensajes propios. Por eso las reglas escritas y la expulsión son las herramientas reales del admin de un grupo de ventas.

### ¿Necesito WhatsApp Business para vender en grupos?

No, es opcional. WhatsApp Business es una aplicación aparte, con catálogo y respuestas automáticas, útil para quien vende seguido. Para publicar en grupos, tu cuenta normal alcanza.

### ¿Cuánta gente aguanta bien un grupo de ventas?

El límite técnico de WhatsApp es 1.024 miembros. El límite práctico depende del formato: con publicación obligatoria y repetición controlada, cientos de miembros funcionan. Sin formato, el grupo se satura con 50.

### ¿Cómo evito que el grupo de trabajo invada mi descanso?

Regla de horario escrita en el grupo. Y de tu lado: silencia el grupo fuera de la oficina y deja las notificaciones solo para quienes sí pueden llamarte. El descanso también es parte del trabajo.`,
  },

  {
    id: "post-127",
    slug: "nombres-para-grupos-de-whatsapp-graciosos",
    title: "Nombres para grupos de WhatsApp graciosos: 200 nombres por tipo de grupo",
    excerpt:
      "200 nombres graciosos y originales para grupos de WhatsApp, por tipo: amigos, familia, primos, trabajo, estudio, fútbol, pareja, vecinos, gaming y música. Todos caben en el límite de 25 caracteres.",
    coverEmoji: "😂",
    tags: JSON.stringify(["whatsapp", "nombres", "graciosos", "grupos"]),
    metaDescription:
      "200 nombres para grupos de WhatsApp graciosos: amigos, familia, trabajo, estudio, fútbol, pareja, vecinos, gaming y música, y cómo elegir el tuyo.",
    daysAgo: 18,
    content: `A todos nos ha pasado. Creas el grupo, WhatsApp te apura con el nombre y escribes "Grupo 4". O "Familia". O "Los amigos de Juan". Con cariño: es como ponerle Perro al perro.

El nombre del grupo es la primera broma del grupo. Los buenos sobreviven años, explican un chiste de adentro y hasta ordenan el chat. Si te gustan los grupos de risa, nuestra [categoría de humor](/categoria/humor) está llena de ejemplos; aquí va el combustible: **200 nombres graciosos para grupos de WhatsApp**.

Y un compromiso: todos los nombres de esta lista caben en el límite de 25 caracteres de WhatsApp, así que los pegas tal cual, sin recortar. Están ordenados por tipo de grupo, con los sub-nichos que casi nadie cubre: estudio, peñas de fútbol y trabajo remoto. Cierra con la guía para elegir el tuyo sin quedar mal.

El **nombre de un grupo de WhatsApp** es la etiqueta con la que el grupo aparece en la lista de chats de todos los miembros. El límite es de 25 caracteres. Un buen nombre es corto, tiene sentido para los de adentro y no incomoda si un jefe o una suegra lo ve en pantalla.

## Cómo elegir un buen nombre

Antes de la lista, el método. Un buen nombre de grupo pasa cuatro pruebas:

- **La prueba del reloj.** Se escribe rápido y se lee más rápido. Si hay que respirar en el medio, es largo.
- **El sentido de adentro.** El mejor nombre resume un chiste que solo ustedes entienden. "Los invictos del sofá" solo es gracioso con contexto. Y justamente por eso funciona.
- **La prueba de la pantalla ajena.** El nombre aparece en tu lista de chats todos los días: un jefe o una suegra lo va a ver. Si te sonrojaría, no va.
- **La prueba de la voz.** Si suena bien cuando alguien lo dice en voz alta ("¿llegó algo al comité del una más?"), tiene futuro.

Un detalle técnico: el nombre se edita en la información del grupo, tocando el lápiz junto al nombre actual. Los pasos completos, con permisos y foto, están en la [guía de cómo crear un grupo de WhatsApp](/blog/como-crear-un-grupo-de-whatsapp-guia-completa).

## Un aviso antes de cambiar el nombre

Cambiar el nombre no es un acto anónimo. El grupo entero ve el nombre nuevo al instante en su lista de chats, y el cambio queda anotado en la conversación. O sea: si a las 3 de la mañana rebautizas el grupo como "Los amantes del peligro", mañana alguien preguntará quién fue.

Según la versión de la app, esos avisos de cambios los ven sobre todo los administradores. Pero el nombre nuevo lo ve todo el mundo, siempre. El anonimato no existe: la gracia sí, así que úsala con responsabilidad.

## Los 200 nombres graciosos, por tipo de grupo

Nacieron para esta lista: no son traducciones ni copias de revistas. Difícil que tu grupo ya tenga el mismo. Copia el que te haga reír y, si lleva corchetes o apellido ajeno, cámbialo por los tuyos.

### Amigos (35)

- Coartada colectiva
- El comité del "una más"
- Los invictos del sofá
- Siesteros de élite
- Huelga de responsabilidad
- Personal no indispensable
- El segundo mejor grupo
- Chamuyo central
- Alta gerencia de la joda
- Sindicato del recreo
- El "ya voy saliendo"
- Última conexión: 2019
- Los que nunca leen
- Consejos que nadie pidió
- El fondo del chat
- Jajajas de largo aliento
- El equipo de suplentes
- Organizadores de nunca
- Operación "ya llegamos"
- Los "ya me conecto"
- Resumen del chisme
- Chismes actualizados
- Vozpópuli del barrio
- El consejo de ancianos
- Juramos no contar nada
- Anécdotas bajo acuerdo
- Reyes del meme guardado
- Memes con aprobación
- Cerrado por siesta
- Exceso de confianza S.A.
- Pacto de silencio (roto)
- El secreto de la foto fea
- Madrugadores ajenos
- Agentes libres del finde
- Departamento consuelo

### Familia (25)

- La abuela ya llegó
- La abuela radar
- Papá ya manda memes
- Whatsfamilia
- Herencia en trámite
- Árbol genealógico loco
- Radio tía
- Noticiero tía, canal 24
- Reserva familiar 1995
- Crianza familiar 2001
- Parientes de urgencia
- La reunión eterna
- Navidad todo el año
- Modo telenovela
- Sobrinos favoritos club
- Los otros nietos
- Segundo turno de nietos
- Los que comparten abuela
- Quién lleva el postre
- La casa de la abuela
- Navidades en lo de la tía
- Los García & Asociados
- García & García SRL
- Familia sin garantía
- Inteligencia familiar

Cambia García por tu apellido, y el año por el del hijo mayor de la familia. Los nombres con año mejoran cada vez que alguien los pregunta.

### Primos (15)

- Los primos del casamiento
- Primos de ocasión
- Primazos del asado
- La mesa de los chicos
- Los mocosos del clan
- Plaga de primos
- Los de diciembre
- La pandilla del patio
- Primos lejos, chat cerca
- Los del fondo de la mesa
- El clan de los domingos
- El primo que llega tarde
- Tercera generación FC
- Solo nos vemos en bodas
- El comando primos

### Trabajo (20)

- Sueldos y lágrimas
- Síndrome del lunes
- Comité del lunes
- El café de la crisis
- Operación aguinaldo
- Los viernes existen
- Planilleros anónimos
- Eso era un mensaje
- Reportes que nadie lee
- Fingimos leer los correos
- Que no escuche el jefe
- Se fue el jefe
- Silencio, está RR.HH.
- Becarios al poder
- Versión final FINAL v7
- Alguien tiene el archivo?
- Perdí el bus (otra vez)
- Los del horario flexible
- Cierre de mes, abran paso
- Sobreviviendo la planilla

### Trabajo remoto (10)

- Formal de cintura arriba
- Con gato en el teclado
- La cocina es la oficina
- Se cortó, era mi internet
- Viajes a la heladera
- Café número seis
- Sin corbata desde 2020
- Sudadera ejecutiva
- Mi fondo es una playa
- Coworking del comedor

### Estudio (20)

- Mañana empiezo a estudiar
- Víspera del examen
- La foto del pizarrón
- ¿Esto entra en el examen?
- El que tiene los apuntes
- Audios de 12 minutos
- El chat de dudas tontas
- Los del último banco
- Los reyes de la prórroga
- ¿Qué tarea había?
- Inscriptos a las 23:59
- Aprobar o perecer
- Los eternos estudiantes
- Repaso de madrugada
- Maratón de los finales
- Promedio 6, ánimo 10
- Café, apuntes y desvelo
- Misión: pasar de año
- Estudiar, dormir, repetir
- Los apenas aprobados

### Peñas de fútbol (25)

- El VAR de los amigos
- DT de sillón
- Cuerpo técnico del bar
- Los invictos del domingo
- El cuarto árbitro
- Banquillo de lujo
- Los que juegan los jueves
- Fútbol 5 y frustración
- Potrero de los domingos
- La canchita del barrio
- Culpa del arquero
- Falta un 9
- Nunca fue penal
- Fue penal y lo sabés
- La pelota al 10 y corran
- Se arma el picadito
- Los que arman el partido
- Los diez del bar
- Los del tercer tiempo
- El clásico del barrio
- Los cracks del patio
- Comisión de reclamos
- Los del 4-4-2 eterno
- Dueños de la cancha 1
- La liga de la sobremesa

### Pareja (15)

- El comité de los dos
- Favoritos mutuos
- El que sí contesta
- Operación supermercado
- ¿Qué comemos hoy?
- El piloto y el copiloto
- ¿Viste mis llaves?
- La guerra del control
- Ya saliendo (hace 40 min)
- El que olvida, agradece
- Sociedad de dos
- Socios de por vida
- Pareja de hecho y derecho
- Somos un buen equipo
- El refugio de los dos

### Vecinos (15)

- El sindicato del 3B
- Asamblea escalera B
- Las 22 son las 22
- Ascensor sospechoso
- El portón, otra vez
- Taladro sábados 9 am
- Guerra fría del 2° piso
- Se fue el agua (otra vez)
- Su paquete está abajo
- ¿Llegó mi paquete?
- La novela del edificio
- Ruidos molestos S.A.
- El reclamo del mes
- Expensas: la novela
- El gasto común subió

### Gaming (10)

- Camperos anónimos
- Una más y me duermo
- La última partida
- Los primeros en caer
- El tanque del grupo
- Ganamos con ping 200
- Mala puntería, buen ánimo
- Actualización de 80 GB
- Teclado y coraje
- Nunca nos desconectamos

### Música (10)

- El coro desafinado
- Coro de bañera
- Los covers del living
- DJ y sus enemigos
- Karaoke sin miedo
- La playlist del 2009
- Puro perreo académico
- Bachata y arrepentimiento
- Rancheras y despecho
- Sin contrato discográfico

## Cómo usar la lista sin que el nombre envejezca

Tres trucos para que el nombre dure:

- **Adapta el patrón, no la copia.** Cambia el apellido, el año, la ciudad o el número. "Cierre de mes, abran paso" funciona mejor con tu mes crítico.
- **Elige con el grupo, no para el grupo.** Manda tres opciones y que voten con un emoji. El nombre votado dura más que el impuesto.
- **Revisa la categoría de adentro.** Si el grupo ya tiene un chiste propio, úsalo: los nombres de esta lista son inspiración, no obligación.

Y si quieres ver nombres con oficio en vivo, el directorio tiene ejemplos: [memes argentinos: editorial de humor](/grupo/memes-argentinos-editorial-de-humor) suena a revista de chistes, y [La Liga MX: resultados y memes](/grupo/la-liga-mx-resultados-y-memes) mezcla fútbol y risa en una línea. ¿Trabajas desde casa? Ahí también hay comunidad: [trabajo remoto para hispanos](/grupo/trabajo-remoto-para-hispanos).

## El nombre necesita una descripción

Un nombre gracioso llama la atención; una buena descripción la retiene. Juntos son la portada del grupo: el nombre hace reír y la descripción explica para qué sirve, la regla mínima y el horario. Las 60 frases listas están en [descripciones para grupos de WhatsApp](/blog/descripciones-para-grupos-de-whatsapp).

## Preguntas frecuentes

### ¿Cuántos caracteres admite el nombre de un grupo?

25 caracteres. Es el límite oficial y el motivo por el que toda esta lista lo respeta: cada nombre entra tal cual. Los detalles de este y otros límites están en el [centro de ayuda de WhatsApp](https://faq.whatsapp.com/).

### ¿Puedo usar emojis en el nombre?

Sí, y combinan bien con nombres cortos. Ten en cuenta que los emojis también ocupan espacio del límite, según la versión de la app. Un emoji al inicio suele leerse mejor que tres al final.

### ¿Quién puede cambiar el nombre del grupo?

Depende del ajuste "editar datos del grupo": todos los participantes o solo los administradores. En grupos de amigos, dejarlo abierto es parte de la gracia. En grupos de trabajo, mejor cerrado.

### ¿Cambiar el nombre avisa a los demás?

Sí. El nombre nuevo aparece de inmediato en la lista de chats de todos, y el cambio queda registrado en la conversación. En versiones recientes, ese registro lo ven sobre todo los administradores, pero el nombre nuevo lo ve todo el mundo.

### ¿Qué nombre le queda bien a un grupo de trabajo?

Uno con humor contenido: "Sueldos y lágrimas" o "Eso era un mensaje" hacen reír sin incomodar. En el trabajo, la prueba de la pantalla ajena es más estricta. Si dudás, elegí uno sobrio.`,
  },

  {
    id: "post-128",
    slug: "descripciones-para-grupos-de-whatsapp",
    title: "Descripciones para grupos de WhatsApp: 60 frases listas para copiar",
    excerpt:
      "La descripción de un grupo de WhatsApp es su cartel de presentación: hasta 500 caracteres que también quien entra por enlace lee antes de aceptar. La fórmula de qué incluir y 60 frases listas para copiar.",
    coverEmoji: "📝",
    tags: JSON.stringify(["whatsapp", "descripciones", "grupos", "frases"]),
    metaDescription:
      "Descripciones para grupos de WhatsApp: el límite real de 500 caracteres, qué incluir y 60 frases para copiar, graciosas y estéticas, por tipo de grupo.",
    daysAgo: 17,
    content: `El nombre del grupo dice quién eres. La descripción dice qué se hace ahí. Es la diferencia entre "Los invictos del sofá" y "Los invictos del sofá: planes del finde, se confirma el viernes".

La descripción es la carta de presentación del grupo: la leen los miembros, y también quien recibe el enlace, antes de aceptar. En la guía de [nombres graciosos para grupos de WhatsApp](/blog/nombres-para-grupos-de-whatsapp-graciosos) resolvimos la mitad divertida; esta es la mitad útil.

Qué incluye este artículo: el límite real del campo, la fórmula de tres partes que conviene escribir y 60 descripciones listas para copiar, entre graciosas y estéticas, por tipo de grupo.

La **descripción de un grupo de WhatsApp** es un texto de hasta 500 caracteres que vive en la información del grupo, debajo del nombre. La leen los miembros y también quien abre el enlace de invitación, antes de unirse. Sirve para explicar propósito, regla mínima y horario.

## Qué es y dónde vive la descripción

Se edita en dos toques: entra al grupo, toca el nombre y ahí está el campo **Descripción**. Debajo del nombre, siempre visible.

Quién puede editarla lo decide un ajuste: **Editar datos del grupo**, con dos opciones: todos los participantes o solo los administradores. En grupos abiertos, mejor solo admins: así la descripción no se convierte en pizarra de chistes de madrugada.

## El límite real: 500 caracteres (y quién la ve)

Dos datos duros que casi nunca se explican juntos:

- **500 caracteres.** Es el techo del campo. Parece mucho y se llena rápido: son unas 70 palabras. La app te avisa cuando te pasas.
- **La ven los de afuera.** Quien recibe el enlace de invitación ve el nombre y la descripción antes de unirse. Es tu única propaganda: decide si el enlace se convierte en miembro o en cierre de pestaña.

Consejo práctico: escribe la descripción en tus notas, con contador de caracteres, ajusta ahí y pégala lista. Así la app no te corta la frase a mitad de camino.

## Qué conviene incluir: la fórmula de tres partes

Las descripciones que funcionan combinan tres cosas, en este orden:

1. **Propósito.** Para qué existe el grupo, en una línea.
2. **Regla mínima.** Una sola, la más importante. La lista completa de reglas va mejor en un mensaje fijado: las plantillas están en [reglas para grupos de WhatsApp](/blog/reglas-para-grupos-de-whatsapp-copiar-y-pegar).
3. **Horario.** Cuándo se escribe y cuándo no.

De las tres, la regla es la que más peleas evita. "Aquí solo avisos" en la descripción cambia el grupo desde el primer día.

## Las 60 descripciones listas para copiar

Todas respetan el límite de caracteres. Cambia lo que va entre corchetes y pega. Están agrupadas por tipo de grupo.

### Amigos y humor (10)

- "Amigos del cole desde 2008. Se habla de todo y se comparten memes viejos. Regla: sin cadenas."
- "La peña del jueves: se arma el partido, se negocia la cancha y se llora el resultado. Cero spoilers."
- "Grupo de pánico mutuo. Aquí contestamos 'ya voy saliendo' y todavía estamos en pijama."
- "Sobrevivientes del colegio, unidos. Temas: todos. Política: no, para que dure la amistad."
- "El grupo más ruidoso del barrio: memes, planes de finde y audios que nadie escucha completos."
- "Risas garantizadas, planes cancelados. Si no contestamos, estamos durmiendo la siesta."
- "Comité del 'una más y nos vamos'. Historias del grupo, sin testigos externos."
- "Club de amigos con exceso de confianza. Entrar implica memes a las 7 de la mañana."
- "Los invictos del sofá: aquí se organiza todo y al final nadie sale de casa."
- "Banda del recreo eterno. Nada de cadenas ni enlaces raros: solo los chistes que solo entendemos."

### Estéticas y aesthetic (10)

- "✨ Un rincón de calma: atardeceres, canciones suaves y fotos de cafés. Aquí no hay prisa."
- "🌙 Grupo nocturno: pensamientos de las 2 am, playlists para desvelarse y silencio de día."
- "☕ Libros, lluvia y mates. Compartimos lo que nos hace bien, sin estrés y sin gritos."
- "🌿 Espacio de cosas bonitas: plantas, frases amables y cero malas vibras."
- "📷 Club de fotos de cielo: sube la mejor foto del día y contagiemos calma."
- "🤍 Estética de domingo: pancakes, música lenta y pijama hasta tarde."
- "🎧 Sonidos que acompañan: aquí se comparte música, no se discute. Solo recomendaciones."
- "🫧 Un grupo para respirar: nadie exige respuesta. Se contesta cuando el alma puede."
- "🌤️ Cielos raros: una foto del cielo de tu ciudad y ya. Sin más texto."
- "🧸 Cosas que abrazan: memes tiernos, recuerdos lindos y algo de nostalgia sana."

### Familia (5)

- "Grupo de la familia [apellido]: reuniones, cumpleaños y fotos de los niños. Cadenas prohibidas."
- "La mesa grande, en versión chat. Se coordina la cena del domingo y quién lleva el postre."
- "Familia lejana, chat cerca. Avisos importantes y fotos para la abuela. Sin audios de 10 minutos."
- "Los [apellido] oficial: solo avisos de salud, citas y viajes. Las bromas van al grupo paralelo."
- "Familiares preocupados: se pregunta antes de asustarse y se confirma antes de reenviar."

### Estudio (5)

- "Grupo de estudio de [materia]: apuntes, fechas y dudas. Se pregunta en el chat, no por privado."
- "[Grado] avisos: solo información de la escuela. El resto va al grupo de charla."
- "Estudiar acompañados, rendir en solitario. Horario activo: de 8 a 22. Suerte en los finales."
- "La biblioteca del curso: aquí viven los apuntes que alguien siempre pide. Se comparten."
- "Preparando [examen]: cronograma, dudas y motivación. Prohibido el pánico colectivo."

### Trabajo (5)

- "Equipo [área]: turnos, cambios y urgencias reales. Horario: de 8 a 18. Fuera de eso, llamada."
- "Proyecto [nombre]: avances y archivos. Cero memes: hay jefes mirando."
- "Novedades internas: fechas de pago y trámites. Lo social va en su propio grupo."
- "Coordinación del día: entregas y cobros. Audios solo si el camión está en movimiento."
- "Cambios de guardia: pedir con 48 horas de anticipación. Con menos, se contesta con un 'ja'."

### Compra y venta (10)

- "Compra y venta en [ciudad]: publica con PRODUCTO, PRECIO, ESTADO y UBICACIÓN. Sin foto no se publica."
- "Mercadito del barrio: ventas solo los sábados. Resto de la semana, avisos y preguntas."
- "Se vende y se busca en [zona]. Una repetición por semana. Precio en claro, sin 'consultar'."
- "Compraventa seria: foto real, precio fijo y ubicación. Los administradores revisan."
- "Techos, herramientas y servicios: publica lo tuyo con foto y precio. Prohibido el catálogo revendido."
- "Feria virtual de [barrio]: ropa, muebles y lo que ya no usás. Coordinen entrega en persona."
- "Compra-venta de tecnología: marca, modelo, estado y precio. Desconfía de las ofertas increíbles."
- "Vende tranquilo: máximo una publicación por semana por persona. Tratos directos, el grupo no intermedia."
- "Mercado del barrio: frutas, pan y comida casera. Pedidos con un día de anticipación."
- "Segunda mano sin vueltas: si se vende, se muestra; si se pregunta, se contesta. Sin enlaces acortados."

### Vecinos (5)

- "Vecinos de [edificio]: agua, luz, basura y reuniones. Las urgencias empiezan con AVISO:."
- "Comunidad [nombre]: horario de silencio de 22 a 8. Lo urgente al grupo, lo personal a puerta cerrada."
- "Grupo del edificio: paquetes, mantenimiento y acuerdos. Aquí no se vende ni se discute de política."
- "Barrio [nombre]: seguridad, basura y obras. Alertas con datos: qué, dónde y cuándo."
- "Vecinos en calma: se consulta antes de acusar y se dialoga antes de enojarse. Admin: rotación anual."

### Fútbol y peñas (5)

- "Peña de [equipo]: partidos, resultados y reproches. Se puede sufrir, no insultar."
- "Fútbol 5 de los jueves: asistencia confirmada hasta el miércoles. Palabra final: el que reserva."
- "La previa del partido: alineación, cancha y hora. Llegada 15 minutos antes o paga el arbitraje."
- "Fantasy entre amigos: mercado, trampas y renuncias. Se sufre con dignidad y sin spoilers."
- "Hinchas de [equipo] en [ciudad]: miramos los partidos juntos y discutimos después. Cero violencia."

### Música y hobbies (5)

- "Club de música: comparte una canción al día, con una línea que explique por qué la elegiste."
- "Karaoke amateur: canciones, planes y entrenamiento. Cantar mal es requisito de entrada."
- "Guitarras y paciencia: acordes, dudas y covers. Se comparte el proceso, no solo el resultado."
- "Culto al vinilo: hallazgos, precios y giradiscos. Las fotos de portadas siempre son bienvenidas."
- "Fotografía con móvil: reto semanal, sin premios. Se comparte y se aprende, sin miedo a la foto fea."

## Cómo escribir la tuya en cinco minutos

La fórmula, aplicada en orden: "La [tipo de grupo] de [dónde]: [propósito]. Regla: [la más importante]. Horario: [rango]."

Ejemplo montado en treinta segundos: "La peña futbolera del barrio Los Sauces: partidos de los sábados y burla organizada. Regla: se confirma hasta el jueves. Horario: de 9 a 23."

| Mejor evitar | Mejor así |
| --- | --- |
| "Grupo de todo un poco" | "Grupo de fans del [equipo]: partidos y planes" |
| Cinco reglas apretadas | Una regla clara y corta |
| "No contesto mensajes" | "Horario: de 9 a 22" |
| Frases sin contexto | Propósito, regla y horario |

La descripción no necesita ser obra de arte. Necesita responder tres preguntas: ¿qué es esto?, ¿qué no se hace aquí? y ¿hasta qué hora?

## La descripción también importa en el directorio

Cuando publiques tu grupo en [nuestro directorio de grupos](/agregar-grupo), te pedimos una descripción clara: es el primer filtro de calidad. Los grupos que llegan con buena descripción se entienden solos: mira [dev Barcelona: programación y café](/grupo/dev-barcelona-programacion-y-cafe) y cómo el nombre y la descripción se complementan.

Y si estás creando el grupo desde cero, la descripción se configura en los primeros minutos: los pasos completos están en la [guía para crear un grupo de WhatsApp](/blog/como-crear-un-grupo-de-whatsapp-guia-completa).

## Preguntas frecuentes

### ¿Cuántos caracteres admite la descripción de un grupo?

500. Es el límite del campo en las versiones actuales: unas 70 palabras, espacio de sobra para propósito, regla y horario. Los datos oficiales están en el [centro de ayuda de WhatsApp](https://faq.whatsapp.com/).

### ¿Quién puede cambiar la descripción?

Depende del ajuste "editar datos del grupo": todos los participantes o solo administradores. Si tu grupo es abierto, ciérralo a admins. Si es de amigos, déjalo abierto: las ediciones de madrugada también son humor.

### ¿La ven personas que no están en el grupo?

Sí: quien recibe el enlace de invitación la ve antes de entrar. Los demás, no. Por eso la descripción funciona a la vez como cartel y como filtro.

### ¿Los enlaces que ponga en la descripción se abren con un toque?

En la mayoría de las versiones, no: la descripción es texto plano y los enlaces no se ejecutan al tocarlos. Quien quiera entrar, los copia a mano. Mejor escribirlos cortos y claros.

### ¿Cambiar la descripción avisa al grupo?

El cambio queda anotado en el chat. En versiones recientes, esos avisos los ven sobre todo los administradores. De todos modos, la descripción nueva la ve cualquiera que abra la información del grupo.`,
  },
];

// ---------------- validation (content QA before insert) ----------------
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const problems = [];
for (const p of posts) {
  const w = wordCount(p.content);
  const max = p.id === "post-127" ? 2200 : 2000;
  if (w < 1200 || w > max) problems.push(`${p.id}: word count ${w} (1200-${max})`);
  if (p.metaDescription.length < 140 || p.metaDescription.length > 155)
    problems.push(`${p.id}: metaDescription ${p.metaDescription.length} chars (140-155)`);
  const hrefs = [...p.content.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  const dup = hrefs.filter((h, i) => hrefs.indexOf(h) !== i);
  if (dup.length) problems.push(`${p.id}: duplicated links ${JSON.stringify(dup)}`);
  const internal = hrefs.filter((h) => h.startsWith("/"));
  const external = hrefs.filter((h) => /^https?:/.test(h));
  if (internal.length < 4 || internal.length > 8)
    problems.push(`${p.id}: internal links ${internal.length} (4-8)`);
  if (external.length < 1 || external.length > 2)
    problems.push(`${p.id}: external links ${external.length} (1-2)`);
  const first150 = p.content.trim().split(/\s+/).slice(0, 150).join(" ");
  if (!/\]\(\/[^)]*\)/.test(first150))
    problems.push(`${p.id}: no internal link in first 150 words`);
  if (!p.content.includes("## Preguntas frecuentes"))
    problems.push(`${p.id}: missing FAQ section`);
  const faq = p.content.split("## Preguntas frecuentes")[1] || "";
  const qCount = (faq.match(/^### /gm) || []).length;
  if (qCount < 3 || qCount > 5) problems.push(`${p.id}: FAQ questions ${qCount} (3-5)`);
  // definition paragraph = 4th plain (non-heading/list/table/quote) block, right after 3-paragraph intro
  const blocks = p.content
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(
      (b) =>
        b &&
        !b.startsWith("#") &&
        !b.startsWith(">") &&
        !b.startsWith("-") &&
        !b.startsWith("|") &&
        !/^\d+\./.test(b)
    );
  const dw = blocks[3] ? wordCount(blocks[3]) : 0;
  if (dw < 40 || dw > 55) problems.push(`${p.id}: definition paragraph ${dw} words (40-55)`);
  if (p.id === "post-127") {
    const section = p.content.split("## Los 200 nombres")[1].split("## Cómo usar la lista")[0];
    const names = section
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .map((l) => l.slice(2).trim());
    if (names.length !== 200) problems.push(`post-127: names count ${names.length} (200)`);
    names.forEach((n) => {
      if (n.length > 25) problems.push(`post-127: name over 25 chars: "${n}" (${n.length})`);
    });
  }
  if (p.id === "post-128") {
    const section = p.content.split("## Las 60 descripciones")[1].split("## Cómo escribir")[0];
    const items = section.split("\n").filter((l) => l.startsWith("- ")).length;
    if (items !== 60) problems.push(`post-128: descriptions count ${items} (60)`);
  }
  p.readingMinutes = Math.max(1, Math.round(w / 180));
  console.log(
    `${p.id} · words=${w} · readingMinutes=${p.readingMinutes} · internal=${internal.length} · external=${external.length} · metaDesc=${p.metaDescription.length} chars · defWords=${dw}`
  );
}
if (problems.length) {
  console.error("VALIDATION PROBLEMS:\n" + problems.join("\n"));
  process.exit(1);
}

// ---------------- insert ----------------
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "grupos",
  password: "",
  database: "gruposwhatsapp",
  connectionLimit: 2,
});
for (const p of posts) {
  await pool.execute(
    `INSERT INTO blog_posts (id,slug,title,excerpt,content,coverEmoji,tags,authorName,status,metaTitle,metaDescription,readingMinutes,views,publishedAt)
     VALUES (?,?,?,?,?,?,?,?, 'published', NULL, ?, ?, 0, UTC_TIMESTAMP() - INTERVAL ? DAY)
     ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content),
     coverEmoji=VALUES(coverEmoji), tags=VALUES(tags), authorName=VALUES(authorName),
     metaDescription=VALUES(metaDescription), readingMinutes=VALUES(readingMinutes)`,
    [p.id, p.slug, p.title, p.excerpt, p.content, p.coverEmoji, p.tags, "Antonio C.", p.metaDescription, p.readingMinutes, p.daysAgo]
  );
}
await pool.end();
console.log(`cluster-5: ${posts.length} posts seeded`);
