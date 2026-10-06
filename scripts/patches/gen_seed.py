#!/usr/bin/env python3
"""
ConectaGrupos — fresh seed for the restored MariaDB instance.

Recreates the original dataset (20 Spanish-speaking countries incl. España,
20 clean categories, 30 clean demo groups, 6 uploaders) plus directive
requirements:
  - "Digital Accounts Buy & Sell" group with & → "and" slug convention.
  - 2 adult categories + 6 adult groups to exercise the 18+ separation.
Output: SQL to stdout (executed by seed.sh via the mariadb client).
"""
import json

def q(s):  # SQL escape
    return "'" + s.replace("\\", "\\\\").replace("'", "''") + "'"

out = []
out.append("SET NAMES utf8mb4;")
out.append("USE `gruposwhatsapp`;")
out.append("START TRANSACTION;")

# ---------- Countries (España FIRST — integrity directive) ----------
countries = [
    # id, name, slug, code, flag, region, dialCode
    ("co-es",  "España",               "espana",               "es", "🇪🇸", "Europa",       "+34"),
    ("co-mx",  "México",               "mexico",               "mx", "🇲🇽", "Norteamérica", "+52"),
    ("co-ar",  "Argentina",            "argentina",            "ar", "🇦🇷", "Sudamérica",   "+54"),
    ("co-co",  "Colombia",             "colombia",             "co", "🇨🇴", "Sudamérica",   "+57"),
    ("co-pe",  "Perú",                 "peru",                 "pe", "🇵🇪", "Sudamérica",   "+51"),
    ("co-cl",  "Chile",                "chile",                "cl", "🇨🇱", "Sudamérica",   "+56"),
    ("co-ve",  "Venezuela",            "venezuela",            "ve", "🇻🇪", "Sudamérica",   "+58"),
    ("co-ec",  "Ecuador",              "ecuador",              "ec", "🇪🇨", "Sudamérica",   "+593"),
    ("co-gt",  "Guatemala",            "guatemala",            "gt", "🇬🇹", "Centroamérica","+502"),
    ("co-cu",  "Cuba",                 "cuba",                 "cu", "🇨🇺", "Caribe",       "+53"),
    ("co-bo",  "Bolivia",              "bolivia",              "bo", "🇧🇴", "Sudamérica",   "+591"),
    ("co-do",  "República Dominicana", "republica-dominicana", "do", "🇩🇴", "Caribe",       "+1"),
    ("co-hn",  "Honduras",             "honduras",             "hn", "🇭🇳", "Centroamérica","+504"),
    ("co-py",  "Paraguay",             "paraguay",             "py", "🇵🇾", "Sudamérica",   "+595"),
    ("co-sv",  "El Salvador",          "el-salvador",          "sv", "🇸🇻", "Centroamérica","+503"),
    ("co-ni",  "Nicaragua",            "nicaragua",            "ni", "🇳🇮", "Centroamérica","+505"),
    ("co-cr",  "Costa Rica",           "costa-rica",           "cr", "🇨🇷", "Centroamérica","+506"),
    ("co-pa",  "Panamá",               "panama",               "pa", "🇵🇦", "Centroamérica","+507"),
    ("co-uy",  "Uruguay",              "uruguay",              "uy", "🇺🇾", "Sudamérica",   "+598"),
    ("co-pr",  "Puerto Rico",          "puerto-rico",          "pr", "🇵🇷", "Caribe",       "+1"),
]
for cid, name, slug, code, flag, region, dial in countries:
    out.append(
        f"INSERT INTO `countries` (`id`,`name`,`slug`,`code`,`flag`,`region`,`dialCode`,`isActive`) "
        f"VALUES ({q(cid)},{q(name)},{q(slug)},{q(code)},{q(flag)},{q(region)},{q(dial)},1) "
        f"ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`slug`=VALUES(`slug`),`flag`=VALUES(`flag`),`region`=VALUES(`region`);"
    )

