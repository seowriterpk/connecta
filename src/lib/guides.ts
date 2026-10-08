// ConectaGrupos — guías prácticas compartidas entre la home y /guias.
// Mantenido en un módulo separado (sin "use client") para poder importarse
// tanto desde componentes de servidor como de cliente.

export interface Guide {
  icon: string;
  title: string;
  tag: string;
  excerpt: string;
  body: string;
}

export const GUIDES: Guide[] = [
  {
    icon: "🆕",
    title: "Cómo crear un grupo de WhatsApp paso a paso",
    tag: "Principiantes",
    excerpt:
      "Desde el nombre hasta las normas de convivencia: lo que conviene pensar antes de invitar a la primera persona.",
    body: `Antes de tocar el botón «Nuevo grupo», vale la pena pararse a pensar dos cosas: el nombre y el propósito. Un nombre claro («Running Chile — corremos juntos») funciona mejor que uno vago (« Grupo »), porque así la gente sabe qué hace ahí dentro antes de entrar.

Pasos prácticos:
1. Abre WhatsApp, pulsa el icono de nuevo grupo y selecciona al menos un contacto para empezar.
2. Pon un nombre corto y descriptivo. Puedes añadir un emoji que ayude a identificarlo.
3. Escribe un mensaje de bienvenida fijado con las normas: horarios, temas permitidos y qué pasa si se incumplen.
4. Configura quién puede editar la información del grupo (te recomendamos «Solo administradores»).
5. Invita poco a poco. Un grupo que crece Orgánicamente conversa mejor que uno que se llena de golpe con desconocidos.

Truco final: cambia el enlace de invitación cada cierto tiempo si el grupo es público. Así evitas que termine en listas de spam que no controlas.`,
  },
  {
    icon: "🔗",
    title: "Enlaces de invitación: cuándo usarlos y cuándo no",
    tag: "Privacidad",
    excerpt:
      "Un enlace público es cómodo, pero tiene riesgos. Te contamos la diferencia entre enlace estándar y de un solo uso.",
    body: `WhatsApp ofrece dos tipos de enlace: el clásico (válido hasta que lo restablezcas) y el de un solo uso, que caduca a la semana aunque nadie lo use. Para grupos pequeños y privados, el de un solo uso es casi siempre mejor.

¿Cuándo revocar un enlace?
- Si ves que entran personas que nadie invitó.
- Si el enlace se compartió en un sitio público sin tu control.
- Cada 2-3 meses, por precaución, en grupos grandes.

Restablecer el enlace no echa a nadie del grupo: solo invalida el enlace antiguo. Quien ya está dentro, sigue dentro. Es una operación segura y conviene hacerla sin miedo cuando notes movimiento raro.`,
  },
  {
    icon: "🛡️",
    title: "Señales de estafa en grupos de WhatsApp",
    tag: "Seguridad",
    excerpt:
      "Ofertas imposibles, urgencia artificial, peticiones de dinero o datos. Aprende a detectar los patrones más comunes.",
    body: `Las estafas por WhatsApp siguen patrones bastante predecibles. Si ves varias de estas señales juntas, desconfía:

- Urgencia: «Solo hoy», «en 10 minutos se acaba», «última plaza». La prisa es la herramienta favorita del estafador.
- Demasiado bueno: un móvil de 1000€ por 150€, un trabajo que paga el triple por la mitad de horas.
- Salida del grupo: te insisten en continuar por privado, donde nadie puede ver lo que dicen.
- Pago por adelantado: te piden dinero o datos bancarios antes de entregarte nada.
- Datos sensibles: solicitan DNI, contraseñas o códigos que llegan a tu móvil.

Qué hacer: no compartas nada, bloquea al usuario, avisa al administrador del grupo y, si hay delito, denuncia. Tu sentido común es tu mejor filtro; si algo te raya, probablemente esté mal.`,
  },
  {
    icon: "👥",
    title: "Normas que funcionan para grupos grandes",
    tag: "Comunidad",
    excerpt:
      "Mantener 200+ personas en un grupo sin caos es posible. Repasamos las reglas de oro para grupos grandes.",
    body: `Un grupo con más de 200 personas necesita estructura. Sin ella, se convierte en ruido y la gente se va. Estas normas suelen funcionar:

- Fija un mensaje con las reglas. Que sea lo primero que vea quien entra.
- Define horarios: «de 8 a 22h» evita notificaciones a las 4 de la mañana.
- Prohíbe el spam y la autopromoción sin permiso. Es la causa número uno de abandono.
- Nombra al menos un moderador besides tú. No puedes estar pendiente 24/7.
- Usa la función de «mensaje de bienvenida» para que los nuevos se presenten.

Escribir las normas en el mensaje fijado cambia todo: reduce el trabajo de moderación y deja claro qué esperar desde el minuto uno.`,
  },
  {
    icon: "📈",
    title: "Cómo ganar miembros sin comprarlos",
    tag: "Crecimiento",
    excerpt:
      "Olvida los servicios de seguidores falsos: traen silencio, no comunidad. Hablamos de promocionar de forma honesta.",
    body: `Los servicios que venden «miembros» te dan cuentas falsas o inactivas. El número sube, pero la conversación no. Y peor: WhatsApp detecta actividad sospechosa y puede limitar o cerrar el grupo.

Formas honestas de crecer:
- Preséntate en foros y redes relacionadas con tu tema, sin spam, aportando valor.
- Intercambia con otros administradores: «yo te menciono, tú me mencionas».
- Publica tu grupo en directorios como este (¡es gratis!).
- Pide a los miembros satisfechos que inviten a alguien que crean que encajará.

La comunidad real crece despacio, pero cada miembro es una persona que de verdad participa. Esa es la diferencia entre un grupo con 500 contactos muertos y uno con 80 que se disfruta.`,
  },
  {
    icon: "🌎",
    title: "Grupos por país: por qué importa la hora local",
    tag: "Localización",
    excerpt:
      "Un grupo con gente de tres zonas horarias distintas puede ser un caos de notificaciones.",
    body: `España, México, Argentina y Colombia no comparten ni hora ni cultura digital. Un grupo «internacional» suena bien sobre el papel, pero en la práctica las notificaciones llegan a destiempo: a unos les despierta a las 6, a otros les llega cuando ya cenaron.

Por eso filtrar por país mejora la conversación: la gente coincide en horarios, comparte referencias culturales y debatís temas locales que a los demás no les importan.

¿Y si quieres un grupo internacional? Entonces conviene ser explícito: pon el huso horario de referencia en el nombre («Gamers Latam — hora base CDMX») y acuerda ventanas de actividad. Así todos saben cuándo esperar ruido y cuándo silencio.`,
  },
];
