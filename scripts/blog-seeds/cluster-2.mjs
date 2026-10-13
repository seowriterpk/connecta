// Cluster 2 — Safety & privacy (posts 106-110) — Task 10-2
// Seed script per shared brief conventions. Idempotent (ON DUPLICATE KEY UPDATE).
import mysql from "mysql2/promise";

const posts = [
  {
    id: "post-106",
    slug: "estafas-en-grupos-de-whatsapp-9-senales",
    title: "Estafas en grupos de WhatsApp: 9 señales para detectarlas antes de caer",
    excerpt:
      "Empleos que no entrevistan, cripto que duplica, soporte falso y sorteos ganados sin participar: las 9 señales de estafa que más se repiten en grupos, y el plan de emergencia si ya hiciste clic.",
    coverEmoji: "🚨",
    tags: JSON.stringify(["whatsapp", "estafas", "seguridad", "phishing"]),
    metaDescription:
      "Las estafas en grupos de WhatsApp repiten 9 señales: empleos falsos, cripto milagros, sorteos y phishing. Aprende a detectarlas y qué hacer si ya caíste.",
    daysAgo: 43,
    content: `Te meten en un grupo. Dos días de buenos días y memes. Y un martes aparece el mensaje: «oportunidad de ingreso extra, solo hoy, cupos limitados». Suena bien. Suena demasiado bien.

En [Grupos Hoy](/) leemos reportes de grupos todos los días. Y una cosa queda clarísima: las estafas en grupos de WhatsApp no son magia negra. Son guiones repetidos. Si conoces el guion, no caes.

Aquí tienes las 9 señales que más se repiten, contadas tal como llegan, más el plan de emergencia por si ya hiciste clic.

**Las estafas en grupos de WhatsApp** son engaños que usan la confianza del grupo para robar dinero o datos. Casi siempre siguen el mismo patrón: una oferta irresistible, urgencia para decidir y un paso final que te saca de la app, como un pago, un enlace o un código de verificación.

## La anatomía de la estafa en cuatro actos

Casi todos los guiones comparten estructura. Reconocerla vale por diez consejos sueltos:

1. **El acceso.** Te añaden o te tientan con un enlace. El grupo parece normal: memes, saludos, temas del día.
2. **La siembra de confianza.** Aparecen cuentas que dicen «yo participé y me pagaron». Capturas de pantalla, testimonios, entusiasmo.
3. **La urgencia.** «Últimos cupos», «cierra hoy». El objetivo es que no pienses ni consultes con nadie.
4. **La extracción.** Un pago, un enlace de phishing o un código de verificación. Ahí pierdes el dinero o la cuenta.

Con ese mapa en la cabeza, las 9 señales se leen como capítulos del mismo cuento.

## Las 9 señales, tal como llegan

### 1. El empleo que no entrevista a nadie

El mensaje dice: «se buscan personas para trabajo remoto, sin experiencia, pago diario». Nadie te pide currículum. Nadie te llama. Nadie pregunta nada de ti. Al tercer día llega «el kit de inicio»: deposita 300 pesos para «activar tu cuenta» o «asegurar tu turno».

Regla simple: un empleo de verdad nunca te cobra por entrar. En los [grupos de empleo honestos](/categoria/empleo) la gente comparte vacantes, no «depósitos de garantía». Si te piden dinero para trabajar, no es trabajo. Es la factura de la ilusión.

### 2. «Duplica tu dinero» con cripto

Alguien presume capturas de ganancias. «Empecé con 100 dólares y ya tengo 900.» Después te ofrece pasar con un «asesor de inversión» por privado. El asesor manda un enlace a una plataforma que nunca escuchaste nombrar. Tu dinero viaja a una cuenta desconocida. Y no vuelve.

Nadie duplica el dinero de un desconocido de WhatsApp. Nadie. La promesa suena a atajo y es un pozo. Si la «inversión» solo existe dentro de un grupo y un asor por privado, no existe.

### 3. El falso soporte de WhatsApp

Aparece una cuenta con el logo de WhatsApp y nombre tipo «Soporte Oficial». Escribe en el grupo: «su cuenta será suspendida, verifíquela aquí». El enlace pide tu número y un código de 6 dígitos.

WhatsApp no escribe así, jamás. El soporte real no ronda los grupos buscando «verificar» a la gente. Y el código de 6 dígitos que te llega por SMS es la llave de tu cuenta: quien lo tiene, puede registrar tu número en otro teléfono. Ese código no se comparte con nadie. Ni con tu madre.

### 4. El sorteo que ganaste sin participar

«¡Felicidades! Ganaste un iPhone. Solo paga el envío.» O el clásico: «reenvía este mensaje a 10 grupos para reclamar tu premio». Si no te inscribiste a nada, no ganaste nada. El premio falso siempre tiene un costo chico de «liberación», «aduanas» o «envío». Ese costo chico, multiplicado por cientos de víctimas, es la estafa entera.

### 5. Enlaces acortados que imitan a tu banco

Llega un enlace bit.ly o parecido con texto urgente: «verifica tu cuenta bancaria en 24 horas». Abre una página idéntica a la de tu banco. Igual de colores, igual de seria. Pero el dominio es raro: \`banco-seguro-24h.com\` en vez del oficial.

Consejo de abuela que funciona: si «tu banco» te escribe por WhatsApp, no abras el enlace. Abre la app del banco directamente o teclea tú la dirección. Los dominios verdaderos no viajan escondidos en acortadores.

### 6. Urgencia y «solo queda hoy»

«Últimos 3 cupos.» «La oferta cierra en una hora.» «Mañana ya no se puede.» La urgencia apaga el cerebro: te quita el tiempo justo que necesitas para consultar, googlear o dormirlo una noche. Una oferta honesta sobrevive a una noche de sueño. Si algo se cae porque «pensaste demasiado», te hicieron un favor.

### 7. Te sacan del grupo y te escriben al privado

El grupo funciona como vidriera: ahí se construye la confianza, con testigos y ambiente. Pero la propuesta concreta llega por privado, uno a uno. «No lo comentes en el grupo», dicen. Claro: en el grupo hay gente que podría alertarte. En el privado, no. Cuando la conversación emigra del grupo al chat personal con un desconocido, sube la alerta.

### 8. El «admin nuevo» que pide tu código

«Hola, soy el nuevo administrador. Confirma tu número con el código que te llegó.» Los administradores de verdad jamás piden códigos de verificación. Ese mensaje tiene un solo significado: alguien está intentando robar tu cuenta. Bloquea, reporta y avisa en el grupo. Si el falso admin ya expulsó al verdadero, tu aviso salva al resto.

### 9. Perfil recién estrenado y «soy tu primo»

Cuenta sin foto, sin estado, sin número que reconozcas. O el clásico del cambio de número: «soy tu primo, ya no uso el otro número», y a los dos mensajes pide dinero para una urgencia. Ante la duda, llama al número viejo. La voz resuelve en diez segundos lo que el texto complica por horas.

## Qué hacer si ya hiciste clic (o ya pagaste)

No entres en pánico. Entra en modo bombero, en este orden:

1. **Para de pagar.** No existe un «segundo pago para desbloquear el primero». Esa es la segunda vuelta de la estafa, diseñada para los que ya cayeron una vez.
2. **Llama a tu banco ya.** Pide congelar la tarjeta y revertir la operación. Los primeros minutos valen más que cualquier reclamo posterior.
3. **Cambia tus contraseñas** desde otro dispositivo, por si el enlace robó datos de acceso. Empieza por el correo: es la llave de todo lo demás.
4. **Reporta el mensaje dentro de WhatsApp.** Mantén pulsado el mensaje y elige «Reportar». Se envían los mensajes recientes para revisión, tal como explica la [ayuda oficial de WhatsApp](https://faq.whatsapp.com/).
5. **Activa la verificación en dos pasos.** Ajustes → Cuenta → Verificación en dos pasos. Un PIN de 6 dígitos blinda tu cuenta contra futuros intentos.
6. **Reporta el grupo si lo encontraste por nuestro directorio.** Usa el [formulario para reportar grupos](/reportar-grupo): lo comprobamos y lo quitamos del listado para que nadie más caiga detrás de ti.

## Lo que NO es una estafa (para no volverse paranoico)

Una vecina que vende tortas con fotos reales y entregas en persona no es una estafa. Un grupo con reglas, admin presente y gente que se conoce de años tampoco. La diferencia está en los pasos: la confianza honesta se construye despacio, admite preguntas y nunca te pide dinero para «activar» nada. Duda de las prisas, no de las personas.

## Cómo encaja esta guía con nuestra guía de grupos seguros

Ya publicamos una [guía para encontrar grupos de WhatsApp seguros](/blog/como-encontrar-grupos-de-whatsapp-seguros-2026) que mira el antes: criterios para elegir bien, enlaces vivos y señales de grupos abandonados. Esta guía mira el durante: qué hacer cuando la trampa ya está adentro del grupo. Léelas en ese orden y tienes el camino completo.

Para completar el círculo, mira [qué ven los desconocidos de ti en un grupo público](/blog/es-seguro-unirse-a-grupos-de-whatsapp-publicos) y [cómo denunciar un grupo desde la app](/blog/como-denunciar-un-grupo-de-whatsapp).

## Preguntas frecuentes

### ¿WhatsApp me devuelve el dinero si me estafan en un grupo?

No. WhatsApp suspende cuentas y bloquea enlaces, pero no toca tu dinero. La recuperación pasa por tu banco, y solo si avisas rápido.

### ¿Basta con salirme del grupo si veo una estafa?

Salirte te protege a ti. Reportar protege a los que quedan. Hazlo en ese orden si quieres, pero hazlo todo: mantén pulsado el grupo y elige «Reportar».

### ¿Puedo infectar mi móvil con solo leer un mensaje?

No. Leer texto no infecta nada. El peligro está en abrir enlaces, instalar archivos o compartir códigos de verificación.

### ¿Cómo reconozco un enlace de phishing a simple vista?

Mira el dominio, justo antes de la primera barra. Guiones raros, números o palabras como «seguro24h» delatan la copia. Ante la duda, no cliques: teclea la dirección tú mismo.

### ¿Pueden robarme la cuenta con mi foto de perfil?

No. La foto sola no da acceso a nada. Las cuentas se roban con el código de 6 dígitos, y por eso ese código no se comparte nunca.`,
  },

  {
    id: "post-107",
    slug: "es-seguro-unirse-a-grupos-de-whatsapp-publicos",
    title: "¿Es seguro unirse a grupos de WhatsApp públicos? La respuesta honesta",
    excerpt:
      "Sí, es seguro, con condiciones: qué ven los desconocidos de ti, qué no pueden hacer y la checklist de 5 ajustes para entrar a grupos públicos con tu privacidad blindada.",
    coverEmoji: "🤝",
    tags: JSON.stringify(["whatsapp", "seguridad", "privacidad", "consejos"]),
    metaDescription:
      "¿Es seguro unirse a grupos de WhatsApp? Qué ven los desconocidos de ti, qué no pueden hacer y la checklist de ajustes para entrar protegido.",
    daysAgo: 42,
    content: `Un grupo de recetas. Uno de fútbol. Uno del barrio. Unirse es gratis, rápido y casi irresistible. Pero la pregunta da vueltas: ¿y si entra gente rara?

La respuesta corta: sí, es seguro, con condiciones. En [nuestro buscador](/buscar) filtramos grupos a diario y el problema casi nunca es «entrar». Es lo que haces después. Aquí va la explicación honesta, sin alarmismo y sin ingenuidad.

**Unirse a grupos públicos de WhatsApp es seguro** si configuras tu privacidad antes de entrar y no compartes datos personales dentro. Los desconocidos solo ven lo que tú dejas a la vista, y nadie puede «hackearte» por coincidir en un grupo.

## Qué ven de ti los desconocidos del grupo

Empecemos por la verdad incómoda: tu número de teléfono lo ven todos. No hay ajuste para ocultarlo, porque el número es tu identificación dentro de la app. Tu nombre visible también se muestra, tal como lo escribiste en tu perfil.

El resto depende de tus ajustes de privacidad:

| Lo que ven | Depende de | Dónde se ajusta |
|---|---|---|
| Tu número de teléfono | Siempre | No se puede ocultar |
| Tu foto de perfil | Ajuste «Foto de perfil» | Ajustes → Privacidad |
| Tu «última vez» y «en línea» | Ajuste «Última vez» | Ajustes → Privacidad |
| Tu info (Acerca de) | Ajuste «Info» | Ajustes → Privacidad |
| Tus estados | Ajuste «Estados» | Privacidad de estados |

Un detalle justo: si ocultas tu «última vez» a alguien, tampoco verás la suya. WhatsApp lo hace mutuo para que nadie espíe gratis. La privacidad es un pacto, no una ventanita.

## Lo que NO pueden hacer (miedos exagerados)

Los grupos públicos tienen mala prensa injusta. Repasemos lo que un desconocido **no** puede hacer solo por compartir grupo contigo:

- No ve tu lista de contactos.
- No ve tus otros chats.
- No ve tu ubicación, salvo que la compartas en el grupo.
- No puede «infectar» tu móvil con un mensaje de texto. Para dañarte necesita que abras un enlace o instales algo.
- No puede averiguar tu dirección ni tu DNI. Eso solo sale si lo publicas.

Vale, tu número queda expuesto. ¿Es grave? Depende de qué hagas con eso. Con tu número, alguien puede escribirte. Ya está. De ahí en adelante tú decides si respondes, bloqueas o reportas. El control sigue en tu lado.

## El truco del número aparte

Si entras a muchos grupos públicos, hay una táctica que la gente prudente usa desde hace tiempo: un número aparte. Una segunda línea, una eSIM barata o un chip viejo. Ese número entra a los grupos; tu número de toda la vida queda solo para familia y trabajo.

La ventaja es limpieza total: si el número secundario recibe spam, no pasa nada. Lo bloqueas, lo silencias o incluso lo cambias sin drama. La desventaja es el mantenimiento: cargarlo, revisarlo de vez en cuando y no confundir cuentas. Para quien entra a grupos todos los meses, el canje compensa. Para quien entra a dos o tres, con la checklist de abajo alcanza.

## Checklist antes de entrar (5 minutos que valen oro)

1. **Foto de perfil → «Mis contactos».** Ajustes → Privacidad → Foto de perfil. Los extraños verán el avatar vacío. Si usas tu cara como foto, este ajuste es el primero.
2. **Última vez → «Mis contactos» o «Nadie».** Nadie del grupo sabrá a qué hora duermes o cuándo estás en línea.
3. **Info → algo neutro.** «Disponible» funciona mejor que tu ciudad, tu cumpleaños o tu dirección. La info la ve todo el grupo.
4. **Estados → «Mis contactos».** Los estados personales no son para 300 desconocidos. Filtra quién los ve.
5. **Verificación en dos pasos activada.** Ajustes → Cuenta → Verificación en dos pasos. Ese PIN de 6 dígitos es el candado contra robos de cuenta.

WhatsApp describe estos ajustes en su [página oficial](https://www.whatsapp.com/), por si quieres leerlos con sus palabras antes de tocar nada.

## El riesgo real empieza después de entrar

Estar en el grupo no te hace nada. El riesgo llega después: alguien te escribe al privado, aparece «la oportunidad», cae un enlace del cielo. Las [estafas en grupos de WhatsApp tienen 9 señales claras](/blog/estafas-en-grupos-de-whatsapp-9-senales) y conviene conocerlas antes de entrar a cualquier grupo público. Detección temprana, cero sorpresas.

La estadística aburrida también ayuda: la mayoría de los grupos públicos son exactamente lo que prometen. Gente que habla de fútbol, de cocina o de emprendimiento. Los casos feos existen, pero se concentran en los grupos que prometen dinero fácil o premios sin sorteo. Ahí es donde hay que tener los ojos abiertos.

Otra buena señal es la moderación. Un admin que publica reglas, limpia el spam y contesta dudas es media seguridad del grupo. En nuestro directorio de [grupos de amistad](/categoria/amistad) tienes ejemplos con descripción clara y actividad real, como este [grupo de café y charla en Madrid](/grupo/cafe-y-charla-amistades-en-madrid). Grupos así se sostienen solos.

## Cómo entrar con cabeza (los primeros días)

- **Mira antes de hablar.** Unos días de lectura te muestran el tono del grupo, quién manda y qué circula.
- **Fíjate en la vida del grupo.** Fecha del último mensaje, variedad de voces, si la gente responde entre sí. Un grupo con un solo hablante es un altavoz, no una comunidad.
- **Primer mensaje neutro.** Un saludo y una pregunta del tema. Nada de datos personales, ni tu ciudad completa, ni fotos de tu casa.
- **Desconfía de las encuestas con premio.** «Llena el formulario y participa» es cosecha de datos. Tu correo y tu teléfono abren otras puertas: trátalos como llaves.
- **Privado solo con confianza.** Si alguien del grupo te escribe, contesta si quieres. Pero aplica el mismo filtro que aplicarías a un desconocido en la calle.
- **Reporta sin culpa.** Si aparece spam o estafas, mantén pulsado el mensaje y reporta. Los grupos sanos se limpian entre todos.

## Grupos públicos vs grupos con enlace repartido a mano

La diferencia real es la puerta. En un grupo público, el enlace circula por directorios y redes: entra quien lo encuentra. En uno cerrado, el admin reparte el enlace a mano y puede revocarlo con «Restablecer enlace» cuando quiera.

¿Cuál es más seguro? Ninguno por definición. Un grupo público con admin serio es más seguro que un grupo «privado» lleno de estafadores. Manda el criterio de quien administra, no el tipo de puerta.

## Si te añaden sin permiso

Y si el problema no es entrar tú, sino que te meten a la fuerza, hay un ajuste para eso. Te contamos la ruta completa en [cómo evitar que te añadan a grupos sin tu permiso](/blog/que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso). Spoiler: dos toques y el spam de añadidos se termina.

## Preguntas frecuentes

### ¿Los miembros del grupo ven mi número de teléfono?

Sí. Es inevitable: WhatsApp identifica a las personas por número. La única forma de ocultarlo del todo es entrar con un número aparte.

### ¿Puedo ocultar mi número dentro de un grupo?

No existe ese ajuste. Puedes ocultar foto, última vez e info, pero el número es tu identidad en la app. Lo demás sí se blinda.

### ¿Los administradores ven más datos que los demás?

No. Ven lo mismo que cualquier miembro, según tus ajustes. Solo tienen poderes de gestión: expulsar gente, revocar el enlace o nombrar admins.

### ¿Un grupo con invitación es más seguro que uno público?

Depende de quién reparte la invitación. Un admin que revoca enlaces controla la puerta. Pero un enlace «privado» publicado en un directorio ya es público en la práctica.

### ¿Me pueden robar la cuenta por estar en un grupo público?

No por el simple hecho de estar. Los robos pasan por el código de verificación de 6 dígitos. Si no lo compartes con nadie, tu cuenta sigue siendo tuya.`,
  },

  {
    id: "post-108",
    slug: "que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso",
    title: "Que nadie te añada a grupos de WhatsApp sin tu permiso: ajustes paso a paso",
    excerpt:
      "La ruta exacta del ajuste «Quién puede añadirme a grupos» en Android e iPhone, qué pasa cuando alguien intenta meterte igual y los ajustes hermanos de foto y última vez.",
    coverEmoji: "🛑",
    tags: JSON.stringify(["whatsapp", "privacidad", "ajustes", "grupos"]),
    metaDescription:
      "Ajuste «Quién puede añadirme a grupos»: la ruta exacta en Android e iPhone para que nadie te meta en grupos de WhatsApp sin tu permiso, y qué pasa luego.",
    daysAgo: 41,
    content: `Una tía te agrega a la promo del súper. Un compañero te agrega al grupo de la quiniela. Y un desconocido te agrega a un grupo de «inversiones» con 400 extraños. Che, basta.

En [Grupos Hoy](/) nos llegan quejas por añadidos ajenos todos los días. La privacidad de los grupos de WhatsApp tiene arreglo, y tarda menos que quejarse. WhatsApp incluye un ajuste llamado «Quién puede añadirme a grupos». Aquí va la ruta exacta, en Android y en iPhone, y todo lo que pasa después de activarlo.

El ajuste **«Quién puede añadirme a grupos»** controla quién puede meterte en grupos de WhatsApp sin tu consentimiento. Al limitarlo, los desconocidos ya no te añaden directo: te llega una invitación por chat privado y decides tú. La invitación caduca sola si la ignoras.

## Por qué existe este ajuste

Durante años, cualquiera con tu número podía meterte en grupos sin avisar. Los vendedores de humo lo explotaron: listas de números, añadidos masivos, grupos de spam que nacían con 200 rehenes. Las quejas llovieron y WhatsApp respondió con este control. Hoy el añadido silencioso es opcional, no una condena.

¿Y los grupos enormes? El límite de 1.024 miembros por grupo lleva años fijo. Pero el problema nunca fue el tamaño: fue la puerta abierta. Cualquier lista de números servía para llenar un grupo de rehenes en minutos. Cerrar la puerta cambió el negocio del spam, y este ajuste fue la llave.

## La ruta exacta en Android

1. Abre WhatsApp y toca los **tres puntos** (arriba a la derecha).
2. Entra en **Ajustes**.
3. Toca **Privacidad**.
4. Elige **Grupos**: el ajuste se llama «Quién puede añadirme a grupos».
5. Marca la opción que quieras:
   - **Todos**: cualquiera puede añadirte directo. No lo recomendamos.
   - **Mis contactos**: solo la gente que tienes agendada.
   - **Mis contactos excepto…**: tus contactos, menos una lista de pesados.
   - **Nadie**: nadie te añade directo. Todos deben mandarte invitación.

## La ruta exacta en iPhone

1. Abre WhatsApp y entra en **Ajustes** (pestaña de abajo a la derecha).
2. Toca **Privacidad**.
3. Elige **Grupos**.
4. Marca entre **Todos**, **Mis contactos**, **Mis contactos excepto…** y **Nadie**.

La pantalla es la misma en ambos sistemas. El nombre del ajuste no cambia: «Quién puede añadirme a grupos». Si no lo encuentras, actualiza la app: el ajuste lleva años disponible, pero las versiones muy viejas no lo traen.

## Qué opción conviene según tu caso

| Opción | Qué pasa | Para quién |
|---|---|---|
| Todos | Cualquiera te añade directo | Casi nadie |
| Mis contactos | Solo gente agendada te añade | La mayoría |
| Mis contactos excepto… | Filtras a los pesados de tu agenda | Si tienes un «añador» serial |
| Nadie | Todo pasa por invitación | Máxima tranquilidad |

El truco fino: elige «Mis contactos excepto…» y marca todos los contactos de golpe. Resultado: nadie te añade directo, pero tus allegados siguen pudiendo invitarte por privado. Es el punto dulce entre comodidad y silencio.

## Qué pasa cuando alguien intenta añadirte igual

Con el ajuste limitado, WhatsApp bloquea el añadido directo. Quien intente meterte recibe un aviso y debe mandarte una **invitación por chat privado**. A ti te aparece un mensaje con el nombre del grupo y un botón para unirte si quieres.

Esa invitación no es eterna: en las versiones actuales caduca a las 72 horas. Si la ignoras, se muere sola. El otro no recibe un rechazo escandaloso; su invitación simplemente se disuelve. El spam masivo se queda sin combustible, porque los estafadores necesitan añadidos instantáneos, no invitaciones que caducan. El funcionamiento exacto de estas invitaciones lo explica WhatsApp en su [página de ayuda](https://faq.whatsapp.com/), por si quieres leerlo con sus palabras.

Para ti, la invitación llega como un chat normal: nombre del grupo, foto y un botón para unirte. Puedes tocarlo y entrar, o dejarlo ahí hasta que expire. Nadie te apura, y ese pequeño control es justo lo que faltaba en la época de los añadidos sorpresa.

## La otra mitad: qué ven de ti los desconocidos

Este ajuste frena el añadido, no todo. Cuando entras a un grupo, los extraños siguen viendo tu número. Y tu foto, tu «última vez» y tu info, según tus ajustes. En [nuestra guía sobre la seguridad de los grupos públicos](/blog/es-seguro-unirse-a-grupos-de-whatsapp-publicos) tienes la checklist completa: foto solo para contactos, última vez oculta e info neutra. Cuesta cinco minutos y cubre el resto del frente.

### La tabla de los ajustes hermanos

| Ajuste | Opciones | Recomendación para grupos |
|---|---|---|
| Foto de perfil | Todos / Mis contactos / Nadie | «Mis contactos» |
| Última vez | Todos / Mis contactos / Nadie | «Mis contactos» o «Nadie» |
| Info (Acerca de) | Todos / Mis contactos / Nadie | «Mis contactos», texto neutro |
| Estados | Mis contactos / Solo compartir con… | Lista corta de confianza |

Los cuatro viven en la misma ruta: Ajustes → Privacidad. Si ya fuiste ahí para el ajuste de grupos, tardas un minuto en repasar los demás de paso. Salir de Ajustes con todo blindado es una de esas pequeñas victorias que no se celebran lo suficiente.

## Si el problema es un enlace, no un añadido

Ojo con esto: el ajuste solo frena que te **metan**. Si tú haces clic en un enlace de invitación, entras por decisión propia y ningún ajuste te detiene. Por eso conviene mirar antes de clicar, sobre todo si el enlace llegó por un anuncio raro o un mensaje reenviado mil veces. Para elegir con contexto, el [buscador de grupos](/buscar) muestra descripción, categoría y país antes de entrar. Y si quieres patrullar más terreno, nuestra [sección de guías](/guias) cubre el resto de los ajustes de la app, paso a paso.

## Si ya estás dentro y solo quieres paz

Y si ya caíste en el grupo y solo buscas silencio, tienes dos caminos: el frontal (salir) y el silencioso (silenciar o archivar). Te contamos ambos, con sus exactos, en [cómo salir de un grupo sin que se den cuenta](/blog/como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta). Activa el ajuste de añadidos y no volverán a meterte.

## Preguntas frecuentes

### ¿Dejaré de recibir invitaciones si elijo «Nadie»?

No. Las invitaciones te siguen llegando por chat privado. La diferencia: tú decides con calma, y nadie te despierta dentro de un grupo de 200 desconocidos.

### ¿La otra persona se entera de que la bloqueé para añadirme?

No hay aviso. El ajuste no manda un «te bloquearon». Su intento simplemente se convierte en invitación o se queda sin efecto, según lo que hayas elegido.

### ¿Puedo dejar que solo mi jefe me añada?

El ajuste trabaja sobre tu agenda. Con «Mis contactos excepto…» decides quién puede añadirte, contacto por contacto. No existe una lista blanca aparte de la agenda.

### ¿El ajuste también frena las comunidades?

En las comunidades manda el administrador: él agrupa los subgrupos que quiere. Este ajuste apunta a los grupos clásicos, donde cualquiera con tu número podía añadirte sin pedirte permiso.

### ¿Sirve de algo si ya me añadieron?

Sí, para la próxima. Sal del grupo molesto, activa el ajuste y problema resuelto. Si el grupo era spam o estafa, además repórtalo dentro de la app: le ahorras el mal rato al que viene detrás. El ajuste no borra el pasado, pero cambia el futuro de tus notificaciones.`,
  },

  {
    id: "post-109",
    slug: "como-denunciar-un-grupo-de-whatsapp",
    title: "Cómo denunciar un grupo de WhatsApp (y qué pasa después de denunciar)",
    excerpt:
      "Paso a paso para denunciar un grupo desde la app en 30 segundos, qué revisa WhatsApp realmente y cuándo además reportarlo en el directorio para proteger a todos.",
    coverEmoji: "🚩",
    tags: JSON.stringify(["whatsapp", "denunciar", "seguridad", "consejos"]),
    metaDescription:
      "Cómo denunciar un grupo de WhatsApp paso a paso, qué revisa la app después de tu denuncia y cuándo reportarlo también en el directorio para todos.",
    daysAgo: 40,
    content: `El grupo empezó inofensivo. Ahora es un mercadillo de estafas, spam o algo peor. Cerrar la app no lo arregla: el grupo sigue vivo para otros cientos de personas.

Denunciar toma 30 segundos y es anónimo. Aquí va el paso a paso exacto en Android e iPhone, qué hace WhatsApp con tu denuncia y cuándo conviene además reportar el grupo en [nuestro directorio](/).

**Denunciar un grupo de WhatsApp** avisa al equipo de la app para que revise su contenido y sancione a quien rompe las normas. Se hace desde el propio grupo: mantener pulsada la conversación, elegir «Reportar» y confirmar. La denuncia es anónima para los demás miembros.

## Cuándo denunciar (y cuándo basta con salir)

Denuncia cuando el grupo rompe las reglas: estafas, enlaces de phishing, contenido ilegal, acoso o spam masivo. Ese contenido daña a la gente que todavía no lo vio.

Ejemplos concretos: un grupo que promete duplicar dinero, un enlace que clona la web de tu banco, alguien que acosa a una integrante, material ilegal de cualquier tipo. Si dudas entre «molestoso» y «denunciable», pregúntate si el contenido puede dañar a la próxima persona que entre. Si la respuesta es sí, reporta.

Si el grupo es sano pero te aburre, no hace falta denunciar. Sal y listo. Saber [cómo salir de un grupo sin hacer ruido](/blog/como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta) es educación digital básica. Reportar es un botón de emergencia, no un botón de disgusto.

## Paso a paso en Android

1. Abre la lista de **Chats**.
2. **Mantén pulsado** el grupo: toque largo sobre la conversación.
3. Toca el menú de **tres puntos**, arriba a la derecha.
4. Elige **«Reportar»**.
5. Decide si marcas la casilla **«Bloquear al grupo y salir»**.
6. Confirma pulsando **«Reportar»** de nuevo.

También funciona desde dentro: abre el grupo, toca el nombre y baja hasta «Reportar grupo». En algunas versiones el botón queda al final de la información, debajo de la descripción.

## Paso a paso en iPhone

1. En la lista de chats, **desliza el grupo hacia la izquierda**.
2. Toca **«Más»**.
3. Elige **«Reportar»**.
4. Marca (o no) **«Bloquear y salir del grupo»**.
5. Confirma.

Otra ruta: entra al grupo, toca el nombre y baja hasta «Reportar grupo». El camino cambia según la versión; el destino es el mismo.

## ¿Marcar «bloquear y salir» o no?

| Si marcas la casilla | Si no la marcas |
|---|---|
| Sales del grupo y lo bloqueas | Sigues dentro |
| No pueden volverte a añadir ni escribirte | Puedes juntar más pruebas |
| Ideal si el grupo es basura total | Ideal si quieres vigilar un rato |

Ojo con un detalle: reportar no te obliga a salir. Puedes denunciar desde dentro y quedarte mirando. Aunque, siendo honestos, si el grupo es una pocilga, salir bloqueando te ahorra tentaciones y reañadidos.

## Denunciar un mensaje suelto o el grupo entero

No siempre el problema es el grupo completo. A veces el resto está bien y solo una persona rompe todo. En ese caso, reporta el mensaje concreto: mantén pulsado el mensaje → «Reportar» → confirma. WhatsApp recibe ese mensaje y los más recientes del chat para contexto.

La diferencia importa:

- **Reportar el grupo** sirve cuando el problema es el ambiente: spam masivo, estafas al por mayor, contenido ilegal repetido.
- **Reportar un mensaje** sirve cuando el grupo anda bien y un solo usuario pasó de raya.

Y si el mensaje molesto llegó por privado, el mismo botón funciona igual: mantén pulsado y «Reportar», con opción de bloquear en el mismo paso. Denuncia, bloquea y a otra cosa.

## Qué revisa WhatsApp realmente

Al denunciar, WhatsApp recibe la información del grupo y **los mensajes más recientes**. No tu historial privado, no tu lista de contactos: los últimos mensajes del grupo, para contexto. Un equipo los revisa contra las normas de uso.

Si encuentra infracción, puede suspender la cuenta del responsable o cortar la difusión del enlace. Lo que WhatsApp **no** hace: llamar a la policía, juzgar a nadie ni mandarte un parte con el resultado. La denuncia es una señal, no un juicio. Para temas graves, guarda capturas con fecha y acude a las autoridades de tu país. WhatsApp explica su proceso de revisión en la [ayuda oficial](https://faq.whatsapp.com/).

Conviene saberlo para no frustrarse: no hay un «juez» que te dé la razón en 24 horas. Hay un filtro que actúa en silencio, a su tiempo. Por eso la denuncia va mejor acompañada de acciones tuyas: bloquear, avisar a los demás, retirar el enlace de la circulación si está a tu alcance.

## Y también en el directorio (esto nos toca a nosotros)

Si el grupo lo encontraste por Grupos Hoy, denunciarlo solo en la app no alcanza para nuestros lectores. El enlace seguiría listado y otros caerían detrás de ti.

Para eso existe el [formulario para reportar grupos](/reportar-grupo): nos avisas, comprobamos el reporte y lo quitamos del directorio para todos. Un aviso tuyo limpia el camino de cientos de personas. Ese es el acuerdo: la app sanciona cuentas, nosotros sacamos el grupo de la vitrina.

Si dentro del grupo viste estafas, repasa las [9 señales de estafas en grupos de WhatsApp](/blog/estafas-en-grupos-de-whatsapp-9-senales) antes de escribir el reporte. Te ayudan a describir el problema con precisión y ahorrar tiempo de revisión.

## Después de denunciar: cuatro hábitos que suman

1. **Guarda evidencia antes de salir.** Capturas con la fecha visible. Si el caso escala, las vas a querer a mano.
2. **Bloquea** a los usuarios que insistan por privado. Bloquear y reportar van de la mano.
3. **Avisa en el grupo si aún estás.** Un «esto ya fue reportado» frena más de un entusiasta. El miedo al escrache desactiva estafadores novatos.
4. **Revisa tus otros grupos.** Los enlaces de phishing viajan de grupo en grupo como resfrío en invierno.

¿Y si el grupo vuelve con otro nombre? Suele pasar con el spam: cierran uno y renace otro con enlace nuevo. La defensa es la misma: reporta el grupo nuevo, bloquea al mensajero y activa el ajuste que decide [quién puede añadirte a grupos](/blog/que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso). La app actúa cuenta por cuenta; tú cortas la puerta de entrada. La constancia gana.

Para más manuales con pasos claros, nuestra [sección de guías](/guias) cubre todo el repertorio de la app.

## Preguntas frecuentes

### ¿Se enteran de que fui yo quien denunció?

No. WhatsApp no revela quién denunció. Nadie del grupo recibe tu nombre. Elige el momento sin miedo.

### ¿Cuántas denuncias hacen falta para cerrar un grupo?

No hay un número público. Una sola denuncia ya activa la revisión. Si varias personas reportan, el caso pesa más y se resuelve antes.

### ¿Puedo denunciar si ya salí del grupo?

Es más fácil desde dentro. Si ya saliste, reporta los mensajes concretos que te llegaron por privado (mantén pulsado → «Reportar») o pide a alguien que siga dentro que lo haga por ti.

### ¿Denunciar comparte mis chats privados?

No. Se envían los mensajes recientes del grupo, no tus conversaciones personales. El material va solo al equipo de revisión de WhatsApp.

### ¿WhatsApp me avisa del resultado?

Casi nunca. La app actúa en silencio: suspende cuentas o desactiva enlaces sin mandarte un informe. No esperes correo de confirmación.`,
  },

  {
    id: "post-110",
    slug: "como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta",
    title: "Cómo salir de un grupo de WhatsApp sin que se den cuenta",
    excerpt:
      "Hoy solo los administradores ven que saliste. La verdad del cambio, la etiqueta para irte sin herir a nadie y las alternativas silenciosas: silenciar y archivar.",
    coverEmoji: "🚪",
    tags: JSON.stringify(["whatsapp", "grupos", "etiqueta", "privacidad"]),
    metaDescription:
      "Cómo salir de un grupo de WhatsApp sin que se den cuenta: quién ve el aviso hoy, la etiqueta de salida y alternativas como silenciar o archivar.",
    daysAgo: 38,
    content: `El grupo de la familia lleva tres años y 240 mensajes diarios. El 40% son buenos días. Amas a esa gente. Y también quieres tu paz mental sin herir a nadie.

Buena noticia: salir ya no es el escándalo que era. En [Grupos Hoy](/) resolvemos esta duda cada semana. Las versiones recientes de WhatsApp apagaron el altavoz: al salir, el aviso solo lo ven los administradores. Aquí van la verdad del cambio, la etiqueta correcta y las alternativas silenciosas.

**Salir de un grupo de WhatsApp** hoy deja un aviso visible solo para los administradores, en las versiones recientes: el clásico «X salió del grupo» ya no lo ve todo el mundo. Los demás miembros no reciben notificación, y con la etiqueta correcta puedes irte sin dramas.

## La verdad del cambio (lo primero)

Durante años, salir era un acto público. Todo el grupo leía «María salió del grupo» y la fila de mensajes seguía. WhatsApp cambió ese comportamiento: en las versiones actuales, **el aviso de salida lo ven solo los administradores**. El resto no recibe nada. Ni notificación, ni mensaje en el historial.

Honestidad antes de todo: el detalle depende de la versión que tengas y de la que tengan los demás. Si tu grupo tiene administradores cotillas, se van a enterar. Y cualquiera que revise la lista de miembros notará tu ausencia, aunque sea días después. Lo que desapareció es el anuncio con megáfono, no la matemática: un miembro menos es un miembro menos. Lo que ganaste es discreción, no invisibilidad.

Y no confundas salir con que te eliminen. Que un administrador te expulse se cuenta de otra forma en el grupo, y el detalle exacto también cambió con las versiones. Si de pronto «desapareces» de un grupo sin haber tocado ningún botón, ya sabes quién fue el autor de la obra.

## Cómo salir, paso a paso

### En Android

1. En la lista de **Chats**, mantén pulsado el grupo.
2. Toca **«Salir del grupo»** (el icono de la puerta).
3. Confirma. Si quieres, marca «Archivar el chat» al salir.

### En iPhone

1. Abre el grupo y toca su **nombre**, arriba.
2. Baja hasta el final de la información.
3. Toca **«Salir del grupo»** y confirma.

Dos cosas más que conviene saber. Puedes volver solo con invitación: un enlace vigente o un admin que te reinvite. Y los mensajes enviados mientras estuviste fuera no aparecen al regresar: vuelves al presente, sin historial nuevo.

Si eres administrador, nombra a otro antes de irte. En las versiones actuales, WhatsApp te pedirá elegir sucesor si eres el último admin. Dejar el grupo huérfano es de mala educación digital.

## La etiqueta de la salida elegante

- **Culpa al móvil, no a la gente.** «Me quedo sin espacio, salgo de unos grupos» funciona mejor que «este grupo es insoportable». La primera frase cierra el tema. La segunda lo abre.
- **Elige buen momento.** Irte en plena pelea parece un portazo. Irte después de un mensaje positivo pasa inadvertido. El timing es la mitad de la etiqueta.
- **Un mensaje corto antes de salir, si quieres.** «Gracias por todo, me salgo por orden en el móvil. ¡Nos vemos!» Cinco palabras, cero drama, cero enemigos.
- **Salir sin avisar también es válido.** Los admins lo verán igual; el resto no se entera. El silencio no es traición: es higiene digital.
- **Prepara la respuesta.** Si al día siguiente alguien pregunta «¿por qué te fuiste?», ten la frase corta lista. La misma del mensaje de despedida, ni una palabra más.

## Las alternativas silenciosas (cuando no quieres irte)

| Alternativa | Qué ven los demás | Ideal para |
|---|---|---|
| Silenciar 8 horas | Nada | Eventos de un día |
| Silenciar 1 semana | Nada | Fiestas, torneos, campañas |
| Silenciar siempre | Nada | El grupo de la familia |
| Archivar | Nada | Grupos que ya no te importan |
| Salir | Solo los admins (versiones recientes) | Cierre total |

### Silenciar, paso a paso

Abre el grupo → toca el nombre → **«Silenciar notificaciones»** → elige **8 horas, 1 semana o Siempre**. El grupo sigue ahí y los mensajes siguen llegando, pero tu móvil no se mueve. Nadie sabe que silenciaste: no hay indicación visible para el resto. Es tu secreto, y bien guardado.

### Archivar, paso a paso

En la lista de chats, mantén pulsado el grupo (Android) o deslízalo y toca «Archivar» (iPhone). El chat se guarda fuera de la vista, abajo. El detalle clave: activa **«Mantener conversaciones archivadas»** en Ajustes → Chats. Con eso activado, los mensajes nuevos no sacan el chat del cajón. Queda archivado, quietito, hasta que tú decidas abrirlo.

Silencio más archivo es la combinación perfecta: el grupo existe, tú no sufres. Para la mayoría de los casos, ni hace falta salir. El botón de salir es para el cierre, no para la molestia.

Un extra para los grupos ruidosos de fotos y videos: desactiva la descarga automática de multimedia. Está en Ajustes → Almacenamiento y datos → Descarga automática. Sin videos cayendo solos a tu galería, el grupo ocupa bastante menos espacio mental. Y el almacenamiento del móvil te lo va a agradecer también.

## Si te vuelven a meter

Salió. Y al día siguiente estás dentro otra vez, porque alguien con tu número te reañadió. Tiene arreglo definitivo: el ajuste **«Quién puede añadirme a grupos»** corta el problema de raíz. Te explicamos la ruta completa, con pantallas exactas, en [cómo evitar que te añadan a grupos sin permiso](/blog/que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso).

## Tres casos concretos, tres salidas

- **El grupo de la familia:** silencia siempre antes de pensar en salir. La pregunta «¿por qué te fuiste?» llega igual a la cena. Ten la respuesta corta lista.
- **El grupo del trabajo anterior:** mensaje breve de despedida y salida. Nadie espera drama ahí, y el contacto futuro te lo agradece.
- **El grupo de vecinos:** archiva, no salgas. Mañana pueden necesitar avisarte del corte de agua, y tú necesitarás que te avisen.

Y cuando WhatsApp anuncia cambios en estos avisos, lo cuenta en su [blog oficial](https://blog.whatsapp.com/). Vale la pena revisarlo de vez en cuando, porque el detalle de «quién ve qué» cambia entre versiones.

## Para seguir aprendiendo

Si la salida fue solo el síntoma, quizá necesites grupos que sí te llenen. En nuestra [sección de guías](/guias) tienes más manuales de WhatsApp con pasos claros, y en el [buscador de grupos](/buscar) puedes filtrar por categoría y país antes de entrar.

Y si tú administras grupos, mira [cómo moderar un grupo de WhatsApp exitoso](/blog/como-moderar-un-grupo-de-whatsapp-exitoso): la mejor salida es la que nadie necesita planear. Un grupo con buen ambiente retiene gente sin esfuerzo.

## Preguntas frecuentes

### ¿Los demás ven que salí del grupo?

En las versiones recientes, solo los administradores reciben el aviso. El resto no ve notificación. Eso sí: quien revise la lista de miembros notará que faltas.

### ¿Puedo volver a entrar después de salir?

Sí, pero solo con invitación: un enlace vigente o un administrador que te reinvite. Y no verás los mensajes enviados mientras estuviste fuera.

### ¿Se borra mi historial al salir?

No. Los mensajes quedan en tu móvil. El historial es tuyo y se va contigo. Al reentrar, recuperas el chat pero no los mensajes del tiempo fuera.

### ¿Puedo salir sin que el administrador se entere?

No del todo. El aviso de salida llega a los admins. Lo que ya no existe es el anuncio para todo el grupo, así que el impacto social bajó mucho.

### ¿Qué pasa si soy el único administrador y me voy?

En las versiones actuales, WhatsApp te pide elegir un administrador nuevo antes de irte. Nombra a alguien activo y márchate en paz.`,
  },
];