# ---------- Categories ----------
cats = [
    # id, name, slug, description, icon, color, sortOrder, isAdult
    ("cat-amistad",  "Amistad",          "amistad",         "Grupos para hacer amigos, charlar y conocer gente con tus mismos intereses.", "🤝", "emerald", 100, 0),
    ("cat-tecnologia","Tecnología",      "tecnologia",      "Comunidades sobre programación, gadgets, IA y todo lo tech en español.",      "💻", "sky",     110, 0),
    ("cat-musica",   "Música",           "musica",          "Grupos de música urbana, rock, pop y todos los géneros en español.",          "🎵", "violet",  120, 0),
    ("cat-deportes", "Deportes",         "deportes",        "Fútbol, básquet, running y más deportes con fanáticos hispanohablantes.",      "⚽", "lime",    130, 0),
    ("cat-humor",    "Humor",            "humor",           "Memes, chistes y humor diario para alegrar tu día.",                          "😂", "yellow",  140, 0),
    ("cat-cine",     "Cine y TV",        "cine",            "Series, películas, estrenos y debates cinéfilos sin spoilers (bueno, casi).",  "🎬", "rose",    150, 0),
    ("cat-cocina",   "Cocina",           "cocina",          "Recetas caseras, repostería y trucos de cocina compartidos por la comunidad.", "🍳", "orange",  160, 0),
    ("cat-educacion","Educación",        "educacion",       "Estudiantes, becas, apuntes y ayuda académica en español.",                    "📚", "teal",    170, 0),
    ("cat-mascotas", "Mascotas",         "mascotas",        "Amantes de perros, gatos y todas las mascotas: consejos, fotos y adopción.",   "🐶", "amber",   180, 0),
    ("cat-viajes",   "Viajes",           "viajes",          "Mochileros, rutas, turismo local y consejos para viajar barato.",              "✈️", "cyan",    190, 0),
    ("cat-negocios", "Negocios",         "negocios",        "Emprendedores, freelancers y negocios: ideas, ventas y networking.",          "💼", "green",   200, 0),
    ("cat-compraventa","Compra y Venta", "compraventa",     "Compra, venta e intercambio de segunda mano en tu ciudad.",                    "🛒", "stone",   210, 0),
    ("cat-idiomas",  "Idiomas",          "idiomas",         "Practica inglés y otros idiomas con nativos e hispanohablantes.",              "🗣️", "sky",     220, 0),
    ("cat-arte",     "Arte y Diseño",    "arte",            "Ilustradores, fotógrafos y artistas compartiendo portafolios y feedback.",    "🎨", "fuchsia", 230, 0),
    ("cat-empleo",   "Empleo",           "empleo",          "Ofertas de trabajo, empleo remoto y consejos para entrevistas.",              "💼", "slate",   240, 0),
    ("cat-noticias", "Noticias",         "noticias",        "Actualidad y debate de actualidad en países hispanohablantes.",               "📰", "stone",   250, 0),
    ("cat-religion", "Fe y Reflexión",   "religion",        "Comunidades espirituales, fe y reflexión diaria.",                            "🙏", "violet",  260, 0),
    ("cat-salud",    "Salud y Bienestar","salud",           "Fitness, nutrición, salud mental y hábitos saludables.",                      "💪", "emerald", 270, 0),
    ("cat-videojuegos","Videojuegos",    "videojuegos",     "Gamers de PC, consola y móvil: squads, partidas y torneos.",                  "🎮", "purple",  280, 0),
    ("cat-entretenimiento","Entretenimiento","entretenimiento","Variedad, juegos, retos y entretenimiento para pasar el rato.",            "🎉", "pink",    290, 0),
    # Adult silo (isAdult = 1)
    ("cat-citas-18", "Citas y Encuentros 18+", "citas-18", "Contenido para adultos: citas, encuentros y amistad 18+. Solo con el modo 18+ activado.", "💋", "rose", 900, 1),
    ("cat-exclusivo-18", "Contenido Exclusivo 18+", "contenido-exclusivo-18", "Grupos con contenido para adultos (+18). Separados del directorio general.", "🔥", "red", 910, 1),
]
for cid, name, slug, desc, icon, color, sort, adult in cats:
    out.append(
        f"INSERT INTO `categories` (`id`,`name`,`slug`,`description`,`icon`,`color`,`isAdult`,`isActive`,`sortOrder`,`source`) "
        f"VALUES ({q(cid)},{q(name)},{q(slug)},{q(desc)},{q(icon)},{q(color)},{adult},1,{sort},'seed') "
        f"ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`description`=VALUES(`description`),`isAdult`=VALUES(`isAdult`);"
    )

