/**
 * Seed 20 UNIQUE long-form country intros into `entity_intros`.
 *
 * Kills duplicate-content risk between /pais/{code} pages: every intro is
 * hand-written for one country (local WhatsApp habits, typical group types,
 * one practical tip per country, invitation to publish own group).
 *
 * Run from project root:  node scripts/intro-seeds/countries.mjs
 *
 * Conventions (task 9-a):
 *  - entityType='country', entityName = EXACT country name (accents included)
 *  - customTitle=NULL, customHeroDesc=NULL, customIntro=TEXT
 *  - 3-4 paragraphs separated by blank lines (\n\n) — page splits them into <p>
 *  - ZERO group counts / "miles" / fake stats
 */

import mysql from "mysql2/promise";

const COUNTRIES = [
  {
    code: "ar",
    name: "Argentina",
    intro: `El mate gira de mano en mano y el teléfono no para de vibrar. En Argentina el grupo de la cancha suena antes, durante y después del partido: la charla del Superclásico arranca el viernes y sigue hasta el lunes. Los audios son largos y apasionados, como una mesa de bar. El domingo, mientras se hace el asado, alguien ya mandó la foto del corte. Entre semana, el grupo del trabajo mezcla chistes, quejas del clima y la lista de quién faltó a la quinta.

¿Qué abunda por acá? Grupos de fútbol del torneo local y de la Sele, compra-venta del barrio, grupos de la facultad para organizar entregas y el fútbol de los viernes. También los de memes argentinos, que se reenvían antes del primer café. En Grupos Hoy podés filtrar por Argentina y elegir la categoría después. La lista queda solo con grupos del país, cada uno con su tema a la vista.

Un consejo de alguien que vio de todo: si llega una cadena que dice «reenviá esto o WhatsApp empezará a cobrar», no le creas. WhatsApp no cobra por usar el servicio y no borra cuentas por no reenviar mensajes. Respirá, borrá y seguí con tu día. Lo mismo con las cadenas de la suerte: no pasa nada si no las mandás, de verdad. Los admins argentinos ya las conocen de memoria.

¿Administrás un grupo argentino? Pasalo por «Enviar un grupo» y en un rato queda publicado para gente de todo el país. Es gratis, toma lo mismo que cebar unos mates, y le sirve a otro pibe que anda buscando justo lo que vos armaste.`,
  },
  {
    code: "bo",
    name: "Bolivia",
    intro: `La mañana paceña empieza arriba, en el teleférico, con el grupo de la familia ya lleno de mensajes. Alguien avisa que llega tarde porque la línea de Mi Teleférico hizo fila. Alguien más manda el «buenos días» de siempre con flores y taza de café. La salteña del desayuno aparece en foto antes que en la boca. Y cuando llega el Carnaval de Oruro, el chat explota con videos de la entrada y planes para ver la comparsa en persona.

Por acá sobran los grupos parroquiales y los universitarios, y también los del clásico paceño de fútbol. En la compra-venta se ofrece de todo, y los chistes del altiplano se comparten a toda hora. Tampoco faltan los grupos de trabajo, donde se avisan turnos, ferias y días de pago. Si buscas grupos de Bolivia sin revolver resultados de otros países, Grupos Hoy te lo pone fácil. El filtro de país está a un toque: marcas Bolivia y ya está.

Un detalle que ayuda: al entrar a un grupo grande, mira un rato antes de escribir. Fíjate cómo saluda la gente, qué temas se permiten y a qué hora se calla el chat. Y si las imágenes de «buenos días» te llenan la galería, apaga la descarga automática en los ajustes de WhatsApp. El cariño queda igual y el teléfono respira.

Si tienes un grupo boliviano bien llevado, con reglas claras y admin despierto, publicarlo toma unos minutos. Entra a «Enviar un grupo», completa los datos y deja que lo encuentre gente de La Paz, El Alto, Santa Cruz y Cochabamba.`,
  },
  {
    code: "cl",
    name: "Chile",
    intro: `Cuando tiembla en Santiago, el primer lugar donde todos se enteran es el grupo de vecinos. En Chile los grupos funcionan como red de emergencia y de cariño a la vez. Avisan del temblor y del corte de luz, y también arman la once del domingo. Porque la once no es solo té con pan: es palta, quesillo y conversa. Y de fútbol ni hablar: entre Colo Colo y la U hay grupos que no descansan ni en enero.

¿Qué vas a encontrar? Grupos de hinchada para discutir el campeonato y de trekking para subir la cordillera en primavera. También compra-venta del barrio, grupos de apoderados del colegio y memes que solo se entienden con un «cachai» por medio. Grupos Hoy tiene un filtro para Chile: lo activas y la lista queda solo con comunidades del país, sin mezclar nada de afuera.

Ojo con los rumores: después de un temblor fuerte siempre circula el falso aviso de evacuación o la alarma de maremoto que nadie confirmó. Antes de reenviar algo así, frena y revisa un canal oficial. Un mensaje equivocado a medianoche asusta a la cuadra entera. En los grupos de vecinos, la calma vale oro.

¿Y si tu grupo chileno no aparece acá? Súbelo. La sección «Enviar un grupo» está abierta para compartir tu comunidad: la del edificio, la del curso o la de la barra del club. Publicar no cuesta nada y toma menos que ir por la once. Además, cada enlace pasa por revisión humana, para que nadie pierda el tiempo con grupos muertos.`,
  },
  {
    code: "co",
    name: "Colombia",
    intro: `El celular de un colombiano descansa poco. Hay un grupo para el trabajo, otro para la familia, otro para el barrio y uno más para los amigos de siempre. La conversa arranca con un «¿qué más pues?» y ya no para. En Bogotá se arregla la salida al cine por chat; en Medellín, el parcero organiza el futbol de los sábados. Y en diciembre los audios de la Novena se multiplican, con villancicos, buñuelos y natilla por delante.

Los grupos colombianos más buscados: fútbol de la Sele y el clásico paisa, compra-venta con ofertas de todo tipo y los universitarios para trabajos y apuntes. También abundan los memes que mezclan humor costeño, paisa y rolo. En los barrios, los grupos de vecinos avisan desde la obra de la esquina hasta el mercado del sábado. En Grupos Hoy puedes marcar Colombia y quedarte solo con grupos de esta tierra, sin ruido de afuera; la categoría se elige en un segundo paso.

Un aviso serio: la estafa favorita de esta plaza es el «te ganaste un premio» o la inversión mágica que dobla tu plata. Nunca pases datos bancarios ni claves por chat, por más amable que suene el desconocido. Si el mensaje entra en un grupo, avisa al admin y reporta el contenido desde el propio chat: cualquier persona puede hacerlo, sin drama.

¿Tienes un grupo colombiano con buena energía? Publícalo en «Enviar un grupo». Completa la ficha, ponle una descripción honesta y deja que la gente de Cali, Barranquilla o Bucaramanga lo encuentre de una. Quien entra con expectativas claras se queda a charlar; quien entra a ciegas, no.`,
  },
  {
    code: "cr",
    name: "Costa Rica",
    intro: `Un tico organiza casi todo su día desde WhatsApp: el futbolcito del sábado, la cita del taller y el bautizo de la sobrina. La conversa va con «pura vida» por delante y buen humor de sobra. El sábado arranca temprano, con el gallo pinto humeando en la mesa y el grupo de futbolcito pidiendo confirmar quiénes van. Y si llueve en la tarde, ni modo: el futbolcito se juega igual. Y cuando juegan Saprissa y Alajuelense, o la Sele en eliminatoria, el chat pasa a modo tormenta.

Por estas tierras abundan los grupos de la iglesia, el futbolcito entre semana, la compra-venta del cantón y las comadres que comparten recetas y planes. Cuando busques en Grupos Hoy, marca Costa Rica y verás grupos de ticos y ticas, no de otra plaza. La categoría se elige aparte, así que puedes afinar de una vez.

Consejo de presentarse: al entrar a un grupo nuevo, escribe corto. Tu nombre, de dónde eres y para qué entraste. Nada de discursos ni lluvia de imágenes de saludo. En los grupos ticos esa simpleza cae bien: la gente responde mejor a un mensaje claro que a una avalancha de buenos días. Y si el grupo tiene admin activo, lee la descripción antes de la primera pregunta.

¿Tienes un grupo tico que merece más gente? La puerta está abierta: entra a «Enviar un grupo», escribe la descripción como se la contarías a un vecino y publícalo. No cuesta nada y le sirve a otra persona de tu cantón que anda buscando justo eso.`,
  },
  {
    code: "cu",
    name: "Cuba",
    intro: `El parque con wifi funciona como sala de estar: la gente llega con el teléfono a media batería y se queda horas frente a la pantalla. En Cuba los datos se cuidan como el arroz, así que los grupos se usan con misión clara: ahorrar. Se comparte un enlace y se aprovecha; las fotos del mes se bajan en una sola sentada. Los mensajes van al grano, porque cada megabyte cuenta.

Los grupos cubanos más comunes: los familiares de la isla, los que la conectan con la gente de afuera y los del barrio para avisos prácticos. El béisbol de la Serie Nacional tiene los suyos, con pasión de estadio. También están los que coordinan quién baja el Paquete Semanal, que ya es cultura nacional. Y los de chistes que corren más rápido que la guagua. En Grupos Hoy eliges Cuba en el filtro de país y ves los grupos pensados para la isla.

El consejo más útil es de datos: entra a los ajustes de WhatsApp y desactiva la descarga automática de fotos y videos con datos móviles. Guarda lo pesado para cuando encuentres wifi y responde en los grupos grandes con texto en vez de audios largos. El paquete dura el doble y nadie se pierde la charla.

Si administras un grupo de la isla, publicarlo en «Enviar un grupo» lo pone al alcance de gente de La Habana a Santiago de Cuba. Un rato de trabajo y tu comunidad queda frente a mucha gente que anda buscando lo mismo que tu grupo ofrece.`,
  },
  {
    code: "ec",
    name: "Ecuador",
    intro: `Hay dos cosas sagradas en un domingo ecuatoriano: el encebollado y el grupo de la familia. La sopa se come con el teléfono apoyado en la mesa, porque seguro aparece foto nueva del almuerzo. Cuando llega el clásico del Astillero, el grupo se divide entre Barcelona y Emelec, y ahí no hay neutral: hasta el más callado manda su meme. La semana sigue con los grupos del trabajo y del barrio, que no descansan ni con la llovizna de Quito.

La oferta ecuatoriana va de todo: fútbol de la LigaPro y de la Tri, compra-venta y grupos de la universidad para los deberes. También están los de la iglesia y los memes que viajan de la costa a la sierra. Grupos Hoy te deja filtrar por Ecuador: un clic y la lista queda limpia de grupos de otros países. Las categorías quedan a un toque de distancia.

Sobre los audios: en Ecuador se estilan largos y con cariño, pero no en todos lados caen igual. En un grupo de estudio o de trabajo, pregunta antes de mandar una charla de cinco minutos. Y si te llega un audio en mal momento, pide con confianza que te lo resuman en texto. Los acuerdos pequeños mantienen la conversa buena para todos.

¿Tienes un grupo ecuatoriano? Deja el enlace en «Enviar un grupo» y escribe una descripción que se entienda a la primera. Así la gente de Guayaquil, Quito y Cuenca lo encuentra sin buscar de más. La Sierra y la Costa charlan distinto, pero en el mismo idioma: el de la buena conversa.`,
  },
  {
    code: "sv",
    name: "El Salvador",
    intro: `Las pupusas del domingo saben mejor cuando el grupo las organiza: quién va por el atol, cuántas de queso y cuántas revueltas. En El Salvador la vida diaria pasa mucho por WhatsApp. La familia repartida entre San Salvador y el exterior coordina por chat. El chero del trabajo manda el meme del día y la iglesia avisa la hora del culto. Todo llega al teléfono, caliente y a tiempo.

Los grupos salvadoreños más buscados: fútbol de la Selecta y de la liga local, compra-venta, universitarios, grupos de la parroquia y de memes bien cheros. En la compra-venta aparecen desde celulares hasta motos. En las playas, los grupos de surf de El Tunco y El Sunzal avisan cómo viene la ola del día. Si quieres encontrar grupos rápido, fija el país en El Salvador dentro de Grupos Hoy: la lista se queda con puro contenido local.

Cuidado con un clásico de esta plaza: los anuncios de cambio de dólares y de remesas «más baratas» dentro de grupos de compra-venta. Trata solo con gente conocida o con referencias reales. Si alguien te apura, te pide dinero por adelantado o te cambia de número a última hora, corta ahí mismo. Las operaciones buenas nunca tienen esa prisa. Y si el trato salió bien, deja la referencia escrita en el grupo: así proteges a los demás.

Y si tienes un grupo bien salvadoreño, compártelo. «Enviar un grupo» está abierto todo el año: llena los datos, escribe una descripción clara y otra gente de El Salvador lo encontrará sin dar vueltas. Ayuda también avisar en qué horarios se enciende la charla del grupo.`,
  },
  {
    code: "es",
    name: "España",
    intro: `La sobremesa española no termina en la mesa: sigue viva en el grupo del pueblo. Un café después de comer, el móvil en la mano y la charla continúa: las fiestas de agosto y el cartel de la verbena. Los grupos de padres del colegio y de vecinos de la comunidad llevan lo práctico del día: quién recoge a los niños y el ascensor estropeado. Y en agosto, cuando llega la fiesta del pueblo, el chat echa humo, vale.

¿Qué se encuentra por aquí? Grupos de LaLiga y de fantasy del trabajo, compra-venta del barrio, rutas de senderismo por la sierra, grupos de recetas y memes de sobremesa. La página de España de Grupos Hoy reúne comunidades del país, sin mezclar resultados de otras zonas hispanas; después eliges el tema que te llame. Y por supuesto, las peñas futboleras: cada domingo tienen tema nuevo.

Truco de supervivencia: el grupo del pueblo en fiestas patronales es una tormenta de audios a las tantas de la madrugada. No hace falta irse del grupo. Silencia ocho horas, o el fin de semana entero, y revísalo tranquilo al día siguiente con un café. Nadie se va a ofender contigo: todos están bailando en la verbena.

Si llevas un grupo español con buena marcha, del barrio, de la peña o del curro, publícalo gratis en «Enviar un grupo». Una ficha honesta y el grupo queda listo para que lo encuentre gente de toda la comunidad. El formulario es corto y hace la mitad del trabajo.`,
  },
  {
    code: "gt",
    name: "Guatemala",
    intro: `A las seis de la mañana, el grupo de la comunidad ya está activo. Avisan el bus que se quedó, el atol de elote que trae doña y el recordatorio de la escuela. En Guatemala el día se organiza por WhatsApp desde temprano. Da lo mismo el tráfico de la capital que el mercado del pueblo: el chat ya está prendido. Los grupos familiares cruzan el país entero, de Quetzaltenango a Petén, y en diciembre explotan con las posadas y los tamales colorados.

La oferta local es amplia: fútbol del campeonato local, la parroquia con sus horarios de misa, la compra-venta del municipio y la universidad con sus apuntes. Los memes bien chapines tienen su propio rincón. El mercado del pueblo también tiene los suyos: se manda la lista por chat y se recoge el pedido sin fila. En Grupos Hoy puedes activar el filtro de Guatemala y quedarte solo con grupos chapines; después eliges la categoría y afinas todavía más.

Consejo de horarios: por acá mucha gente escribe antes de las siete, entre el bus y el primer café. Si esas notificaciones te rompen el sueño, silencia los grupos ruidosos al ir a dormir y quita el silencio al despertar. Nadie se molesta y tú descansas de verdad. El mensaje sigue ahí en la mañana, no se escapa.

¿Llevas un grupo guatemalteco con gente activa? Publícalo desde «Enviar un grupo». La publicación es gratis, toma minutos y pone tu comunidad frente a gente de todo el país que anda buscando dónde charlar. Si el grupo es del interior, poner el nombre del municipio en la descripción ayuda un montón.`,
  },
  {
    code: "hn",
    name: "Honduras",
    intro: `Honduras corre por WhatsApp: el trabajo, la iglesia y la familia compiten por el mismo chat, casi a diario. Antes de dar la primera mordida, la baleada ya está en la foto del grupo. La sopa de caracol de la costa se presume igual, con orgullo de todo el litoral atlántico. Los domingos, entre el partido de la Liga y el almuerzo en casa de la abuela, los mensajes no dejan de llegar. Y cuando llega el carnaval de La Ceiba, el grupo se llena de planes para el paseo.

Los grupos catrachos favoritos: fútbol de la Liga Nacional y de la Sele, compra-venta, memes sin filtro. Las parroquias y los campus universitarios también tienen los suyos. Al filtrar por Honduras en Grupos Hoy, lo que ves son comunidades del país y nada más: primero el país, después el tema.

Cuidado con los «empleos fáciles» que llegan por chat: si te piden pagar un adelanto por el uniforme, un examen o una capacitación, es estafa. El trabajo de verdad no se paga por adelantado, no pide claves y no llega con enlaces raros. Avisa al admin y denuncia el mensaje desde el propio WhatsApp; cualquiera puede reportarlo en dos toques.

Y si tu grupo hondureño ya tiene su gente y sus reglas, dale visibilidad. Entra a «Enviar un grupo» y cuéntalo en dos líneas claras. La gente de Tegucigalpa, San Pedro Sula y La Ceiba lo encontrará sin tanto rodeo. Una descripción con sabor catracho gana confianza a primera vista.`,
  },
  {
    code: "mx",
    name: "México",
    intro: `La familia mexicana rara vez vive junta en una sola ciudad. Está repartida entre Monterrey, Guadalajara y la capital, así que el grupo familiar funciona como la casa común. Ahí se acuerdan las posadas de diciembre, ahí aparece la foto de los tamales y ahí se arman los planes del próximo encuentro. Órale, que el grupo de la colonia tampoco se queda atrás: avisa del tandeo del agua y del torneo relámpago del domingo. Hasta el tianguis que se movió de calle se anuncia ahí.

Los grupos mexicanos más buscados: los de la Liga MX con memes del fin de semana y la compra-venta de la colonia. Sigue la fila la universitaria, para apuntes y tareas, y la del trabajo. La de humor bien mexicano cierra con broche. Grupos Hoy tiene página propia para México: entras y todo lo que ves es de gente de aquí; después filtras por categoría y listo.

Para los grupos de compra-venta, un cuidado que ahorra disgustos: entrega en lugar público y de día. La explanada o la tienda de la esquina funcionan perfecto. No compartas tu ubicación en vivo con desconocidos y desconfía del vendedor que apura con un «págame primero y mañana te lo llevo». La venta buena se ve, se toca y se paga en persona.

¿Tu grupo mexicano no está en el directorio? Súbelo por «Enviar un grupo»: es gratis y en un rato queda a la vista de gente de todo el país. Una buena descripción ahorra preguntas y atrae justo a la gente que busca lo mismo que tu grupo.`,
  },
  {
    code: "ni",
    name: "Nicaragua",
    intro: `Alguien sube la foto del nacatamal y en un rato el grupo de la familia está de fiesta. Así anda la charla nicaragüense: con comida por delante y buen humor siempre. La pregunta de siempre es quién hace el mejor vigorón, y el grupo la resuelve con foto y todo. Los grupos del barrio y del trabajo ordenan el día con avisos prácticos. Y en diciembre, con La Gritería, el chat va y viene con saludos y con el grito de siempre: «¿quién causa tanta alegría?».

Por Nicaragua abundan los grupos de la iglesia y de béisbol (la pelota es pasión de casa). Siguen la compra-venta del barrio, la universidad y los memes pinoleros para el recreo. En los barrios, la cuadra entera se organiza por chat para apoyarse con el agua y la luz. Al escoger Nicaragua en Grupos Hoy, la lista se reduce a grupos del país. Filtras primero por la tierra y después por el tema que te guste.

Un consejo que salva amistades: política y grupos familiares no se mezclan. El tema enciende la conversa más rápido que el fogón. Si las cosas se ponen pesadas, cambia de tema o silencia un rato. Los grupos duran años; la discusión de hoy se olvida, pero los rencores a veces no. Mejor cuidar la mesa que ganar la discusión.

Si llevas un grupo pinolero con buena convivencia, publícalo en «Enviar un grupo»: una descripción clara, el enlace y nada más. Gente de Managua, León y Granada lo encontrará a la primera. Dos líneas honestas valen más que cualquier propaganda.`,
  },
  {
    code: "pa",
    name: "Panamá",
    intro: `El sancocho del domingo se cocina primero en el grupo: quién lleva la yuca, quién el ñame, a qué hora se enciende la olla. En Panamá los planes se arman por WhatsApp a toda hora, entre el tranque de la vía y el viaje tranquilo en Metro. El saludo llega con su «¿qué xopa?» y la charla fluye con la calma de siempre, sin apuro pero sin pausa. En toda reunión panameña aparece el arroz con pollo, y el grupo se encarga de repartir quién lo trae.

Los grupos panameños que nunca fallan: béisbol, fútbol de la selección y compra-venta con de todo. También la universidad, la iglesia y los memes con humor del patio. En Grupos Hoy eliges Panamá y el resto desaparece de la pantalla: queda puro grupo local, listo para filtrar por categoría.

Atención con las rifas: por acá se rifan platos, electrodomésticos y hasta ayudas comunitarias, y casi todas son honestas. Pero si te piden depositar «para liberar tu premio», no es rifa: es estafa. Compra números solo en rifas de gente que conozcas o con respaldo claro dentro del grupo. La rifa buena nunca te cobra por ganar.

Y si el tuyo es un grupo panameño de los buenos, con charla sana y admin presente, mándalo por «Enviar un grupo». Sale gratis, toma poco y lo ve gente de la ciudad, del interior y hasta la que vive afuera. Si el grupo es de un pueblo, pon el nombre del pueblo en la descripción: así lo encuentra la gente del lugar.`,
  },
  {
    code: "py",
    name: "Paraguay",
    intro: `Tereré en una mano, teléfono en la otra: así camina la gente por Asunción. En Paraguay los grupos viven a su ritmo: tranquilos de día, llenos de planes al caer la tarde. El sábado hay fútbol, y el clásico entre Olimpia y Cerro Porteña divide familias enteras. En la mesa siempre hay chipa recién hecha; si no se sube foto, el almuerzo no cuenta. Y en Semana Santa, el horno de la abuela se prende y el grupo coordina quién trae el almidón de mandioca.

La oferta paraguaya va de la charla de fútbol a la compra-venta y a los grupos de la iglesia. Los universitarios y los memes que mezclan castellano y guaraní completan el cuadro, sin traducción de por medio. La compra-venta de acá se mueve rápido: a veces la moto ya se vendió el mismo día. En Grupos Hoy, con elegir Paraguay la lista queda con comunidades del país; la categoría se afina después con un clic.

Algo propio de esta plaza: muchos grupos conversan en jopara, esa mezcla de guaraní y castellano que se entiende sin estudiarla. Si una frase se te escapa, pregunta con confianza: la gente explica con gusto. Y si hablás guaraní, un saludo en la lengua abre cualquier grupo nuevo. Es la señal más clara de que llegaste con respeto.

Si llevas un grupo paraguayo con gente activa, anótalo en «Enviar un grupo». No lleva nada y lo encuentra gente de Encarnación, Ciudad del Este y todo el país. Si tu grupo charla en guaraní, dilo en la descripción: la gente lo agradece antes de entrar.`,
  },
  {
    code: "pe",
    name: "Perú",
    intro: `Nadie en Lima sabe cuánto durará el viaje a casa, así que la combi se sobrevive con el grupo abierto. En Perú el celular acompaña todo: la combi de vuelta, la cola del banco y el almuerzo del domingo con el cebiche de la abuela. El chifa del domingo también pelea el puesto: en algunas casas gana, en otras manda el cebiche. Y cuando juegan Universitario y Alianza, el clásico parte el chat en dos: ahí no hay neutrales, hay bandos.

Los grupos peruanos más pedidos: fútbol de la liga peruana y de la blanquiroja, compra-venta y los universitarios para trabajos. Siguen los de la parroquia y los de comida: sí, existen grupos dedicados a comparar cebiches. Los memes criollos de la buena cierran la lista. En las alturas, los grupos del pueblo conectan Cusco, Puno y Arequipa en la misma charla. Al marcar Perú en Grupos Hoy, la lista queda con grupos peruanos de verdad, sin mezcla rara; el tema se elige después.

Un aviso de esta plaza: la estafa del «paquete retenido» sigue viva. Llega el mensaje de que tu envío quedó retenido y hay que pagar un depósito para liberarlo. Ese aviso se disfraza con nombres de empresas de reparto conocidas, pero nadie serio cobra depósitos por chat. Si no esperas ningún paquete, bórralo. Si esperas uno, confirma con la empresa por su canal oficial. Nunca pagues antes de verificar nada.

Si administras un grupo peruano con buena charla, ponlo en «Enviar un grupo»: sin costo y sin vueltas. La gente de Lima, Arequipa, Trujillo y más allá lo encontrará con lo justo. Y si el grupo charla de un solo tema, ponlo claro en la descripción: se agradece.`,
  },
  {
    code: "pr",
    name: "Puerto Rico",
    intro: `Un apagón en la isla y el grupo de vecinos se convierte en centro de operaciones: quién tiene planta y dónde queda hielo. Después del temporal, el mismo grupo organiza quién ayuda a mover el árbol caído de la esquina. En Puerto Rico WhatsApp es herramienta de supervivencia y de fiesta a la vez. Se organizan las parrandas de diciembre y se debate el sofrito de cada familia con seriedad total. Los planes de playa se arman con el pronóstico del tiempo a mano.

Los grupos boricuas más comunes: los de la familia, que cruzan la isla y la diáspora, y los del trabajo. Cada pueblo tiene el suyo, sin exagerar. Y los memes que solo un boricua entiende a la primera tampoco faltan. La página de Puerto Rico de Grupos Hoy reúne grupos de la isla: entras, filtras y listo.

El consejo más importante es de temporada: de junio a noviembre, ten el grupo de vecinos armado antes del huracán, no durante. Guarda los contactos clave también fuera del chat, en tu libreta de teléfonos. Cuando se caen la luz y los datos, el mensaje corto y el plan acordado valen más que cualquier app.

¿Tienes un grupo boricua con buena vibra? Súbelo por «Enviar un grupo». La sección está abierta todo el año, no cuesta nada y ayuda a que gente de San Juan a Ponce lo encuentre cuando lo ande buscando. Y si es de un pueblo específico, nombra el pueblo en la ficha: aquí cada cual tiene su orgullo.`,
  },
  {
    code: "do",
    name: "República Dominicana",
    intro: `La pelota invernal manda en el chat dominicano desde octubre: Licey, Escogido y Águilas conviven en la misma conversación y a veces en la misma familia. En República Dominicana los grupos acompañan el día completo. El almuerzo, la bandera de siempre (arroz, habichuelas y pollo), se presume en foto. Los planes del finde se arman por chat y los apagones se comentan con humor, porque si no, uno se ahoga. La bachata del sábado se estrena en el grupo antes que en el colmado.

Los grupos quisqueyanos favoritos: el béisbol de invierno y las Grandes Ligas, compra-venta, grupos de iglesia, de universidad y de memes dominicanos que no perdonan. Al poner República Dominicana en el filtro de Grupos Hoy, quedan solo comunidades del país; el tema se elige después.

Consejo de convivencia: la pelota se siente con el corazón, y la broma entre Licey y Escogido es pan de cada día. Con las Águilas y el resto pasa igual. Ríete con gusto, pero mide el tono con gente que no conoces. Una broma mal puesta quema más que el sol del Malecón. La rivalidad se queda en el estadio y la amistad se queda en el chat.

Si tu grupo dominicano tiene buena charla y admin presente todos los días, publícalo en «Enviar un grupo». El trámite sale gratis, lleva un momento y lo ve gente de Santo Domingo, Santiago y todo el Cibao. Y si es de peloteros, avisa el equipo en la descripción: la afición se encuentra sola.`,
  },
  {
    code: "uy",
    name: "Uruguay",
    intro: `Se charla desde el desayuno hasta el asado: en Uruguay el mate y el grupo no conocen el descanso. El chat acompaña la siesta, la playa del verano y la sobremesa de los domingos. De día, el grupo del trabajo se alivia con chistes; de noche, el grupo de amigos arma la picada. Cuando juega el clásico entre Peñarol y Nacional, el grupo familiar se transforma en tribuna, con parientes en ambos lados, como manda la tradición. Y el chivito del viernes a la noche también se presume en foto, porque hay cosas que hay que mostrar.

Los grupos orientales más buscados: fútbol local y la Sele, compra-venta y grupos de la facultad. Después vienen los del trabajo, los memes uruguayos de humor seco y los del barrio para organizarse. Al elegir Uruguay en Grupos Hoy, el directorio queda con puro grupo del país, sin resultados de la región mezclados.

Truco criollo: para el asado del finde, usa la encuesta del grupo. Fecha, lugar y quién lleva el asado se votan en un minuto y no queda nadie afuera. Después la lista de compras se escribe en el mismo chat y nadie la pierde. La encuesta evita el «yo dije otra cosa» del lunes.

¿Y tu grupo uruguayo? Si tiene gente activa y charla sana, «Enviar un grupo» lo publica gratis. Deja el enlace, una descripción corta y listo: lo van a encontrar montevideanos y gente del interior por igual. Si el grupo es de fútbol, aclará la tribuna en la descripción: acá se pregunta antes de entrar.`,
  },
  {
    code: "ve",
    name: "Venezuela",
    intro: `Madruga, enciende la plancha para la arepa y mira el teléfono: así arranca el día de mucha gente en Venezuela. Los grupos familiares funcionan como la mesa de la casa, aunque cada quien esté en un pueblo distinto. En diciembre las hallacas vuelven a unir a todos: el grupo coordina quién trae la harina, quién guisa y quién envuelve. Esa semana también aparece el pan de jamón, con su reparto coordinado casa por casa. La hallaca se hace en grupo o no se hace.

Los grupos venezolanos más buscados: fútbol de la Vinotinto y de las ligas, compra-venta, grupos de la universidad y de la iglesia. Los de cocina debaten el punto exacto de la carne mechada, y los de memes y plans de chamo no se quedan atrás. Si fijas Venezuela como país en Grupos Hoy, el directorio se queda con grupos de acá, de la familia y de los amigos de siempre.

Cuidado con el clásico moderno: el vendedor nuevo que pide pagar primero (por Zelle, pago móvil o lo que esté de moda) y desaparece. En los grupos de compra-venta, fíjate en la reputación: cuánto tiempo lleva la persona en el grupo y quién la recomienda. Y si la oferta es demasiado buena, desconfía: el que apura la venta suele tener sus razones. Cuando el vendedor insiste en seguir el trato en otra app, también es mala señal: lo decente se conversa donde está la gente.

¿Tienes un grupo venezolano con buena energía? Publícalo por «Enviar un grupo»: sale gratis. Puede encontrarlo gente en Maracaibo, Valencia, Barquisimeto y también la que vive lejos de casa. Para esa gente, un grupo del país es un pedacito de la mesa familiar.`,
  },
];