// --- validation + insert ---
const wordCount = (md) => md.split(/\s+/).filter(Boolean).length;
const rm = (md) => Math.max(1, Math.round(wordCount(md) / 180));

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
  const warn = [];
  if (wc < 1200 || wc > 2000) warn.push(`WORDS ${wc} out of 1200-2000`);
  if (ml < 140 || ml > 155) warn.push(`METADESC ${ml} chars out of 140-155`);
  console.log(`${p.id} ${p.slug} | words=${wc} readingMinutes=${rm(p.content)} metaDesc=${ml}${warn.length ? " | WARN: " + warn.join("; ") : ""}`);

  await pool.execute(
    `INSERT INTO blog_posts (id,slug,title,excerpt,content,coverEmoji,tags,authorName,status,metaTitle,metaDescription,readingMinutes,views,publishedAt)
     VALUES (?,?,?,?,?,?,?,?, 'published', NULL, ?, ?, 0, UTC_TIMESTAMP() - INTERVAL ? DAY)
     ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content),
     coverEmoji=VALUES(coverEmoji), tags=VALUES(tags), authorName=VALUES(authorName),
     metaDescription=VALUES(metaDescription), readingMinutes=VALUES(readingMinutes)`,
    [p.id, p.slug, p.title, p.excerpt, p.content, p.coverEmoji, p.tags,
     "Antonio C.", p.metaDescription, rm(p.content), p.daysAgo]
  );
}

await pool.end();
console.log(`cluster-2: ${posts.length} posts seeded`);