# ---------- Uploaders (autores) ----------
uploaders = [
    ("up-lucia",   "Lucía Martínez",   "lucia-martinez",   "Curadora de comunidades",  "Especialista en encontrar las comunidades más activas de España y Latinoamérica."),
    ("up-carlos",  "Carlos Ramírez",   "carlos-ramirez",   "Cazador de grupos tech",   "Programador y fan de la tecnología. Verifica cada enlace antes de publicarlo."),
    ("up-maria",   "María González",   "maria-gonzalez",   "Curadora de cultura",       "Amante del cine, la música y los libros. Curiosa por naturaleza."),
    ("up-diego",   "Diego Hernández",  "diego-hernandez",  "Explorador de comunidades", "Recorre los directorios de WhatsApp de toda Latinoamérica."),
    ("up-ana",     "Ana Torres",       "ana-torres",       "Curadora de bienestar",     "Enfermera y coach de hábitos. Comparte grupos de salud y bienestar."),
    ("up-luis",    "Luis Caminos",     "luis-caminos",     "Guía de viajeros",          "Mochilero empedernido. Conoce cada ruta de España a Patagonia."),
]
for uid, name, slug, job, desc in uploaders:
    out.append(
        f"INSERT INTO `uploaders` (`id`,`name`,`slug`,`jobTitle`,`description`) "
        f"VALUES ({q(uid)},{q(name)},{q(slug)},{q(job)},{q(desc)}) "
        f"ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);"
    )