// ---------------------------------------------------------------------------
// Content validations (fail fast before touching the DB)
// ---------------------------------------------------------------------------
const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const firstSentence = (s) => s.trim().split(/(?<=[.!?])\s/)[0];
const lastSentence = (s) => s.trim().split(/(?<=[.!?])\s/).slice(-1)[0];
const ngrams = (s, n) => {
  const w = words(s);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
};

function validate() {
  const seenFirst = new Map();
  const seenLast = new Map();
  const grams = COUNTRIES.map((c) => [...ngrams(c.intro, 6)]);

  for (const c of COUNTRIES) {
    const w = words(c.intro).length;
    if (w < 250 || w > 350) throw new Error(`${c.code}: word count ${w} (need 250-350)`);
    if (/\d/.test(c.intro)) throw new Error(`${c.code}: contains a digit (no stats allowed)`);
    if (/\bmil(?:es)?\b/i.test(c.intro)) throw new Error(`${c.code}: contains "mil/miles" (forbidden)`);
    const paras = c.intro.split(/\n\s*\n/).map((p) => p.trim());
    if (paras.length < 3 || paras.length > 4) throw new Error(`${c.code}: ${paras.length} paragraphs (need 3-4)`);
    if (paras.some((p) => words(p).length < 35)) throw new Error(`${c.code}: has a too-short paragraph`);
    const gh = (c.intro.match(/Grupos Hoy/g) || []).length;
    if (gh !== 1) throw new Error(`${c.code}: mentions Grupos Hoy ${gh} times (need exactly 1)`);

    const f = words(firstSentence(c.intro)).slice(0, 3).join(" ");
    if (seenFirst.has(f)) throw new Error(`${c.code}: first-sentence pattern clashes with ${seenFirst.get(f)} ("${f}")`);
    seenFirst.set(f, c.code);

    const l = words(lastSentence(c.intro)).slice(-4).join(" ");
    if (seenLast.has(l)) throw new Error(`${c.code}: closing clashes with ${seenLast.get(l)} ("${l}")`);
    seenLast.set(l, c.code);

    // sentences should stay short-ish (brief voice guide); hard fail > 26 words
    for (const sent of c.intro.split(/(?<=[.!?])\s/)) {
      if (words(sent).length > 26) throw new Error(`${c.code}: sentence too long (${words(sent).length}w): ${sent.slice(0, 60)}…`);
    }
  }

  // pairwise 6-gram overlap (kills duplicate-content risk)
  for (let i = 0; i < COUNTRIES.length; i++) {
    for (let j = i + 1; j < COUNTRIES.length; j++) {
      const a = new Set(grams[i]);
      const shared = grams[j].filter((g) => a.has(g));
      if (shared.length > 0) {
        throw new Error(`6-gram overlap ${COUNTRIES[i].code}/${COUNTRIES[j].code}: "${shared[0]}"`);
      }
    }
  }
  console.log(`validate: ${COUNTRIES.length} intros OK (word counts, no digits, unique openings/closings, no 6-gram overlaps)`);
}

