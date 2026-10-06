import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "¿Qué es ConectaGrupos y para qué sirve?",
    a: "ConectaGrupos es un directorio en español que reúne enlaces de invitación a grupos de WhatsApp, organizizados por categoría y país. La idea es simple: que encuentres rápidamente comunidades activas según tus intereses —ya sea para estudiar, practicar un idioma, hacer amigos o seguir a tu equipo— sin tener que navegar foros desordenados. También puedes publicar tu propio grupo y darle visibilidad entre miles de hispanohablantes.",
  },
  {
    q: "¿Unirse a un grupo de WhatsApp es gratis?",
    a: "Sí, totalmente. WhatsApp no cobra por unirse a grupos y ConectaGrupos tampoco te pide pagar nada. Si algún administrador te exige dinero a cambio de acceso, escríbenos: ese tipo de prácticas no tienen cabida en nuestra comunidad y retiramos el enlace en cuanto lo detectamos.",
  },
  {
    q: "¿Cómo publico mi propio grupo de WhatsApp?",
    a: "Pulsa el botón «Enviar un grupo», rellena el formulario con el nombre, una descripción clara, el enlace de invitación (chat.whatsapp.com o wa.me), la categoría y el país, y envíalo. Tu propuesta queda en estado pendiente mientras la revisamos para confirmar que cumple nuestras normas básicas de convivencia. Si todo encaja, se publica en cuestión de horas.",
  },
  {
    q: "¿Por qué mi grupo aparece como «pendiente»?",
    a: "Para mantener la calidad del directorio, todos los envíos pasan por una revisión breve. Comprobamos que el enlace funcione, que la descripción sea útil y que el contenido respete las reglas de la comunidad (sin spam, sin contenido para adultos, sin estafas). Mientras dure la revisión el grupo no es visible públicamente; en cuanto se aprueba, aparece en su categoría y país.",
  },
  {
    q: "¿Los grupos son seguros? ¿Qué precauciones debo tomar?",
    a: "Moderamos lo que publicamos, pero ningún directorio puede garantizar al 100% lo que ocurre dentro de cada grupo. Te recomendamos no compartir datos sensibles (DNI, direcciones, contraseñas), desconfiar de ofertas demasiado buenas para ser ciertas y abandonar cualquier grupo donde se promueva estafas o violencia. WhatsApp permite salir de un grupo con un par de toques: úsalo sin dudar.",
  },
  {
    q: "¿Puedo reportar un grupo que incumple las normas?",
    a: "Por supuesto. Si ves un grupo con contenido inapropiado, enlace roto o que vulnera nuestras reglas, escríbenos a la dirección de contacto indicada en el pie de página indicando el enlace. Actuamos con rapidez: nuestra prioridad es que el directorio siga siendo un lugar útil y seguro para todos los hispanohablantes.",
  },
  {
    q: "¿En qué países están disponibles los grupos?",
    a: "Cubrimos los principales países de habla hispana: España, México, Argentina, Colombia, Perú, Chile, Venezuela, Ecuador, Guatemala, Cuba, Bolivia, República Dominicana, Honduras, Paraguay, El Salvador, Nicaragua, Costa Rica, Panamá, Uruguay y Puerto Rico. Puedes filtrar por país o por región (Sudamérica, Centroamérica, Caribe y Europa) desde la sección de países.",
  },
  {
    q: "¿Puedo editar o eliminar un grupo que envié?",
    a: "Sí. Si eres el autor o administrador de un grupo publicado y quieres modificar su descripción, actualizar el enlace o retirarlo del directorio, escríbenos desde el mismo correo o número con el que lo enviaste y lo gestionamos lo antes posible. Tu privacidad y el control sobre tu comunidad son prioritarios para nosotros.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Preguntas frecuentes
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Resolvemos las dudas más habituales sobre cómo funcionan los grupos de WhatsApp y
            este directorio. ¿No encuentras tu respuesta? Escríbenos desde el pie de página.
          </p>

          <Accordion type="single" collapsible className="mt-6 w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