# ---------- Groups ----------
# (name, catId, coId, city, desc, tags, clicks, views, uploader)
groups = [
    ("Digital Accounts Buy & Sell", "cat-compraventa", "co-mx", "Ciudad de México",
     "Grupo para comprar y vender cuentas digitales: juegos, streaming y suscripciones. Reglas claras, vendedores verificados y trade seguro entre miembros.",
     '["cuentas","compraventa","digital"]', 320, 950, "up-carlos"),
    ("Memes diario para empezar el día riendo", "cat-humor", "co-mx", "Ciudad de México",
     "El mejor humor para despertar con una sonrisa. Memes frescos cada mañana, sin odio y sin spam.",
     '["memes","humor","risa"]', 240, 800, "up-lucia"),
    ("Amigos del café: mañanas sin prisa", "cat-amistad", "co-es", "Madrid",
     "Charlas tranquilas para amantes del café. Compartimos recetas, cafeterías favoritas y mañanas de conversación.",
     '["cafe","amistad","charlar"]', 180, 520, "up-lucia"),
    ("Chistes y más: humor para todos", "cat-humor", "co-ar", "Buenos Aires",
     "Comunidad de humor en español. Chistes, ocurrencias y juegos de palabras para compartir con amigos.",
     '["chistes","humor"]', 150, 610, "up-diego"),
    ("Música urbana: reggaetón y trap", "cat-musica", "co-pr", None,
     "Los últimos lanzamientos de reggaetón, trap latino y música urbana. Comparte tus temas favoritos.",
     '["reggaeton","trap","musica"]', 280, 890, "up-maria"),
    ("Solteros 30+ Argentina: charlas reales", "cat-amistad", "co-ar", "Buenos Aires",
     "Comunidad para solteros y solteras de más de 30 años. Charlas sinceras, amistad y planes para conocerse.",
     '["solteros","amistad","charlas"]', 200, 700, "up-diego"),
    ("Fe y reflexión: comunidad espiritual", "cat-religion", "co-mx", None,
     "Espacio de respeto para compartir la fe, reflexiones diarias y apoyo mutuo. Todos los credos son bienvenidos.",
     '["fe","reflexion","espiritual"]', 130, 480, "up-maria"),
    ("Empleos remoto: trabajo desde casa", "cat-empleo", "co-co", "Bogotá",
     "Ofertas de empleo 100% remoto verificadas para Latinoamérica. Sin estafas, sin pagos por adelantado.",
     '["empleo","remoto","trabajo"]', 350, 1200, "up-carlos"),
    ("Cocina casera Venezuela: recetas de la abuela", "cat-cocina", "co-ve", "Caracas",
     "Las recetas tradicionales venezolanas que aprendimos de nuestras abuelas. Arepas, hallacas y más.",
     '["recetas","cocina","venezuela"]', 210, 640, "up-lucia"),
    ("Amantes de los perros: consejos y fotos", "cat-mascotas", "co-es", "Madrid",
     "Comunidad para amantes caninos: consejos de cuidado, fotos adorables y adopción responsable.",
     '["perros","mascotas","adopcion"]', 170, 590, "up-ana"),
    ("Fútbol Ecuador: clásicos y polémicas", "cat-deportes", "co-ec", "Quito",
     "Debate futbolero ecuatoriano: clásicos, polémicas arbitrales y la tricolor. Respeto ante todo.",
     '["futbol","ecuador","deportes"]', 260, 910, "up-diego"),
    ("Becas España 2026: info y experiencia", "cat-educacion", "co-es", "Madrid",
     "Información actualizada sobre becas en España: requisitos, plazos y experiencias de quienes ya las consiguieron.",
     '["becas","educacion","espana"]', 190, 560, "up-lucia"),
    ("Gatos y más: el reinado felino", "cat-mascotas", "co-ar", None,
     "El grupo definitivo para gatoverso: fotos, memes felinos y consejos de cuidado de gatos.",
     '["gatos","mascotas"]', 140, 500, "up-ana"),
    ("Practica inglés: intercambio hispano-anglo", "cat-idiomas", "co-cr", "San José",
     "Intercambio de idiomas español-inglés. Nativos de ambos idiomas practicando juntos cada semana.",
     '["ingles","idiomas","intercambio"]', 230, 720, "up-carlos"),
    ("México lindo: haz amigos CDMX", "cat-amistad", "co-mx", "Ciudad de México",
     "Chilangos y chilangas haciendo amigos: planes, antros culturales, café y convivio.",
     '["amigos","cdmx","mexico"]', 310, 860, "up-diego"),
    ("Cine clásico: de Hitchcock a Almodóvar", "cat-cine", "co-es", None,
     "Cinefilia en estado puro: clásicos, joyas ocultas y cine español. Recomendaciones semanales.",
     '["cine","peliculas","clasicos"]', 120, 430, "up-maria"),
    ("Series y Netflix: sin spoilers (bueno, un poco)", "cat-cine", "co-co", "Bogotá",
     "Debate semanal de series: estrenos, finales y teorías. Zona de spoilers marcada.",
     '["series","netflix","tv"]', 250, 830, "up-maria"),
    ("Estudiantes UNAM: apuntes y dudas", "cat-educacion", "co-mx", "Ciudad de México",
     "Comunidad universitaria: apuntes, dudas de examen y vida estudiantil. Puma power.",
     '["unam","estudiantes","apuntes"]', 160, 540, "up-carlos"),
    ("Programadores LATAM: juniors y seniors", "cat-tecnologia", "co-ar", "Buenos Aires",
     "Comunidad dev de Latinoamérica: código, ofertas tech y ayuda entre pares. Todos los niveles.",
     '["programacion","devs","tecnologia"]', 340, 1150, "up-carlos"),
    ("Gadgets y reviews: ¿vale la pena?", "cat-tecnologia", "co-es", "Madrid",
     "Análisis honestos de móviles, auriculares y gadgets antes de comprar. Sin patrocinios ocultos.",
     '["gadgets","reviews","tech"]', 220, 680, "up-carlos"),
    ("Emprendedores Perú: de idea a venta", "cat-negocios", "co-pe", "Lima",
     "Emprendedores peruanos compartiendo experiencias: validación, ventas y crecimiento.",
     '["emprendimiento","negocios","peru"]', 290, 900, "up-carlos"),
    ("Finanzas personales Colombia: ahorra de verdad", "cat-negocios", "co-co", "Bogotá",
     "Educación financiera práctica: presupuestos, inversión indexada y salir de deudas.",
     '["finanzas","ahorro","inversion"]', 240, 780, "up-ana"),
    ("Running Chile: corremos juntos", "cat-deportes", "co-cl", "Santiago",
     "Corredores chilenos de todos los niveles: rutas, entrenamientos y carreras 10k/21k/42k.",
     '["running","deporte","chile"]', 200, 650, "up-ana"),
    ("Repostería sin horno: dulces fáciles", "cat-cocina", "co-bo", "La Paz",
     "Dulces deliciosos sin horno: ideal para principiantes y para compartir en familia.",
     '["reposteria","dulces","recetas"]', 150, 470, "up-lucia"),
    ("Rock en español: de Soda Stereo a hoy", "cat-musica", "co-uy", "Montevideo",
     "Historia y actualidad del rock en español: Soda Stereo, Caifanes, Zoé y nuevas bandas.",
     '["rock","musica","espanol"]', 170, 520, "up-maria"),
    ("Noticias Cuba: actualidad y debate", "cat-noticias", "co-cu", "La Habana",
     "Información y debate respetuoso sobre la actualidad en Cuba y el mundo.",
     '["noticias","cuba","actualidad"]', 180, 620, "up-diego"),
    ("Compra-venta CDMX: segunda mano honesta", "cat-compraventa", "co-mx", "Ciudad de México",
     "Marketplace local: muebles, electrónica y más. Encuentros en lugares públicos siempre.",
     '["compraventa","segunda-mano","cdmx"]', 260, 810, "up-diego"),
    ("Mercado Libre Bolivia: ofertas y trueque", "cat-compraventa", "co-bo", "La Paz",
     "Ofertas, trueques y consejos de compra en Bolivia. Comunidad de compradores astutos.",
     '["ofertas","trueque","bolivia"]', 190, 560, "up-diego"),
    ("Viajeros España: rutas y mochileros", "cat-viajes", "co-es", "Madrid",
     "Rutas por España: Camino de Santiago, pueblos con encanto y consejos mochilero.",
     '["viajes","rutas","espana"]', 210, 640, "up-luis"),
    ("Turismo Honduras: descubre lo local", "cat-viajes", "co-hn", None,
     "Playas de Tela, Copán y toda la belleza hondureña. Consejos de viajeros locales.",
     '["turismo","honduras","playas"]', 130, 430, "up-luis"),
    ("Gamers LATAM: squad y partidas", "cat-videojuegos", "co-ni", None,
     "Squad multicultural para Valorant, Fortnite y LoL. Torneos internos semanales.",
     '["gaming","squad","esports"]', 300, 940, "up-carlos"),
    ("Ilustradores LATAM: portafolios y feedback", "cat-arte", "co-ve", None,
     "Artistas visuales compartiendo portafolios, comisiones y feedback constructivo.",
     '["ilustracion","arte","portafolio"]', 160, 500, "up-maria"),
]

