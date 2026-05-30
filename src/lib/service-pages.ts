export type ServiceDbFilter =
  | { type: "packages_all" }
  | { type: "category"; categoryNames: string[] }
  | { type: "name_contains"; keyword: string };

export type ServicePageConfig = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  features: string[];
  dbFilter: ServiceDbFilter;
  jsonLdDescription: string;
};

export const SERVICE_PAGES: ServicePageConfig[] = [
  {
    slug: "bodas-zacatecas",
    metaTitle: "DJ y Sonido para Bodas en Zacatecas",
    metaDescription: "Paquetes completos de DJ, audio, iluminación y shows para bodas en Zacatecas. Reserva en línea y aparta tu fecha con depósito.",
    h1: "DJ y Sonido para Bodas en Zacatecas",
    subtitle: "Hacemos que tu boda suene perfecta. Paquetes completos con DJ, iluminación y shows para hasta 500 invitados en Zacatecas.",
    features: [
      "Coordinamos con el venue y horarios de tu boda",
      "Repertorio personalizado: desde música de ceremonia hasta el after",
      "Equipo de respaldo incluido en todos los paquetes",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "Servicio de DJ, sonido e iluminación para bodas en Zacatecas. Paquetes completos para hasta 500 invitados con reserva en línea.",
  },
  {
    slug: "xv-anos-zacatecas",
    metaTitle: "Paquetes para XV Años en Zacatecas",
    metaDescription: "DJ, iluminación, cabina de fotos y shows para quinceañeras en Zacatecas. Paquetes completos para una noche inolvidable.",
    h1: "Paquetes para XV Años en Zacatecas",
    subtitle: "El día más especial merece el mejor servicio. DJ, iluminación, shows y más para tu quinceañera en Zacatecas.",
    features: [
      "Paquetes diseñados especialmente para quinceañeras",
      "Iluminación temática y efectos especiales incluidos",
      "Coordinación total el día del evento sin que te preocupes por nada",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "Servicio integral para quinceañeras en Zacatecas: DJ, iluminación, cabina de fotos y shows. Reserva en línea.",
  },
  {
    slug: "fiestas-zacatecas",
    metaTitle: "Sonido y Show para Fiestas en Zacatecas",
    metaDescription: "Equipo de sonido profesional, DJ, luces y shows para todo tipo de fiestas en Zacatecas. Hasta 500 invitados.",
    h1: "Sonido y Show para Fiestas en Zacatecas",
    subtitle: "Desde una fiesta íntima hasta un evento masivo. Paquetes de sonido, DJ y show para todas las ocasiones en Zacatecas.",
    features: [
      "Para fiestas desde 50 hasta 500 invitados",
      "DJ con equipo de sonido profesional certificado",
      "Shows y entretenimiento disponibles como complemento",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "DJ, sonido y shows para fiestas en Zacatecas. Capacidad hasta 500 invitados. Reserva en línea.",
  },
  {
    slug: "dj-zacatecas",
    metaTitle: "DJ para Eventos en Zacatecas",
    metaDescription: "DJ profesional para bodas, XV años y fiestas en Zacatecas. Equipo de sonido completo, iluminación y coordinación incluidos.",
    h1: "DJ Profesional para Eventos en Zacatecas",
    subtitle: "El mejor sonido para tu evento. DJ profesional con equipo completo de audio e iluminación disponible en Zacatecas.",
    features: [
      "DJ con experiencia en bodas, XV años y eventos corporativos",
      "Equipo de sonido profesional para cualquier tamaño de evento",
      "Reserva en línea y aparta tu fecha con el 30% de depósito",
    ],
    dbFilter: { type: "category", categoryNames: ["Sonido"] },
    jsonLdDescription: "DJ profesional para eventos en Zacatecas. Bodas, XV años, fiestas. Equipo de sonido e iluminación incluidos.",
  },
  {
    slug: "show-robot-zacatecas",
    metaTitle: "Show Robot LED en Zacatecas",
    metaDescription: "El espectacular Show Robot LED para bodas, XV años y fiestas en Zacatecas. El entretenimiento que todos recordarán.",
    h1: "Show Robot LED en Zacatecas",
    subtitle: "El show más espectacular para tu evento. El Robot LED es el entretenimiento que tus invitados no olvidarán en Zacatecas.",
    features: [
      "El entretenimiento más viral en bodas y quinceañeras",
      "Show completo con efectos LED y pirotecnia fría",
      "Disponible en Zacatecas y área metropolitana",
    ],
    dbFilter: { type: "name_contains", keyword: "robot" },
    jsonLdDescription: "Show Robot LED para bodas, XV años y fiestas en Zacatecas. Entretenimiento espectacular con efectos de luz.",
  },
  {
    slug: "cabina-fotos-zacatecas",
    metaTitle: "Cabina de Fotos para Eventos en Zacatecas",
    metaDescription: "Cabina de fotos profesional para bodas, XV años y fiestas en Zacatecas. Impresión instantánea y recuerdo para tus invitados.",
    h1: "Cabina de Fotos para Eventos en Zacatecas",
    subtitle: "El recuerdo perfecto para tus invitados. Cabina de fotos profesional con impresión instantánea para tu evento en Zacatecas.",
    features: [
      "Impresión instantánea de fotos en el evento",
      "Props y decoración temática incluidos",
      "Galería digital para todos los invitados tras el evento",
    ],
    dbFilter: { type: "category", categoryNames: ["Cabinas"] },
    jsonLdDescription: "Cabina de fotos para bodas, XV años y fiestas en Zacatecas. Impresión instantánea e ilimitada.",
  },
  {
    slug: "carrito-shots-zacatecas",
    metaTitle: "Carrito de Shots para Fiestas en Zacatecas",
    metaDescription: "Carrito de shots para bodas, XV años y fiestas en Zacatecas. El complemento perfecto para animar tu evento.",
    h1: "Carrito de Shots para Fiestas en Zacatecas",
    subtitle: "Anima tu evento con nuestro carrito de shots. Servicio profesional con presentación impecable para bodas y fiestas en Zacatecas.",
    features: [
      "Variedad de shots y bebidas personalizables para tu evento",
      "Servicio con presentación profesional y atención incluida",
      "Ideal para bodas, XV años y fiestas privadas en Zacatecas",
    ],
    dbFilter: { type: "category", categoryNames: ["Carritos de Comida"] },
    jsonLdDescription: "Carrito de shots para bodas, XV años y fiestas en Zacatecas. Servicio profesional incluido.",
  },
  {
    slug: "graduaciones-zacatecas",
    metaTitle: "DJ y Sonido para Graduaciones en Zacatecas",
    metaDescription: "Paquetes de DJ, audio, iluminación y shows para graduaciones en Zacatecas. Celebra tu logro con el mejor sonido.",
    h1: "DJ y Sonido para Graduaciones en Zacatecas",
    subtitle: "Tu graduación merece una celebración épica. DJ profesional, iluminación y shows para la fiesta que siempre soñaste en Zacatecas.",
    features: [
      "Paquetes diseñados para fiestas de graduación de cualquier tamaño",
      "DJ con repertorio actual y clásicos que todos conocen",
      "Iluminación profesional y efectos especiales incluidos",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "DJ, sonido e iluminación para graduaciones en Zacatecas. Paquetes completos para celebrar tu logro.",
  },
  {
    slug: "eventos-corporativos-zacatecas",
    metaTitle: "Audio e Iluminación para Eventos Corporativos en Zacatecas",
    metaDescription: "Servicio de audio, iluminación y DJ para eventos corporativos en Zacatecas. Profesionalismo garantizado para tu empresa.",
    h1: "Audio e Iluminación para Eventos Corporativos en Zacatecas",
    subtitle: "Tecnología de audio e iluminación de nivel profesional para conferencias, cenas de empresa y eventos corporativos en Zacatecas.",
    features: [
      "Equipo de sonido profesional para conferencias y presentaciones",
      "Coordinación puntual y discreta para eventos de empresa",
      "Presupuesto personalizado según las necesidades del evento",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "Audio, iluminación y DJ para eventos corporativos en Zacatecas. Servicio profesional para empresas.",
  },
  {
    slug: "bautizos-zacatecas",
    metaTitle: "DJ y Entretenimiento para Bautizos en Zacatecas",
    metaDescription: "DJ, sonido e iluminación para bautizos en Zacatecas. Celebra este momento especial con música y entretenimiento de calidad.",
    h1: "DJ y Entretenimiento para Bautizos en Zacatecas",
    subtitle: "Celebra el bautizo con la familia en grande. Música, sonido e iluminación profesional para que todos disfruten en Zacatecas.",
    features: [
      "Ambiente musical adecuado para toda la familia",
      "Equipo de sonido para salones de cualquier tamaño",
      "Coordinación total para que solo disfrutes el momento",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "DJ y sonido para bautizos en Zacatecas. Celebra con música y entretenimiento de calidad.",
  },
  {
    slug: "paquetes-eventos-zacatecas",
    metaTitle: "Paquetes para Eventos en Zacatecas",
    metaDescription: "Paquetes completos de DJ, audio, iluminación y shows para todo tipo de eventos en Zacatecas. Reserva en línea con apartado del 30%.",
    h1: "Paquetes para Eventos en Zacatecas",
    subtitle: "Todo lo que necesitas para tu evento en un solo lugar. DJ, sonido, iluminación, shows y más — con reserva en línea en Zacatecas.",
    features: [
      "Paquetes para bodas, XV años, graduaciones, bautizos y más",
      "Reserva en línea con solo el 30% de depósito para apartar tu fecha",
      "Atención personalizada y coordinación total el día del evento",
    ],
    dbFilter: { type: "packages_all" },
    jsonLdDescription: "Paquetes completos para todo tipo de eventos en Zacatecas: DJ, audio, iluminación y shows.",
  },
];