// ---------------------------------------------------------------------------
// Seed: DELETE then INSERT per country (idempotent)
// ---------------------------------------------------------------------------
async function seed() {
  const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "grupos",
    password: "",
    database: "gruposwhatsapp",
    connectionLimit: 2,
  });

  try {
    for (const c of COUNTRIES) {
      await pool.execute(
        "DELETE FROM `entity_intros` WHERE `entityType` = 'country' AND `entityName` = ?",
        [c.name]
      );
      await pool.execute(
        "INSERT INTO `entity_intros` (`entityType`, `entityName`, `customTitle`, `customHeroDesc`, `customIntro`) VALUES ('country', ?, NULL, NULL, ?)",
        [c.name, c.intro]
      );
      console.log(`seeded ${c.code.padEnd(2)} ${c.name.padEnd(20)} ${words(c.intro).length}w`);
    }

    const [rows] = await pool.query(
      "SELECT `entityName`, LENGTH(`customIntro`) AS len FROM `entity_intros` WHERE `entityType` = 'country' ORDER BY `entityName`"
    );
    console.log(`\nentity_intros country rows: ${rows.length}`);
    for (const r of rows) console.log(`  ${r.entityName}: ${r.len} chars`);
    if (rows.length !== 20) throw new Error(`expected 20 rows, found ${rows.length}`);
  } finally {
    await pool.end();
  }
}

try {
  validate();
  await seed();
  console.log("\ncountries.mjs: done");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
}