# Adult groups (isAdult = 1) — only visible with the 18+ toggle
adult_groups = [
    ("Solteras y solteros 18+: conoce gente", "cat-citas-18", "co-mx", "Ciudad de México",
     "Grupo para adultos (+18) que buscan conocer gente nueva con respeto. Solo mayores de edad; se exige verificación al entrar.",
     '["citas","18","conocer-gente"]', 280, 900, "up-lucia"),
    ("Amistades con derecho 18+ LATAM", "cat-citas-18", "co-co", "Bogotá",
     "Comunidad adulta para citas casuales y encuentros en Latinoamérica. Reglas estrictas de consentimiento y respeto.",
     '["citas","latam","18"]', 210, 700, "up-diego"),
    ("Chicas chismecitas 18+", "cat-citas-18", "co-es", "Madrid",
     "Grupo de amigas +18 para chismes, consejería amorosa y girls talk. Solo para mujeres adultas.",
     '["amigas","18","chismes"]', 190, 610, "up-lucia"),
    ("Contenido hot: packs y debates 18+", "cat-exclusivo-18", "co-ar", "Buenos Aires",
     "Espacio adulto (+18) de contenido exclusivo y debates abiertos. Prohibida la entrada a menores de edad.",
     '["18","contenido","exclusivo"]', 250, 820, None),
    ("After dark 18+: charlas sin filtro", "cat-exclusivo-18", "co-cl", "Santiago",
     "Charlas adultas sin filtro para mayores de edad. Temática +18, respeto siempre obligatorio.",
     '["18","charlas","afterdark"]', 170, 540, None),
    ("Citas rápidas 18+ España", "cat-citas-18", "co-es", "Madrid",
     "Citas rápidas virtuales para adultos en España. Eventos semanales por edades y ciudades.",
     '["citas","espana","18"]', 230, 730, None),
]

