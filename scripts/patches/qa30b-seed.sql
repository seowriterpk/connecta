-- Task 30-b QA test data (sandbox only) — queue + pending demo rows.
-- Prefix "QA30b — " so they are clearly identifiable. Uses REAL categories/countries.
USE `gruposwhatsapp`;

-- ---------------------------------------------------------------------------
-- groups_queue: 11 rows, 8 real categories, 5 countries, 2 adult
-- ---------------------------------------------------------------------------
INSERT INTO `groups_queue`
  (`groupName`, `joinLink`, `description`, `category`, `country`, `city`, `keywords`, `tags`, `profileImage`, `isAdult`, `language`, `addedAt`)
VALUES
  ('QA30b — Amistad Digital España', 'https://chat.whatsapp.com/Qa30bFAq1zKm',
   'Grupo para hacer amigos por toda España: charla diaria, buen rollo y planes de quedadas virtuales cada semana.',
   'Amistad', 'España', 'Madrid',
   '["hacer amigos","charla","espana"]', '["amistad","chat","spanish"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 9 DAY),

  ('QA30b — Devs y Tecnología ES', 'https://chat.whatsapp.com/Qa30bKd9mPxr',
   'Comunidad de programadores españoles: comparte dudas de código, ofertas de trabajo tech y noticias de inteligencia artificial.',
   'Tecnología', 'España', 'Barcelona',
   '["programacion","devs","inteligencia artificial"]', '["tech","desarrollo","ia"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 8 DAY),

  ('QA30b — Gamers Mexicanos', 'https://chat.whatsapp.com/Qa30bZw4nQ7v',
   'Gamers de México para partidas de FIFA, Free Fire y Mario Kart. Organizamos torneos internos cada fin de semana.',
   'Tecnología', 'México', 'Ciudad de México',
   '["gaming","videojuegos","torneos"]', '["gamers","fifa","freefire"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 7 DAY),

  ('QA30b — Cumbia y Salsa Medellín', 'https://chat.whatsapp.com/Qa30bLp2rT5w',
   'Amantes de la cumbia, la salsa y el reggaetón clásico en Medellín. Compartimos playlists, conciertos y eventos bailables.',
   'Música', 'Colombia', 'Medellín',
   '["cumbia","salsa","musica latina"]', '["musica","baile","colombia"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 6 DAY),

  ('QA30b — Running Buenos Aires', 'https://chat.whatsapp.com/Qa30bRn8gH2c',
   'Corredores amateur de Buenos Aires: entrenamientos en Parque 3 de Febrero, consejos de zapatillas y retos mensuales de 10 km.',
   'Deportes', 'Argentina', 'Buenos Aires',
   '["running","correr","atletismo"]', '["deporte","fitness","running"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 6 DAY - INTERVAL 3 HOUR),

  ('QA30b — Recetas Caseras de Perú', 'https://chat.whatsapp.com/Qa30bRc5sY9d',
   'Cocina peruana casera: lomo saltado, ají de gallina y postres. Comparte tus recetas step by step con fotos del resultado.',
   'Cocina', 'Perú', 'Lima',
   '["recetas","cocina peruana","postres"]', '["cocina","gastronomia","peru"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 5 DAY),

  ('QA30b — Inversores y Cripto MTY', 'https://chat.whatsapp.com/Qa30bIn3vB6f',
   'Inversores de Monterrey: análisis de mercados, criptomonedas y fondos indexados. Nada de esquemas, solo análisis serio.',
   'Negocios', 'México', 'Monterrey',
   '["inversion","cripto","finanzas"]', '["negocios","bitcoin","finanzas"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 4 DAY),

  ('QA30b — Amistades +18 Valencia', 'https://chat.whatsapp.com/Qa30bAd7lU1q',
   'Grupo para adultos en Valencia que buscan amistad y conversación con respeto. Solo mayores de 18 años, contenido exclusivo para adultos.',
   'Amistad', 'España', 'Valencia',
   '["amistad adulta","valencia","mayores de 18"]', '["18","amistad","valencia"]', NULL, 1, 'Espanol',
   NOW() - INTERVAL 3 DAY),

  ('QA30b — Cinefilos Córdoba', 'https://chat.whatsapp.com/Qa30bCi9nE4t',
   'Debate de cine y series en Córdoba: estrenos semanales, recomendaciones de directores argentinos y maratones comentadas.',
   'Cine y TV', 'Argentina', 'Córdoba',
   '["cine","series","estrenos"]', '["peliculas","cinefilos","argentina"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 2 DAY),

  ('QA30b — Humor Diario Bogotá', 'https://chat.whatsapp.com/Qa30bHu6mO3s',
   'Memes colombianos, chistes del día a día y humor sano para alegrar las mañanas de Bogotá. Prohibido el humor ofensivo.',
   'Humor', 'Colombia', 'Bogotá',
   '["memes","chistes","humor"]', '["humor","memes","colombia"]', NULL, 0, 'Espanol',
   NOW() - INTERVAL 1 DAY),

  ('QA30b — Citas y Encuentros +18 MX', 'https://chat.whatsapp.com/Qa30bCt4xW8p',
   'Personas solteras en Guadalajara buscando citas serias o casuales. Verificación de edad obligatoria, solo mayores de 18.',
   'Amistad', 'México', 'Guadalajara',
   '["citas","solteros","guadalajara"]', '["18","citas","mexico"]', NULL, 1, 'Espanol',
   NOW() - INTERVAL 12 HOUR);

-- ---------------------------------------------------------------------------
-- groups (status='pending'): 5 rows, submitSource='bulk'
-- ---------------------------------------------------------------------------
INSERT INTO `groups`
  (`id`, `groupName`, `slug`, `joinLink`, `description`, `category`, `categoryId`,
   `country`, `countryId`, `city`, `keywords`, `tags`, `profileImage`, `language`,
   `status`, `linkStatus`, `isAdult`, `submitSource`, `createdAt`)
VALUES
  ('test30bpending1', 'QA30b — Fútbol Fantasía MX', 'test-30b-pending-1',
   'https://chat.whatsapp.com/Qa30bFt1aS5j',
   'Liga de fútbol fantasía entre amigos de México: mercado de fichajes, resultados jornada a jornada y mucha broma en el chat.',
   'Deportes', 'cat-deportes', 'México', 'co-mx', 'Puebla',
   '["futbol","fantasia","liga mx"]', '["futbol","deportes","mexico"]', NULL, 'Espanol',
   'pending', 'active', 0, 'bulk', NOW() - INTERVAL 5 DAY),

  ('test30bpending2', 'QA30b — Cocina Vegana AR', 'test-30b-pending-2',
   'https://chat.whatsapp.com/Qa30bVg2nD8k',
   'Recetas veganas fáciles y baratas con ingredientes de temporada en Argentina. Comparte tus platos favoritos sin productos animales.',
   'Cocina', 'cat-cocina', 'Argentina', 'co-ar', 'Rosario',
   '["vegano","recetas","comida saludable"]', '["cocina","vegano","argentina"]', NULL, 'Espanol',
   'pending', 'active', 0, 'bulk', NOW() - INTERVAL 4 DAY),

  ('test30bpending3', 'QA30b — Estudiantes UNAM', 'test-30b-pending-3',
   'https://chat.whatsapp.com/Qa30bEs3tU7l',
   'Estudiantes de la UNAM: apuntes compartidos, avisos de becas, vida universitaria y ayuda entre compañeros de todas las carreras.',
   'Educación', 'cat-educacion', 'México', 'co-mx', 'Ciudad de México',
   '["unam","becas","apuntes"]', '["estudiantes","educacion","mexico"]', NULL, 'Espanol',
   'pending', 'active', 0, 'bulk', NOW() - INTERVAL 3 DAY),

  ('test30bpending4', 'QA30b — Mochileros de Perú', 'test-30b-pending-4',
   'https://chat.whatsapp.com/Qa30bMo4cB2r',
   'Mochileros recorriendo Perú: rutas por Cusco y Arequipa, consejos de presupuesto bajo y compañeros de viaje confiables.',
   'Viajes', 'cat-viajes', 'Perú', 'co-pe', 'Cusco',
   '["mochileros","viajar barato","peru"]', '["viajes","mochileros","cusco"]', NULL, 'Espanol',
   'pending', 'active', 0, 'bulk', NOW() - INTERVAL 2 DAY),

  ('test30bpending5', 'QA30b — Amistad Madura +18 ES', 'test-30b-pending-5',
   'https://chat.whatsapp.com/Qa30bAm5dF9n',
   'Adultos en España buscando amistades maduras y conversaciones interesantes. Solo para mayores de 18 años con verificación de edad.',
   'Amistad', 'cat-amistad', 'España', 'co-es', 'Sevilla',
   '["amistad madura","espana","adultos"]', '["18","amistad","espana"]', NULL, 'Espanol',
   'pending', 'active', 1, 'bulk', NOW() - INTERVAL 1 DAY);
