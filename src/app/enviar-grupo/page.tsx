import { permanentRedirect } from "next/navigation";

/**
 * /enviar-grupo → /agregar-grupo (308 Permanent Redirect)
 *
 * The full 7-step UGC form now lives at /agregar-grupo (per Groupizo manual
 * URL structure). This old route permanently redirects to the new canonical
 * URL to preserve SEO and inbound links.
 */
export default function EnviarGrupoPage() {
  permanentRedirect("/agregar-grupo");
}