def slugify(name):
    import unicodedata
    s = unicodedata.normalize("NFD", name)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = s.replace("&", "and")
    s = s.replace("+", "plus")
    s = s.replace("ñ", "n")
    import re
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "grupo"

def add_group(gid, name, cat_id, co_id, city, desc, tags, clicks, views, uploader, is_adult):
    slug = slugify(name)
    kw = json.dumps([w for w in name.lower().replace("&", " ").split() if len(w) > 3][:4], ensure_ascii=False)
    cat_row = next(c for c in cats if c[0] == cat_id)
    co_row = next(c for c in countries if c[0] == co_id)
    cat_name, co_name = cat_row[1], co_row[1]
    up = f"{q(uploader)}" if uploader else "NULL"
    city_v = f"{q(city)}" if city else "NULL"
    members = round(clicks * 0.7)
    badge = "'featured'" if clicks >= 300 else "NULL"
    out.append(
        f"INSERT INTO `groups` (`id`,`groupName`,`slug`,`joinLink`,`description`,`category`,`categoryId`,"
        f"`country`,`countryId`,`city`,`keywords`,`tags`,`profileImage`,`language`,`status`,`linkStatus`,"
        f"`isAdult`,`submitSource`,`clicks`,`joinCount`,`views`,`shares`,`uploaderId`,`popularityBadge`,`lastActiveAt`) VALUES ("
        f"{q(gid)},{q(name)},{q(slug)},{q('https://chat.whatsapp.com/Demo' + gid[-4:])},{q(desc)},"
        f"{q(cat_name)},{q(cat_id)},{q(co_name)},{q(co_id)},{city_v},{q(kw)},{q(tags)},NULL,'Espanol','live','active',"
        f"{1 if is_adult else 0},'seed',{clicks},{members},{views},{round(views/8)},{up},{badge},NOW()) "
        f"ON DUPLICATE KEY UPDATE `groupName`=VALUES(`groupName`),`isAdult`=VALUES(`isAdult`);"
    )

for i, g in enumerate(groups, 1):
    add_group(f"g-demo-{i:03d}", *g, is_adult=False)
for i, g in enumerate(adult_groups, 1):
    add_group(f"g-adult-{i:03d}", *g, is_adult=True)

out.append("COMMIT;")
print("\n".join(out))
