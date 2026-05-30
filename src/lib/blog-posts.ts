export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: string;
  intro: string;
  sections: { heading: string; body: string }[];
  cta: { text: string; href: string };
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-elegir-dj-para-boda-zacatecas",
    title: "Cómo elegir el DJ perfecto para tu boda en Zacatecas",
    description: "Guía completa para elegir el DJ ideal para tu boda en Zacatecas. Qué preguntar, qué incluye un buen paquete y cómo evitar sorpresas el día del evento.",
    date: "2026-05-15",
    readTime: 6,
    category: "Bodas",
    intro: "Elegir el DJ para tu boda es una de las decisiones más importantes del evento. La música marca el ritmo de toda la noche — desde la entrada de los novios hasta el último baile. En Zacatecas, hay varios aspectos específicos que debes considerar.",
    sections: [
      {
        heading: "1. Experiencia en bodas vs. eventos generales",
        body: "No todos los DJs son iguales. Un DJ de bodas debe conocer el protocolo: entrada de novios, vals, hora loca, torta y despedida. Pide referencias específicas de bodas anteriores, no solo eventos de antro o quinceañeras. Un DJ experimentado en bodas sabe manejar los tiempos y transiciones sin cortar el ambiente.",
      },
      {
        heading: "2. Equipo de sonido e iluminación",
        body: "El sonido para una boda en Zacatecas debe adaptarse al espacio. Haciendas y salones tienen acústicas muy diferentes a espacios al aire libre en el altiplano (viento, temperatura). Verifica que el proveedor tenga equipo profesional (procesadores de audio, monitores, luces LED), no solo bocinas domésticas. Un paquete completo debe incluir instalación, prueba de sonido y servicio durante todo el evento.",
      },
      {
        heading: "3. Repertorio y personalización",
        body: "La música de tu boda debe contar tu historia. Un buen DJ te pedirá una lista de canciones especiales, géneros favoritos y canciones prohibidas. En Zacatecas el regional mexicano es imprescindible, pero asegúrate de que también maneje pop, electrónico y salsa para los diferentes momentos de la noche.",
      },
      {
        heading: "4. Qué preguntar antes de contratar",
        body: "¿Tienen backup de equipo en caso de falla? ¿El DJ trabaja solo o tiene asistente? ¿El precio incluye traslado a tu venue? ¿Qué pasa si el DJ se enferma? ¿Tienen contrato formal con penalidades? Estas preguntas te salvarán de sorpresas el día de tu boda.",
      },
      {
        heading: "5. El depósito y la reserva",
        body: "Un DJ serio te pedirá un depósito para apartar la fecha. En Daysu.vip manejamos un depósito del 30% que garantiza tu fecha y te da 48 horas para confirmar. El 70% restante se paga el día del evento. Desconfía de quien no pide depósito — significa que puede cancelarte por una oferta mejor.",
      },
    ],
    cta: { text: "Ver paquetes para bodas", href: "/servicios/bodas-zacatecas" },
  },
  {
    slug: "guia-xv-anos-zacatecas",
    title: "Guía completa para planear XV Años en Zacatecas",
    description: "Todo lo que necesitas saber para organizar una quinceañera memorable en Zacatecas: venue, música, shows, presupuesto y errores a evitar.",
    date: "2026-04-20",
    readTime: 8,
    category: "XV Años",
    intro: "Los XV Años son el evento más importante en la vida de muchas familias mexicanas. En Zacatecas, la tradición combina la elegancia colonial con la calidez norteña. Esta guía te ayudará a planear cada detalle.",
    sections: [
      {
        heading: "Presupuesto: el primer paso",
        body: "Antes de ver venues o cotizar, define un presupuesto total. En Zacatecas, una quinceañera digna para 200 personas comienza desde $80,000 MXN y puede llegar a $300,000+. Divide el presupuesto: 30% venue, 25% música y shows, 20% catering, 15% decoración, 10% otros (invitaciones, pastel, etc.).",
      },
      {
        heading: "Venues en Zacatecas: opciones para todos los presupuestos",
        body: "Zacatecas y Guadalupe tienen desde haciendas coloniales hasta salones modernos. Para outdoor, considera el clima: los meses de mayo a octubre tienen lluvias vespertinas. Los mejores meses para XV al aire libre son febrero-abril y noviembre. Venues populares: haciendas en Guadalupe, jardines en la zona conurbada, salones de eventos en el centro.",
      },
      {
        heading: "Música y entretenimiento: más allá del DJ",
        body: "Una quinceañera memorable necesita más que un DJ. Considera: DJ con equipo profesional para toda la noche, show de robot LED para la hora loca, cabezones personalizados con la foto de la quinceañera, vals en las nubes con máquina de humo, pirotecnia para la entrada. Daysu.vip ofrece paquetes todo incluido que combinan todos estos elementos.",
      },
      {
        heading: "Los errores más comunes y cómo evitarlos",
        body: "1) No apartar la fecha con anticipación — los venues y DJs buenos se agotan con meses de anticipación. 2) No hacer prueba de sonido — llega temprano el día del evento. 3) No tener backup para lluvia si es outdoor. 4) Olvidar el contrato formal con el proveedor de entretenimiento. 5) Contratar al más barato sin verificar referencias.",
      },
      {
        heading: "Checklist de 6 meses antes",
        body: "6 meses antes: venue y fecha. 4 meses: DJ, música, decoración, catering. 3 meses: invitaciones, vestido, chambelanes. 2 meses: prueba de vals, confirmar proveedores. 1 mes: lista definitiva de invitados. 2 semanas: prueba de sonido, coordinar logística. Día del evento: llegar 2 horas antes para supervisar instalación.",
      },
    ],
    cta: { text: "Ver paquetes para XV Años", href: "/servicios/xv-anos-zacatecas" },
  },
  {
    slug: "show-robot-led-eventos-zacatecas",
    title: "Show Robot LED: el espectáculo que revoluciona los eventos en Zacatecas",
    description: "Descubre qué es el show de robot LED, cómo funciona y por qué se ha convertido en el elemento más solicitado en bodas y quinceañeras en Zacatecas.",
    date: "2026-03-10",
    readTime: 4,
    category: "Shows",
    intro: "Si has visto videos de fiestas donde un impresionante robot LED aparece con bebidas o sorpresas para los invitados, has visto el show que más está revolucionando los eventos en México. En Zacatecas, Daysu.vip es pionero en este espectáculo.",
    sections: [
      {
        heading: "¿Qué es exactamente el show de robot LED?",
        body: "Es un traje de robot de más de 2 metros de altura completamente cubierto de luces LED multicolor, con pantallas integradas y efectos de humo. El performer dentro del traje baila, interactúa con los invitados y puede llevar bebidas, pasteles o sorpresas. El impacto visual es impresionante — es el momento del evento del que todos hablarán.",
      },
      {
        heading: "¿En qué momentos del evento funciona mejor?",
        body: "La entrada de novios o de la quinceañera con el robot LED genera un impacto brutal. También funciona perfecto para: la hora loca (el momento de más energía), presentación del pastel, primera hora de baile, o como sorpresa programada a media noche. El tiempo de show varía de 30 a 90 minutos según el paquete.",
      },
      {
        heading: "Logística y requisitos del venue",
        body: "El robot mide aproximadamente 2.2 metros de altura. Necesita un espacio de al menos 3×3 metros para moverse. Requiere acceso normal (puerta estándar no funciona — necesita entrada amplia). Funciona en interiores y exteriores cubiertos. El equipo de Daysu.vip llega 1 hora antes para preparar el traje y sincronizar con el DJ.",
      },
      {
        heading: "¿Cuánto cuesta y cómo incluirlo en mi paquete?",
        body: "El show de robot LED en Daysu.vip está disponible como servicio individual o como parte de paquetes combinados. Al combinarlo con DJ y equipo de sonido, el precio por paquete es significativamente menor que contratar todo por separado. Consulta disponibilidad para tu fecha en nuestro catálogo.",
      },
    ],
    cta: { text: "Ver show Robot LED", href: "/servicios/show-robot-led-zacatecas" },
  },
  {
    slug: "checklist-evento-zacatecas",
    title: "Checklist definitivo para planear tu evento en Zacatecas",
    description: "Lista de verificación completa para no olvidar nada al organizar una boda, quinceañera o fiesta en Zacatecas. Descárgala y úsala como guía.",
    date: "2026-02-14",
    readTime: 5,
    category: "Consejos",
    intro: "Organizar un evento puede ser abrumador. Hemos compilado el checklist que usamos internamente en Daysu.vip después de cientos de eventos en Zacatecas y Guadalupe.",
    sections: [
      {
        heading: "6+ meses antes",
        body: "✓ Define el presupuesto total. ✓ Establece el número aproximado de invitados. ✓ Elige y aparta el venue con contrato. ✓ Aparta al DJ / empresa de entretenimiento (con contrato y depósito). ✓ Si es boda: aparta fotografía y video. ✓ Abre cuenta de ahorro exclusiva para el evento.",
      },
      {
        heading: "3-4 meses antes",
        body: "✓ Diseña y envía invitaciones (digitales: 2 meses antes; físicas: 3 meses). ✓ Contrata catering y define menú. ✓ Contrata decoración. ✓ Confirma paquete de entretenimiento con lista de canciones especiales. ✓ Verifica requisitos del venue (horario máximo, restricciones de ruido, parking). ✓ Tramita cualquier permiso especial (pirotecnia, etc.).",
      },
      {
        heading: "1-2 meses antes",
        body: "✓ Confirma lista definitiva de invitados. ✓ Coordina transporte / valet parking. ✓ Confirma todos los proveedores por escrito. ✓ Prepara plan B para lluvia (si es outdoor). ✓ Agenda prueba de sonido con el DJ. ✓ Prepara lista de canciones prohibidas y especiales.",
      },
      {
        heading: "1 semana antes",
        body: "✓ Llama a TODOS los proveedores para confirmar asistencia y hora de llegada. ✓ Prepara sobres con pagos en efectivo (propinas, saldo). ✓ Designa un coordinador de día (familiar de confianza). ✓ Comparte el timeline del evento con todos los proveedores. ✓ Carga tu teléfono esa noche — lo necesitarás.",
      },
      {
        heading: "Día del evento",
        body: "✓ Llega al venue 2 horas antes del inicio. ✓ Verifica que el DJ está instalando y haciendo prueba de sonido. ✓ Revisa disposición de mesas y decoración. ✓ Confirma con catering la hora de servicio. ✓ Ten a la mano los teléfonos de todos los proveedores. ✓ Delega — disfruta tu evento.",
      },
    ],
    cta: { text: "Cotizar mi evento ahora", href: "/reservar" },
  },
  {
    slug: "cabina-fotos-fiestas-zacatecas",
    title: "Cabina de fotos para fiestas: diversión garantizada en Zacatecas",
    description: "¿Por qué agregar una cabina fotográfica a tu fiesta en Zacatecas? Beneficios, tipos, costos y cómo hacer que sea el hit de tu evento.",
    date: "2026-01-28",
    readTime: 4,
    category: "Entretenimiento",
    intro: "Las cabinas de fotos dejaron de ser una novedad para convertirse en un elemento indispensable en bodas, quinceañeras y eventos corporativos. En Zacatecas, son uno de los servicios más solicitados por una razón: funcionan.",
    sections: [
      {
        heading: "¿Por qué una cabina fotográfica transforma tu evento?",
        body: "La cabina mantiene entretenidos a los invitados durante los tiempos muertos (espera del banquete, cambio de mesa, etc.). Genera recuerdos tangibles que los invitados se llevan a casa. Crea contenido para redes sociales de forma natural. Es entretenimiento inclusivo — desde niños hasta abuelos participan.",
      },
      {
        heading: "Tipos de cabinas disponibles en Daysu.vip",
        body: "Cabina inflable LED: estructura inflable con iluminación LED personalizable, fondos intercambiables, props temáticos (sombreros, antifaces, letreros divertidos), impresión inmediata de fotos y galería digital enviada por WhatsApp. También disponible en formato abierto (open booth) para grupos grandes.",
      },
      {
        heading: "¿Cuántas horas necesito?",
        body: "Para una fiesta de 100 personas, 3 horas de cabina son suficientes. Para 200 personas, 4 horas. El paquete de Daysu.vip incluye técnico operador durante todo el tiempo, ilimitado número de tomas, impresión inmediata y galería digital. La promo especial '3×2' (contrata 3 horas y paga 2) está disponible en temporada baja.",
      },
      {
        heading: "Cómo integrarla en el programa del evento",
        body: "Lo ideal es abrir la cabina 30 minutos después de que empiece la fiesta, cuando los invitados ya están acomodados y relajados. Ciérrala 30 minutos antes del final para que el técnico empaque sin interrumpir la despedida. Evita colocarla cerca de las bocinas principales — el ruido dificulta las fotos grupales.",
      },
    ],
    cta: { text: "Ver cabina fotográfica", href: "/servicios/cabina-fotos-zacatecas" },
  },
];
