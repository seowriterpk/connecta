/**
 * City intro seeds — task 9-b.
 *
 * Seeds 29 UNIQUE long-form city intros into `entity_intros`
 * (entityType='city', entityName = EXACT city name as stored in the
 * `groups` table / rendered by /ciudad/{slug}). For each city:
 *   DELETE FROM entity_intros WHERE entityType='city' AND entityName=?
 *   INSERT (entityType='city', entityName=?, customTitle=NULL,
 *           customHeroDesc=NULL, customIntro=TEXT)
 *
 * Content spec: 3 paragraphs, 250-350 words, \n\n separated, plain text
 * (the city page splits on blank lines and renders <p> per paragraph).
 * Zero group counts / no "miles" / no invented verifiable-false claims.
 * Each intro: local life (real barrios, transport, ritmo) → what groups
 * people look for (real teams, universities, compraventa, work) → one
 * distinct local practical tip. Reference to "los grupos de arriba"
 * varied per city. Sibling cities (España/Colombia/México/Argentina and
 * the two Panamá rows) deliberately structured so they cannot read alike.
 *
 * Run from project root: node scripts/intro-seeds/cities.mjs
 */
import mysql from "mysql2/promise";

const cities = [
  {
    name: "Asunción",
    slug: "asuncion",
    paragraphs: [
      "El calor de Asunción se pelea con el tereré: mientras el sol aprieta, la gente anda con el termo bajo el brazo y la guampa lista para compartir. La vida de grupo empieza por el barrio. En Villa Morra y en Carmelitas se juntan los cafés, las casas de cambio y las oficinas. En el Mercado 4 se consigue de todo y el regateo es parte del trámite. Para moverte no hay metro: son buses que se pagan en efectivo, y la Costanera se llena de gente a la tarde, cuando el río se pone naranja.",
      "¿Qué grupos se buscan por acá? Los del clásico entre Olimpia y Cerro Porteño, que reparte la familia en dos cada fin de semana. Los de compra-venta del barrio, donde se ofrece desde ropa hasta motos. Los de estudio de la UNA, que queda en San Lorenzo, y los de la Católica para las mismas batallas. Los de trabajo y turnos en la zona de Villa Morra. Y los de planes: la parrillada del domingo, el fútbol sala del martes, el club del barrio. Más arriba te dejamos la lista de grupos de Asunción para que elijas con calma.",
      "Un consejo de alguien de acá: para comprar o vender por grupo, queda en la entrada del Shopping del Sol o en una esquina con gente, nunca en una casa vacía. Si te ofrecen un celular nuevo a mitad de precio, desconfía: en Asunción las ofertas demasiado buenas casi siempre tienen truco. Y el dólar, mejor en las casas de cambio de Carmelitas, no por mensaje privado.",
    ],
  },
  {
    name: "Barcelona",
    slug: "barcelona",
    paragraphs: [
      "Vivir en Barcelona es aprenderse la ciudad por barrios. Está Gràcia, con sus plazas donde la gente charla hasta la medianoche, y Sants, que vive a ritmo de estación. El metro te salva casi siempre y el bicing hace el resto. El vermut del mediodía es sagrado, las terrazas se llenan con el primer sol de marzo y, cuando llega la Mercè en septiembre, los castellers bajan a las plazas y la ciudad no duerme. En agosto medio barrio baja a la Barceloneta, y nadie se disculpa por llegar tarde.",
      "Los grupos que más se buscan aquí son de todo color: los debates del Barça, que se calientan solos cada partido; los de compra-venta y segunda mano entre quienes se mudan de distrito; los de la UB y la Pompeu Fabra, para apuntes y cervezas después de clase; y los de planes de finde, tipo caminata por Collserola o bajada al Garraf. La ciudad camina mucho y discute de todo con una birra en la mano. Ahí arriba tienes los grupos de Barcelona revisados uno por uno: entra, mira y quédate con los que te aporten algo.",
      "Un consejo local: en la L3 y en las plazas más turísticas, el móvil va en el bolsillo de adelante, no en el de atrás. Para cerrar tratos de segunda mano, queda en la puerta del mercado de Sant Antoni o en la entrada de los Encants: sitios con gente y luz. Y si alguien te pide dinero por adelantado para reservarte algo, esa es la señal para bloquear.",
    ],
  },
  {
    name: "Bogotá",
    slug: "bogota",
    paragraphs: [
      "El clima de Bogotá cambia de opinión tres veces al día. Llueve, sale sol, vuelve a llover, y todo el mundo sigue montado en la bici, porque los domingos la Séptima es de los ciclistas. La vida se reparte entre Chapinero, con sus cafés, La Candelaria, con sus balcones coloniales, y los cerros de Monserrate y Guadalupe, que miran la ciudad desde arriba. El TransMilenio la cruza por troncales rojas, y en hora pico se viaja pegado al de adelante. De madrugada, después de la rumba, el caldo de la esquina es obligatorio. Y a media tarde, las onces —chocolate con pan y queso— sostienen la jornada, como manda la tradición rola.",
      "¿Qué grupos se buscan en la capital? Los del clásico entre Millonarios y Santa Fe en El Campín, que divide la ciudad en dos. Los de compra-venta por barrios, de Chapinero a Suba. Los de la Nacional, los Andes y la Javeriana, para apuntes y proyectos. Los de trabajo y turnos. Y los de planes de fin de semana: mercado de pulgas en Usaquén, caminata al cerro, cine de arte. Arriba te dejamos los grupos de Bogotá ordenados y listos, con sus temas a la vista.",
      "Consejo de rolo: si vas a quedar con alguien del grupo, elige una estación troncal del TransMilenio o un parque con gente, nunca un sitio solo. A las siete de la mañana o a las cinco y media de la tarde el sistema va relleno, así que no fijes reuniones justo ahí. Y cuando llueva, avisa: aquí la lluvia retrasa hasta los planes mejor armados.",
    ],
  },
  {
    name: "Buenos Aires",
    slug: "buenos-aires",
    paragraphs: [
      "A las nueve de la mañana el subte D va relleno, y nadie se queja: se empuja. Esa es Buenos Aires a la hora pico. La ciudad se reparte en barrios con carácter propio. Palermo tiene cafés, plazas y perros con paseador; La Boca huele a pintura y a milonga; Almagro se vive alrededor de sus bares notables. Los colectivos cruzan todo con la SUBE, el tren Mitre te lleva a Tigre el fin de semana, y el café cortado con dos medialunas es el desayuno oficial, sin discusión.",
      "¿Qué se busca en grupos porteños? Fútbol antes que nada: la Bombonera y el Monumental tienen grupos propios, y el Superclásico parte el país en dos. También compra-venta de barrio, grupos de la UBA —la Facultad de Medicina y la de Filosofía son ciudades adentro de la ciudad—, trabajos y changas, y planes de finde: feria de Parque Centenario, paseo por el Rosedal, cine de la calle Corrientes. Cada barrio tiene su grupo, y los de Palermo no hablan de lo mismo que los de Constitución. Los grupos de Buenos Aires que ves arriba están ordenados para que encuentres el tuyo en dos minutos.",
      "Un consejo de pibe de acá: para comprar y vender, quedá en la boca del subte o en un café con mesas adentro, nunca en una esquina vacía. Desconfiá del que pide seña por transferencia antes de que veas el producto. Y si el precio es demasiado bueno, pensá dos veces: acá los golpes de suerte casi nunca son gratis.",
    ],
  },
  {
    name: "Cali",
    slug: "cali",
    paragraphs: [
      "En Cali la salsa no se escucha: se respira. Suena en el bus, suena en el parque del barrio, y en las noches de Granada y de la Sexta se baila hasta que el cuerpo avise. La ciudad se recorre en el MIO, con San Antonio arriba, con su capilla y su mirador, y el Cristo Rey saludando desde la loma. El calor baja un poco al atardecer, el cholado con fruta es la moneda de la siesta, y en diciembre el alumbrado del río cambia la cara de la ciudad.",
      "Los grupos más buscados son los del fútbol: el América, con su banda roja, y el Deportivo Cali, que aunque juegue en Palmira sigue siendo de la casa. También se buscan grupos de salsa para principiantes, con rueda y todo; grupos de estudio de la Univalle, la Javeriana y la Icesi; compra-venta por los lados de la Galería Alameda; y grupos de trabajo y planes de finde, de paseo a Pance cuando sale el sol. Revisa más arriba: ahí están los grupos de Cali esperando gente con ganas de verdad.",
      "Consejo caleño de corazón: la salsa en Juanchito se baila al otro lado del río, así que arreglá con el grupo cómo vuelven antes de ir, que el taxi de madrugada cuesta su plata. Para comprar y vender, la Galería Alameda de mañana es la mejor cita: fruta fresca, gente amable y menos calor. Y si te invitan a una rueda de salsa, aceptá: nadie nace sabiendo, y aquí se aprende pisando.",
    ],
  },
  {
    name: "Caracas",
    slug: "caracas",
    paragraphs: [
      "Caracas vive encajonada entre el Ávila y el calor del valle, y esa montaña es el termómetro del ánimo: cuando amanece despejado, la ciudad entera le saca foto. En Los Palos Grandes se camina entre cafés y librerías. En El Hatillo se toma café con dulces y se camina despacio. En Sabana Grande se compra de todo, apurado. El metro sigue siendo lo más rápido para cruzar la ciudad, y el teleférico sube a Galipán, donde los de arriba venden fresas con crema con la niebla de fondo.",
      "¿Qué grupos se buscan acá? Los del Caracas Fútbol Club, los Rojos del Ávila, y los de la Vinotinto cada vez que juega. Los de compra-venta por zonas, porque avisar primero es regla. Los de la UCV, con su Ciudad Universitaria declarada patrimonio, y los de la Simón Bolívar para las mismas guerras de apuntes. Los de trabajo y turnos. Y los de planes de fin de semana, porque salir en grupo acá es más seguro y más divertido. La lista de grupos de Caracas está más arriba, lista para que te unas y participes.",
      "Consejo de un caraqueño de ley: para ir a Galipán o al teleférico, pregunta antes en el grupo cómo está la carretera o si hay mantenimiento, porque a veces cierran por niebla o por trabajos. En los grupos de compraventa, cuidado con los celulares sellados a precio de regalo: si no dejan ver el equipo en persona, chao. Y cuando llueve, resta tiempo a todo, que la ciudad se pone lenta.",
    ],
  },
  {
    name: "Ciudad de Guatemala",
    slug: "ciudad-de-guatemala",
    paragraphs: [
      "La capital de Guatemala no se ordena por barrios: se ordena por zonas. La 10 es la zona viva, de restaurantes y hoteles. El Cuatro Grados Norte, en la zona 4, llenó de cafés y galerías lo que antes era pura bodega. Y Paseo Cayalá, en la 15, es como un pueblito nuevo donde todo luce ordenado. El TransMetro de buses rojos alivia las calzadas, las camionetas multicolores siguen cargando la historia del transporte, y el centro guarda la plaza con la catedral y el Palacio, como siempre. El chapín camina rápido, pero siempre saluda.",
      "¿Qué grupos se buscan? Los del clásico nacional entre Comunicaciones y Municipal, Cremas contra Rojos, con el Mateo repleto cada vez que se ven las caras. También compra-venta de la zona 1 y de los mercados del centro. Grupos de la USAC y de la Landívar, para apuntes, proyectos y el clásico lío de horarios. Grupos de trabajo en las zonas 10 y 15, y grupos de planes de fin de semana: Antigua, los volcanes, el lago. Arriba, bien ordenados, están los grupos de Ciudad de Guatemala.",
      "Un consejo de acá: cuando juegan Cremas y Rojos, los grupos se llenan de memes en cinco minutos. Si la pelota no es lo tuyo, silencia ese día y listo, no pasa nada. En compraventa, quedá cerca de un punto conocido: el Obelisco o el Tikal Futura son referencias que todo el mundo ubica. Y el tráfico de las cinco es leyenda: avisa si vas tarde, que acá se entiende.",
    ],
  },
  {
    name: "Ciudad de México",
    slug: "ciudad-de-mexico",
    paragraphs: [
      "Un chilango sabe leer el cielo gris, elegir la taquería de la esquina y encontrar el vagón del metro donde cabe uno más. La Roma y la Condesa concentran cafés, perros y terrazas; Coyoacán guarda su plaza con música los domingos; y el centro aguanta el ritmo de la ciudad entera entre el Zócalo y la Alameda. Entre el metro, el Metrobús y la Ecobici te mueves como puedas, porque el tráfico es un personaje más. Y el tianguis del barrio llega cada semana con su mantel de fruta, sin fallar.",
      "¿Qué grupos se buscan en el Valle? Los de fútbol, divididos entre las Águilas del América, la Máquina de Cruz Azul y los Pumas de la UNAM. Los de compra-venta por alcaldía, que la gente de la Roma no compra lo mismo que la de Iztapalapa. Los de la Universidad Nacional, para apuntes y prepa. Los de trabajo, freelancers y changas. Y los de planes: paseo en bici por Reforma un domingo, cine de arte, una pulquería del centro. Más arriba están los grupos de la Ciudad de México, revisados y ordenados por tema.",
      "Consejo de vecino de la Roma: los grupos del edificio funcionan cuando alguien modera. Pon reglas cortas y fijadas: solo temas del edificio, nada de cadenas ni ventas. Si nadie modera, en dos semanas el grupo es puro audio de doce minutos. Para el tianguis, lleva efectivo y llega temprano, porque lo bueno se va antes del mediodía. Y en la bici del domingo, agua y bloqueador, que el sol de acá no juega.",
    ],
  },
  {
    name: "Ciudad de Panamá",
    slug: "ciudad-de-panama",
    paragraphs: [
      "La Ciudad de Panamá se reconoce por sus torres: la zona bancaria de la Vía España creció hacia el cielo, y Punta Paitilla parece una ciudad de vidrio plantada al mar. En Bella Vista conviven el edificio antiguo y la torre nueva. La Cinta Costera corre junto a la bahía con ciclistas desde las cinco de la tarde, y el metro, esa Línea 1 que cambió la ciudad, conecta Albrook con el norte en minutos. En San Francisco queda el Multi, el mall donde tarde o temprano todo el mundo se cruza.",
      "Los grupos que más se buscan en esta ciudad son de trabajo: los bancos, las tiendas y los call centers de la zona bancaria publican turnos y vacantes. También moda y reventa —en el Multi se estrena y en Albrook se compra con calma—, grupos de la Universidad de Panamá y de la Tecnológica, grupos de fútbol para cuando juegan Tauro y Plaza Amador, y grupos para correr o pedalear la Cinta en manada. Y los de vecinos de Bella Vista y San Francisco, para lo del edificio y lo de la cuadra, que nunca sobran. Los grupos de Ciudad de Panamá que ves arriba están listos, con sus temas claros.",
      "Consejo capitalino a secas: a las cinco de la tarde la Vía España se para sola, así que organiza los encuentros fuera de esa franja. Para compraventa, las entradas de los malls son los puntos de encuentro clásicos: hay cámaras, gente y aire acondicionado. Y cuando la selección canalera juega, avisa antes de proponer planes: acá el país deja de trabajar un rato, de verdad.",
    ],
  },
  {
    name: "Córdoba",
    slug: "cordoba",
    paragraphs: [
      "En Córdoba la siesta se respeta: la persiana del centro baja a la una y media y la ciudad se calla un rato. Después vuelve todo, con más calor y menos apuro. La vida de grupo se reparte por barrios con carácter. Güemes, con sus arcos y la feria del Paseo de las Artes los fines de semana. Nueva Córdoba, donde viven los estudiantes de la UNC, la universidad más antigua del país. Y la costanera del Suquía para las tardes de mate antes de la salida.",
      "¿Qué grupos se buscan? Los del clásico de Talleres, el Matador de Barrio Jardín, contra Belgrano, el Pirata de Alberdi, que parte la ciudad al medio. Los de cuarteto, porque cuando suena La Mona nadie se queda sentado. Los de compra-venta de barrio, los de la UNC para apuntes y mesas de examen, los de trabajo y turnos, y los de finde en las Sierras, que en verano Carlos Paz se llena y la ruta lo sabe. Más arriba te dejamos los grupos de Córdoba, con la onda local intacta.",
      "Consejo de cordobés de nacimiento: si mandás mensaje al grupo a las tres de la tarde, no esperés respuesta inmediata, acá la siesta se toma en serio. El fernet va con Coca, hielo y poca vergüenza. Y si vas a Carlos Paz el domingo, salí temprano, que la ruta se pone lenta desde las once. Para encontrarse, la plaza de Güemes o el Paseo de las Artes funcionan: los ubica todo el mundo.",
    ],
  },
  {
    name: "Guadalajara",
    slug: "guadalajara",
    paragraphs: [
      "Guadalajara huele a torta ahogada por la mañana y a mariachi por la noche. La Colonia Americana, con sus casonas convertidas en cafés y galerías, es el barrio del momento; la avenida Chapultepec concentra la marcha de jueves a domingo; y Tlaquepaque, con su Parián y sus talleres de artesanía, es el plan clásico de domingo. El Tren Ligero va a Zapopan sin sufrir el tráfico, el Mi Macro Periférico pelea la vuelta a la ciudad, y el tapatío defiende, con orgullo y argumentos, que aquí se come mejor que en la capital.",
      "Los grupos más buscados son de fútbol, claro: el clásico tapatío entre las Chivas del Guadalajara y los Zorros del Atlas divide familias enteras. También hay grupos de la UdeG para prepa y facultad, de compra-venta de colonia, de trabajo y vacantes, y de planes: Fiestas de Octubre, conciertos, y el mercado de Tonalá, que es de domingo y de madrugar. La lista de grupos de Guadalajara está más arriba, órale, dale una mirada y agarra los que te sirvan. Y si te gustan el fútbol y el mariachi, hay grupos que mezclan las dos pasiones.",
      "Consejo tapatío de manual: la torta ahogada se pide media si no aguantas el chile, y los valientes la piden bien ahogada. El mercado de Tonalá hay que agarrarlo temprano, porque al mediodía ya no queda nada bueno. Para quedar con gente del grupo, la Glorieta de Chapultepec o una estación del Tren Ligero son puntos que todos ubican. Y en el clásico tapatío, respeta la casa: aquí hasta el perro sabe de qué equipo es.",
    ],
  },
  {
    name: "La Habana",
    slug: "la-habana",
    paragraphs: [
      "En La Habana el día se resuelve. El almendrón recorre la Calzada con su ruta fija y su tarifa pactada a gritos, la guagua va llena pero llega, y el Malecón sigue siendo el punto de encuentro más grande de la isla. En Vedado la vida pasa bajo los pórticos, en Habana Vieja los visitantes se mezclan con los vecinos, y la fila de Coppelia tiene sus propias reglas, que se aprenden rápido. La ciudad camina despacio, pero siempre está al tanto de lo que pasó anoche.",
      "¿Qué grupos se buscan acá? Los de béisbol de los Leones Azules de Industriales, que ponen el orgullo de la capital en cada serie. Los de compra, cambio y trueque, porque cuando algo aparece, el grupo se entera primero. Los de la Universidad de La Habana, para apuntes y avisos. Los del barrio, para resolver entre vecinos lo que se pueda resolver. Y los de planes: una ida a la playa del Este, un partido en el Latinoamericano. Más arriba están los grupos de La Habana que conseguimos revisar; entra a los que te sirvan.",
      "Un consejo de asere a asere: en WhatsApp, desactiva la descarga automática de fotos y videos. Los datos de ETECSA valen su precio y se acaban volando, sobre todo en grupos con gente que comparte de todo. Revisa los grupos cuando tengas wifi o saldo, y guarda el paquete para lo que importa. Y si vas a quedar con alguien, la esquina con luz y gente siempre es mejor que la esquina sola.",
    ],
  },
  {
    name: "La Paz",
    slug: "la-paz",
    paragraphs: [
      "La Paz se viaja por el aire: la red de teleféricos urbanos más grande del mundo cruza entre El Alto y el cañón, y la gente se mueve mirando la ciudad desde arriba, como en un mirador permanente. El Prado marca el paso del centro. Sopocachi tiene su aire bohemio entre cafés y la calle Jaén, con sus museos apretaditos. La Zona Sur baja en temperatura y sube en comodidad. Todo esto pasa a más de tres mil quinientos metros de altura, donde el aire es fino y la salteña es comida de mañana.",
      "¿Qué grupos se buscan? Los del clásico paceño entre Bolívar, la Academia, y The Strongest, el Tigre. Los de compra-venta de los mercados y de la calle Eloy Salmón, donde se arma la electrónica. Los de la UMSA, para clases, apuntes y foros. Los de trabajo y turnos en la Zona Sur. Y los de planes: el show de las cholitas luchadoras en El Alto es una salida que hay que hacer con grupo. En la hora pico, el teleférico va lleno pero siempre con vista. Arriba te dejamos los grupos de La Paz con sus temas a la vista.",
      "Consejo de paceño: las salteñas se compran de mañana, con su jugo adentro; a la una de la tarde ya no queda. Se muerde la puntita, se sorbe el caldo y después se come, porque al revés te manchas toda la camisa. Si llegas de afuera, los primeros días camina lento y toma mate de coca: la altura no perdona de entrada, y el resto de la ciudad tampoco.",
    ],
  },
  {
    name: "Lima",
    slug: "lima",
    paragraphs: [
      "El madrugón es un deporte limeño: salir a las seis para llegar a las ocho no es exageración, es calendario. La ciudad vive entre el mar de Miraflores y el bullicio del Cercado, con el Malecón para caminar mirando acantilados y Barranco para las noches de peña y arte. La combi con su cobrador gritando que suba, suba, es transporte y gimnasia al mismo tiempo. El Metropolitano alivia lo suyo, y en invierno la garúa pinta el cielo gris por semanas. La recompensa de siempre: un cebiche de mercado al mediodía.",
      "¿Qué grupos se buscan? Los de fútbol entre Alianza, la U y el Cristal, que en cada clásico llenan los grupos de memes y discusión sana. Los de compra-venta de barrio, porque la feria del mercado sigue siendo el centro comercial de la casa. Los de San Marcos, la primera universidad de América, y de la Católica. Los de trabajo y ofertas. Y los de planes de finde, de parapentes sobre el Malecón a una mesa de leche de tigre en el mercado. Más arriba están los grupos de Lima, causa, ordenados y listos.",
      "Consejo de limeño de pura cepa: el cebiche se come al mediodía. A las ocho de la noche los cebiches buenos ya cerraron, y el que te lo ofrezca de noche te está vendiendo otra cosa. Para quedar con gente del grupo, la puerta de un mercado o una estación del Metropolitano funcionan. Y en la combi, el celular en el bolsillo delantero, nunca en el de atrás.",
    ],
  },
  {
    name: "Madrid",
    slug: "madrid",
    paragraphs: [
      "Malasaña despierta tarde y Vallecas no duerme nunca: en esa frase cabe media Madrid. La ciudad se mueve en metro, una de las redes más grandes del mundo, y en Cercanías para quien vive más lejos. Los domingos, el Rastro tiende sus puestos por la Ribera de los Curtidores, y el centro huele a tortilla y a cañas. Las terrazas se llenan con el primer sol de marzo, la verbena de San Isidro convierte mayo en fiesta, y aquí se cena a las diez sin que nadie levante una ceja.",
      "¿Qué grupos se buscan en la capital? Los del derbi entre el Real Madrid y el Atlético, más los del Rayo de Vallecas, el equipo del barrio que nunca abandona al barrio. Los de compra-venta y mudanzas entre distritos. Los de la Complutense en Moncloa, para apuntes y birras después de clase. Los de curro, ofertas y turnos. Y los de planes de finde: tapas por la Cava Baja, un día de Casa de Campo, sofá y manta en enero. Los domingos de tapas por la Latina acaban siempre más tarde de lo previsto. Arriba tienes los grupos de Madrid, vale, revisa con calma y elige los tuyos.",
      "Consejo de madrileño de toda la vida: el Rastro es de domingo y de mediodía, y los carteristas también madrugan, así que el móvil va en el bolsillo de adelante. Para compraventa, queda en la puerta de un mercado o de un centro comercial, con gente alrededor. Y cuando quedes con alguien, avisa de línea de metro: aquí un «llego en diez» puede ser media hora de trayecto.",
    ],
  },
  {
    name: "Managua",
    slug: "managua",
    paragraphs: [
      "Managua no usa nombres de calle: usa puntos de referencia. «De donde era el banco, dos cuadras al lago y una arriba»: así se llega a cualquier parte. El centro viejo quedó vacío después del terremoto del 72, y la ciudad se repartió en centros comerciales, malecones y puntos de encuentro. El Puerto Salvador Allende mira al lago Xolotlán, la laguna de Tiscapa guarda su mirador verde, los taxis se comparten y las direcciones se explican con las manos. Por eso el pin de WhatsApp vale acá más que cualquier dirección escrita.",
      "¿Qué grupos se buscan? Los de béisbol, porque aquí la pelota manda: cuando juegan los Indios del Bóer, la familia se divide con el rival de turno y la pelota se conversa todo el día. Los de compra-venta de los mercados, del Oriental para todo y del Huembes para la compra de siempre. Los de la UNI, la UNAN y la UCA, para apuntes y trabajos. Los de trabajo y turnos. Y los de la gritería del 7 de diciembre, cuando las casas se llenan de altares y la ciudad canta a la purísima. Los grupos de Managua que ves arriba están ahí para todo eso.",
      "Consejo pinolero: comparte tu ubicación en vivo por WhatsApp y pide la del otro. Acá mandar una dirección escrita casi nunca funciona, porque la gente se ubica por referencias, y las referencias cambian. «Del árbol que ya no está, dos cuadras al lago» es una dirección real y muy managua: pregunta bien antes de salir. Y para quedar, cualquier rotonda grande con letrero, que de eso está lleno el mapa.",
    ],
  },
  {
    name: "Medellín",
    slug: "medellin",
    paragraphs: [
      "La eterna primavera no es cuento: en Medellín se anda en camisa todo el año, con una lluvia corta de tarde que todo el mundo espera y nadie respeta. La ciudad se baja y se sube. La Comuna 13, con sus escaleras eléctricas y sus murales, es la cara del cambio. El Poblado es restaurante y rumba. Laureles es más paisa y más tranquilo, con la Setenta para tomarse algo. El metro es orgullo de todos, por ahora el único del país, y el Metrocable sube a las comunas colgando del aire, con la ciudad a los pies.",
      "Los grupos más buscados: los del clásico entre el DIM, el Poderoso, y el verde de Atlético Nacional, que llena el Atanasio Girardot cada vez. Los de compra-venta de barrio. Los de la UdeA y de la EAFIT, para apuntes y proyectos. Los de trabajo, vacantes y emprendimiento, que esta ciudad es una fábrica de ideas. Y los de planes: la Feria de las Flores con sus silleteros, el parque Arví arriba del cable, y las salidas de Laureles. De paso, la vista desde el cable vale la cola. Más arriba, parce, están los grupos de Medellín listos.",
      "Consejo paisa: para encontrarse con gente del grupo, queda en una estación del metro. Todas son puntos conocidos, con señalización y vigilancia. Lleva chaqueta ligera: subir a Arví te cambia el clima en media hora. Y si el plan es rumba en El Poblado, mira antes el último horario del metro, que cierra temprano; el regreso se arregla mejor con tiempo que con suerte.",
    ],
  },
  {
    name: "Monterrey",
    slug: "monterrey",
    paragraphs: [
      "Lo primero que ves al llegar a Monterrey es el Cerro de la Silla: la montaña con silueta de montura que los regios miran como parte de la familia. La ciudad es trabajo y apuestas. Las torres del Valle Oriente, en San Pedro, crecen cada año. El Barrio Antiguo guarda la rumba de los fines de semana, y el centro guarda sus mercados de siempre, donde el cabrito se encarga desde temprano. El Metrorrey conecta lo justo, y el resto es camión o carro, porque el calor no invita a caminar.",
      "¿Qué grupos se buscan? Los del Clásico Regiomontano entre Rayados y Tigres, con el Tec y la UANL de por medio, que parte la casa en dos. Los de compra-venta de colonia. Los de estudio del Tec de Monterrey, que nació aquí, y de la UDEM. Los de trabajo y vacantes en las empresas del área, que de eso está llena la región. Y los de planes de finde: la ruta a la Cola de Caballo, el paseo a Santiago, la carne al asador en la casa de alguien del grupo. Arriba te dejamos los grupos de Monterrey, ordenados y con la info clara.",
      "Consejo regio: en julio y agosto el calor pasa de los cuarenta grados, así que organiza los planes del grupo de madrugada o de noche, o refúgiate en un mall, que para eso están. Para quedar, una estación del Metrorrey o la Macroplaza son puntos que todos ubican. Y con boletos de Rayados-Tigres a mitad de precio por canales raros, cuidado: la reventa tiene letra pequeña.",
    ],
  },
  {
    name: "Montevideo",
    slug: "montevideo",
    paragraphs: [
      "La Rambla es la calle más larga y más querida de Montevideo: kilómetros de costa donde la gente camina, anda en patín y toma mate sin parar, con el termo bajo el brazo como si fuera parte del cuerpo. La Ciudad Vieja guarda la historia entre casonas y el mercado del Puerto, con su parrilla humeante. Pocitos tiene su playa y su vida de barrio. Y los domingos, la feria de Tristán Narvaja toma la calle con libros, herramientas y objetos con historia. Si llueve, hay tortas fritas: así de simple.",
      "¿Qué grupos se buscan? Los del clásico entre Nacional y Peñarol, que se juega en el Centenario, el estadio del primer Mundial de la historia. Los de compra-venta de las ferias barriales, de las que cada barrio tiene la suya. Los de la UDELAR, de todas las facultades. Los de trabajo y changas. Y los de mate y planes: la vuelta por la rambla al atardecer no se negocia. El mate va en ronda: se agradece y se devuelve, esa es la educación. Arriba están los grupos de Montevideo, bo, con sus temas a la vista y sin vueltas.",
      "Consejo de montevideano: anótate los días de feria de tu barrio —la de Pocitos es miércoles y sábado— y lleva efectivo, porque las ferias funcionan con billetes. En los grupos de compraventa, desconfiá del que pide pago adelantado y envío: quedá en la feria o en la rambla, con gente alrededor. Y en la salita de la casa, donde se recibe la visita con mate y facturas, también se arman los mejores planes de la semana.",
    ],
  },
  {
    name: "Panamá",
    slug: "panama",
    paragraphs: [
      "El Casco Antiguo de Panamá se recorre a pie: techos de teja, iglesias de hace siglos y balcones con flores. En la plaza de la Catedral los vecinos toman su café, en la Plaza Francia los artistas ponen su puesto, y el mercado de mariscos, ahí cerquita, sirve el ceviche de la capital antes del mediodía. La calzada de Amador sale derecho al mar, con el Biomuseo de colores abriendo el camino, y frente a todo el paisaje cruza el Canal: en Miraflores los barcos suben y bajan las esclusas como una película lenta.",
      "¿Qué grupos se buscan en esta orilla? Los de la selección canalera, que para la gente de acá es una cita frente al televisor. Los de artesanos y compraventa del Casco. Los de vecinos de San Felipe, con los avisos del barrio a tiempo. Los de quienes trabajan en turismo y restaurantes, que el Casco amanece antes que la ciudad. Y los de planes: bici por la calzada al amanecer, una tarde de brisa en la punta. Más arriba te dejamos los grupos de Panamá, con su sabor del Casco y del canal.",
      "Consejo de acá, con historia incluida: si te ofrecen el famoso sombrero «panamá», pregunta de dónde viene. Nació en Ecuador y se hizo famoso cuando se vendía a los viajeros del Canal. Bonito igual, pero no es artesanía local. En compraventa del Casco, queda en la plaza de la Catedral o en el mercado de mariscos: puntos con movimiento de gente y fáciles de ubicar. Y camina con agua los días de sol, que el Casco tiene poquita sombra.",
    ],
  },
  {
    name: "Puebla",
    slug: "puebla",
    paragraphs: [
      "La talavera de Puebla se pinta a mano y se cuece dos veces, y las piezas buenas llevan la marca del taller al reverso. Ese detalle resume la ciudad: orgullosa de lo que hace bien. El centro histórico, patrimonio de la humanidad, se recorre entre casonas con azulejos. El Barrio de los Sapos junta anticuarios y cafés los fines de semana. Y a un lado queda Cholula, con su pirámide enorme, la más grande del mundo en volumen, y el Popocatépetl de fondo, que cuando se pone activo rocía ceniza sobre los autos.",
      "¿Qué grupos se buscan? Los de la Franja del Puebla, los camoteros, para sufrir y celebrar en compañía. Los de compra-venta de barrio. Los de la BUAP, para apuntes y trámites, y los de la UDLAP, allá en Cholula. Los de trabajo en las empresas de la zona, que la región es industrial y no lo esconde. Y los de planes: chiles en nogada en temporada, mole para la fiesta, cemitas el domingo. Cada fiesta en Puebla termina en mesa, y la mesa siempre es larga. Los grupos de Puebla están más arriba, con sus temas claritos.",
      "Consejo poblano: si compras talavera, mira que la pieza traiga el sello del taller; si no trae nada, es imitación. Los chiles en nogada tienen temporada, entre julio y septiembre más o menos, así que cuando en el grupo avisen que ya llegaron, ve esa misma semana. Y el 5 de mayo aquí sí se celebra a lo grande: desfile, fuertes de Loreto y Guadalupe, y la ciudad de gala.",
    ],
  },
  {
    name: "Quito",
    slug: "quito",
    paragraphs: [
      "Quito te recibe a dos mil ochocientos cincuenta metros: la luz es limpia, el frío entra por el cuello aunque el sol esté brillando, y el cielo cambia de plan sin avisar. El centro histórico, de los primeros que la UNESCO declaró patrimonio, se camina entre iglesias barrocas y plazas con historia. La Floresta tiene cafés, murales y vida de barrio; la Mariscal es la zona de la marcha; y el Trole y la Ecovía llevan a la gente de norte a sur, con el metro ya dando sus vueltas. El helado de paila es postre de tradición: se bate en paila de bronce, con hielo y fruta.",
      "¿Qué grupos se buscan? Los de Liga de Quito y de Aucas, que cuando se ven las caras, la conversación se pone de colores. Los de compra-venta de los mercados, como la Iñaquito, donde la fruta llega de la sierra esa mañana. Los de la Católica y de la Central, para apuntes y horarios. Los de trabajo y turnos. Y los de planes: subir por el teleférico a Cruz Loma, las noches de la Mariscal, las caminatas del fin de semana. Más arriba están los grupos de Quito, de una, revísalos con calma.",
      "Consejo quiteño: guarda un abrigo en la mochila aunque amanezca soleado. Aquí graniza y sale sol en la misma tarde, y a esa altura el cuerpo siente cada escalera. Para quedar con gente del grupo, elige puntos del centro o una estación del Trole que todos ubiquen. Y si acabas de llegar, tómala con calma los primeros días: la altura cobra, pero se paga barato con vistas así.",
    ],
  },
  {
    name: "San José",
    slug: "san-jose",
    paragraphs: [
      "A San José casi nadie la llama por su nombre: le dicen Chepe. El centro guarda casonas de colores de finales del siglo pasado, el Mercado Central huele a café y a culantro, y el Barrio Escalante se convirtió en el barrio de los restaurantes, con su paseo gastronómico para caminarlo de arriba abajo. En San Pedro vive la Universidad de Costa Rica, con sus estudiantes y sus sodas de siempre. El tren de cercanías volvió a correr, y la lluvia de la tarde, en temporada verde, es más puntual que muchos buses.",
      "¿Qué grupos se buscan? Los del Saprissa, el Monstruo del Morado, y los de la Sele cuando juega, que aquí hasta el que no mira fútbol mira a la Sele. Los de compra-venta de barrio y de las ferias. Los de la UCR, para apuntes, torneos y el lío sagrado de la matrícula. Los de trabajo y vacantes. Y los de planes: café en Escalante, una birra en el centro, el fútbol del sábado. Los grupos de San José están más arriba, mae, échales un ojo y agarra los que te sirvan.",
      "Consejo tico: cada barrio tiene su feria del agricultor el fin de semana, con fruta más fresca y más barata que en el súper, y se paga en efectivo. Si el grupo organiza algo al aire libre, que sea en la mañana: la lluvia de la tarde en temporada verde no falla. Y con el tráfico de la hora pico, avisa si vas tarde, que acá se entiende, pero se agradece.",
    ],
  },
  {
    name: "San Juan",
    slug: "san-juan",
    paragraphs: [
      "La Placita de Santurce es dos lugares en uno: de día, mercado de frutas y verduras; de noche, la plaza más animada de la ciudad, con música en vivo y tragos en la mano. Así es San Juan. El Viejo San Juan camina sobre adoquines azulados que brillan con la lluvia, la Calle Loíza se llenó de restaurantes y murales, y el Condado vive entre torres y playa. El Tren Urbano te sirve si andas entre Río Piedras, Guaynabo y Bayamón, y la UPR alza su torre en Río Piedras, como siempre.",
      "¿Qué grupos se buscan? Los de los Cangrejeros en temporada de pelota invernal, que la pelota de invierno es herencia de casa. Los de compra-venta y reventa de todo. Los de la UPR de Río Piedras, para clases, apuntes y sobrevivir la matrícula. Los de trabajo, sobre todo en la zona hotelera. Y los de planes: salsa en vivo, una tarde de El Yunque, un día de playa en Piñones. En enero, la Calle San Sebastián llena Santurce de música: los grupos avisan dónde juntarse. Más arriba están los grupos de San Juan, boricua, listos para que te unas.",
      "Consejo de aquí: en temporada de huracanes, de junio a noviembre, los grupos de vecinos son un salvavidas: ahí corre la información de dónde hay luz, hielo y gasolina cuando algo pasa. Únete al de tu calle antes del verano. En la Placita, llega temprano si quieres mesa los viernes, que la noche se llena sola. Y mofongo: pídelo con calma, que llena más de lo que parece.",
    ],
  },
  {
    name: "San Salvador",
    slug: "san-salvador",
    paragraphs: [
      "San Salvador se vive en colonias. La Escalón y su Zona Rosa concentran restaurantes y oficinas; Santa Tecla, al pie del volcán, guarda las noches frescas y el arte; y el centro histórico, recién renovado, volvió a ser el lugar para caminar el domingo. Para cruzar la ciudad, camiones y buses hacen lo que pueden, el tráfico de las cinco es leyenda, y las pupusas del mediodía son la religión más practicada del país. Cuando la Selecta juega en el Cuscatlán, el estadio más grande de Centroamérica, la ciudad entera suena.",
      "¿Qué grupos se buscan? Los de fútbol y de la Selecta, para sufrir acompañado. Los de compra-venta, porque el trueque y la reventa mueven mucho. Los de la UES y de la UCA, para apuntes, proyectos y avisos del campus. Los de trabajo y vacantes. Los de vecinos de cada colonia, con alertas y avisos útiles. Y los de surf: las playas de La Libertad, El Tunco y El Zonte, quedan a un rato en carro, y los grupos de Surf City viven organizando subidas. Arriba te dejamos los grupos de San Salvador, maje, con todo ordenado.",
      "Consejo salvadoreño: en los grupos de compraventa aquí casi todo se mueve en dólares, y algunos aceptan Bitcoin además; manda solo lo que puedas permitirte perder, porque una transferencia no se devuelve. Para quedar, un punto conocido de la Escalón o una gasolinera con cámaras. Y las pupusas se piden por docena, revueltas, con su curtido aparte: eso lo aprende hasta el que acaba de llegar.",
    ],
  },
  {
    name: "Santiago",
    slug: "santiago",
    paragraphs: [
      "La once es casi religión en Santiago: pasadas las cinco de la tarde, la mesa se llena de pan, palta y té, y nadie la salta. La ciudad se mueve por su metro, con la Línea 1 cruzando el centro de punta a punta. La Vega Central surte la cocina de media región, y la persa Bío Bío es el imperio de lo de segunda, donde todo tiene dueño nuevo esperando. Los barrios tienen vocación: Bellavista rumba y arte, Barrio Italia junta cafés y diseño, y Ñuñoa es de ferias, familias y fútbol.",
      "¿Qué grupos se buscan? Los del clásico entre Colo-Colo, el Cacique, y la Universidad de Chile, la U, que parte el ambiente en dos. Los de compra-venta de las ferias y las persas, donde se regatea con una sonrisa. Los de la U de Chile y de la Católica, para apuntes y organizarse. Los de trabajo y empleos. Y los de planes: subir al San Cristóbal, tomarse un terremoto con helado adentro en la zona del Yungay, una vuelta en bici por el parque Forestal. Los grupos de Santiago están más arriba, po, elige los tuyos y avanza.",
      "Consejo santiaguino: en invierno hay días de preemergencia, cuando el aire se pone malo y cambian las reglas del día; revisa el estado ambiental antes de armar planes al aire libre. El taco de la tarde no perdona: para quedar, mejor una estación de metro del centro, que todos ubican. Y en la persa, regatea con buena onda, que es parte del precio.",
    ],
  },
  {
    name: "Santo Domingo",
    slug: "santo-domingo",
    paragraphs: [
      "Al atardecer, el Malecón de Santo Domingo se llena de gente que va a mirar el mar, tomarse un frío y despejar la cabeza lejos del tráfico. La Zona Colonial guarda la catedral más antigua de América, y en sus calles nació la primera universidad del continente. El metro y el teleférico alivian el trayecto, Piantini y Naco concentran los malls y las torres nuevas, y el mangú con los tres golpes sostiene la semana desde el desayuno. La ciudad corre caliente, y la pelota de invierno le pone música.",
      "¿Qué grupos se buscan? Los del Licey y del Escogido, que dividen la capital entre azules y rojos cada temporada. Los de compra-venta y reventa, de todo y para todo. Los de la UASD, heredera de la primera universidad de América. Los de trabajo y ofertas, sobre todo en la zona colonial y los malls. Y los de planes: un día de playa en Boca Chica, una tarde colonial de domingo, una noche de salsa en la ciudad. Los domingos la Colonial es un plan completo: museos, cafés y música en las plazas. Más arriba están los grupos de Santo Domingo; qué lo qué, dale una mirada y únete a los que te muevan.",
      "Consejo dominicano: la pelota invernal va de noviembre a enero, y el Quisqueya se llena; si quieres seguir la temporada con la peña de tu equipo, únete a los grupos antes de que arranque. Para compraventa, queda en un punto con gente: la puerta de un mall de Piantini o una estación del metro. Y desconfía del teléfono sellado a mitad de precio: la caja vacía también pesa.",
    ],
  },
  {
    name: "Sevilla",
    slug: "sevilla",
    paragraphs: [
      "Triana queda al otro lado del puente, y los trianeros te lo recuerdan cada vez que pueden. En Sevilla la vida se organiza alrededor del río y de las tapas: el pescaíto frito en una barra de la calle Betis, la cerámica pintada en los talleres de Triana, y Santa Cruz, que es un laberinto de callejones que en abril huele a azahar. La Giralda vigila el centro desde su torre, el metro y el tranvía hacen lo suyo, y la bicicleta pública, la Sevici, es de las más queridas de España. Aquí se sale de tapas y se vuelve tarde, sin culpa.",
      "¿Qué grupos se buscan? Los del gran derbi entre el Betis y el Sevilla, que esta ciudad lo vive como pocas. Los de compra-venta de barrio y de mudanza. Los de la Hispalense, para apuntes, exámenes y turnos de biblioteca. Los de trabajo y turnos. Y los de planes: la Semana Santa, la Feria de Abril, el tapeo del jueves, una ruta en bici por la Cartuja. Arriba están los grupos de Sevilla, illo, entra y elige con calma.",
      "Consejo hispalense de peso: en la Feria de Abril, la mayoría de las casetas son privadas y se entra de la mano de alguien de la familia o de un grupo de amigos. Tener grupo de caseta o de amigos es la llave de la Feria; sin él, te quedas mirando los farolillos desde afuera. Para compraventa, queda en la puerta de un bar con terraza de Triana o del centro. Y en el derbi, ubícate antes de escribir: aquí se nace bético o sevillista.",
    ],
  },
  {
    name: "Tegucigalpa",
    slug: "tegucigalpa",
    paragraphs: [
      "Tegucigalpa trepa por los cerros, y cada colonia tiene su propio clima: en Palmira está la movida de oficinas y hoteles, en Lomas del Guijarro las casas con vista, y Colonia Kennedy aguanta el día a día de la mayoría. El Picacho corona la ciudad con su monumento y su mirador, el centro guarda la catedral y su parque, y el Mercado Mayoreo es el corazón comercial, donde se vende de todo y se negocia de todo. En invierno las lluvias caen serias y las calles bajas se llenan de agua; en verano, el cielo se limpia y el cerro se ve entero.",
      "¿Qué grupos se buscan? Los del clásico de la capital entre Olimpia y Motagua, el Ciclón Azul contra los albos, que pone la ciudad a hablar. Los de compra-venta de los mercados y de las colonias. Los de la UNAH, para apuntes, matrícula y torneos. Los de trabajo y vacantes, que Tegus y alrededores dan para mucho. Y los de vigilancia del barrio: en cada colonia hay un grupo de vecinos que comparte alertas, y es de lo más útil que existe. Arriba te dejamos los grupos de Tegucigalpa, ordenados por tema y listos.",
      "Consejo catracho: cuando llueva fuerte, pregunta en el grupo de la colonia qué calles están complicadas antes de salir; los que conocen la ciudad saben por dónde no hay que pasar. Para quedar por compraventa, elige una gasolinera o un centro comercial de la zona, con luz y movimiento. Y en el clásico Olimpia-Motagua, piensa dos veces lo que escribes: el admin del grupo también tiene equipo.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Self-checks (fail fast BEFORE touching the DB)
// ---------------------------------------------------------------------------
const intros = cities.map((c) => ({ ...c, intro: c.paragraphs.join("\n\n") }));

const firstWords = new Map();
for (const c of intros) {
  const words = c.intro.trim().split(/\s+/).length;
  if (words < 250 || words > 350) {
    throw new Error(`${c.name}: ${words} words (out of 250-350 range)`);
  }
  const paras = c.intro.split(/\n\s*\n/);
  if (paras.length !== 3) {
    throw new Error(`${c.name}: ${paras.length} paragraphs (expected 3)`);
  }
  // No group counts / "miles" / member-limit talk in city intros.
  if (/\bmill?ones?\b|\bmiles\b|\b1\.?024\b|\bintegrantes\b/i.test(c.intro)) {
    throw new Error(`${c.name}: forbidden word (miles/millones/1024/integrantes)`);
  }
  // Unique opening pattern: first 3 words must not repeat across intros.
  const key = c.intro
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
  if (firstWords.has(key)) {
    throw new Error(`Shared first-sentence pattern: "${key}" (${firstWords.get(key)} & ${c.name})`);
  }
  firstWords.set(key, c.name);
  if (/\s$/.test(c.intro)) {
    throw new Error(`${c.name}: trailing whitespace`);
  }
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "grupos",
  password: "",
  database: "gruposwhatsapp",
  connectionLimit: 2,
});

// Safety: every entityName must match a live-group city exactly.
const [liveRows] = await pool.query(
  "SELECT DISTINCT `city` FROM `groups` WHERE `status` = 'live' AND `city` IS NOT NULL AND `city` <> ''"
);
const liveCities = new Set(liveRows.map((r) => r.city));
const missing = intros.filter((c) => !liveCities.has(c.name));
if (missing.length > 0) {
  throw new Error(
    "entityName mismatch vs live groups table: " + missing.map((c) => c.name).join(", ")
  );
}

for (const c of intros) {
  await pool.execute(
    "DELETE FROM `entity_intros` WHERE `entityType` = ? AND `entityName` = ?",
    ["city", c.name]
  );
  await pool.execute(
    "INSERT INTO `entity_intros` (`entityType`, `entityName`, `customTitle`, `customHeroDesc`, `customIntro`) VALUES (?, ?, NULL, NULL, ?)",
    ["city", c.name, c.intro]
  );
  const words = c.intro.trim().split(/\s+/).length;
  console.log(`ok  ${c.name}  (${c.slug})  ${words} palabras`);
}

await pool.end();
console.log(`cities.mjs: seeded ${intros.length} city intros`);
