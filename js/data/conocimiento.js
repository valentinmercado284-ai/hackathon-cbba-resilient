/* =========================================================
   Guía de «Cosecha» para responder sin IA
   - k: palabras clave en minúsculas y sin tildes.
        «rieg*» = palabras que empiezan con «rieg»; «buenos dias» = frase.
   - es / en: respuesta en cada idioma (si falta, se usa el español).
   - ikey: usar un texto de los archivos de idioma (sirve también en quechua).
   - fn: respuesta calculada con los datos de la granja (puede devolver null).
   El orden importa: si dos temas empatan, gana el que está primero.
   Son buenas prácticas generales; para decisiones importantes, consultar
   a un técnico agrónomo, la alcaldía o INIAF.
   ========================================================= */
var KB = [
  {
    id: "nino",
    k: ["nino", "enso", "pacifico", "fenomeno"],
    ikey: "rNino"
  },
  {
    id: "datos",
    k: ["dato*", "estadist*", "nasa", "satelit*", "mi granja", "mi parcela", "mi terreno", "data", "farm", "yupay*"],
    fn: async function () {
      if (!hasLocation()) return t("kbNeedFarm");
      try {
        var s = await loadStats(false), m = farmMun(), l = s.lv;
        return t("kbData", m[0], num(s.pr), signedPct(s.prp), signedPct(s.smp), s.fz, s.hv, t("l" + Math.max(l.s, l.i, l.f, l.h)));
      } catch (e) {
        return t("sFail", e.message);
      }
    }
  },
  {
    id: "pronostico",
    k: ["pronost*", "manana", "llovera", "va a llover", "va a helar", "clima", "temperatura*", "forecast", "weather", "tomorrow"],
    fn: async function () {
      if (!hasLocation()) return t("kbNeedFarm");
      try {
        var f = await loadForecast(false), d = f.days, tom = d[1] || d[0];
        var week = d.reduce(function (s, x) { return s + (x.rain || 0); }, 0);
        var minT = Math.min.apply(null, d.map(function (x) { return x.tmin; }));
        var alerts = forecastAlerts(f).map(function (a) { return a.text; });
        return t("kbFcT") + "\n" + t("kbFcTom", num(tom.tmax), num(tom.tmin), num(tom.rain, 1)) + "\n" +
          t("kbFcWeek", num(week), num(minT, 1)) + (alerts.length ? "\n\n" + alerts.join("\n") : "");
      } catch (e) {
        return t("aFail");
      }
    }
  },
  {
    id: "helada",
    k: ["helad*", "helar", "hiela", "frio", "fria", "frios", "qasa", "escarcha", "frost", "freez*", "cold"],
    es: "❄️ Para protegerte de la helada:\n• Mira el pronóstico en «Alertas»: si la mínima baja de 2 °C, prepárate.\n• Riega la tarde anterior: el suelo húmedo guarda más calor.\n• Cubre las plantas jóvenes por la noche con plástico, paja o tela, y destápalas en la mañana.\n• Siembra en varias fechas y evita las partes bajas, donde se junta el aire frío.",
    en: "❄️ To protect against frost:\n• Check the forecast in “Alerts”: if the minimum drops below 2 °C, get ready.\n• Irrigate the afternoon before: moist soil keeps more heat.\n• Cover young plants at night with plastic, straw or cloth, and uncover them in the morning.\n• Sow on several dates and avoid low spots, where cold air collects.",
    fn: async function (base) {
      if (!hasLocation()) return null;
      try {
        var f = await loadForecast(false), d = f.days.slice(1), low = d[0];
        d.forEach(function (x) { if (x.tmin < low.tmin) low = x; });
        var day = parseDay(low.date).toLocaleDateString(locale(), { weekday: "long" });
        return base + "\n\n" + t("kbFrostFc", num(low.tmin, 1), day);
      } catch (e) { return null; }
    }
  },
  {
    id: "granizo",
    k: ["graniz*", "chikchi", "chhijchi", "hail*"],
    es: "🌨️ Granizo:\n• No se puede evitar, pero sí reducir pérdidas: siembra en varias fechas y combina cultivos.\n• Las mallas antigranizo sirven en hortalizas y frutales.\n• Después de una granizada, quita las hojas muy dañadas y vigila enfermedades.\n• Pregunta en tu alcaldía si hay seguro agrario para tu municipio.",
    en: "🌨️ Hail:\n• It cannot be avoided, but losses can be reduced: sow on several dates and mix crops.\n• Anti-hail nets help for vegetables and fruit trees.\n• After a hailstorm, remove badly damaged leaves and watch for diseases.\n• Ask your municipality whether there is crop insurance for your area."
  },
  {
    id: "incendio",
    k: ["incend*", "fuego", "quem*", "chaqueo", "humo", "fire*", "burn*", "smoke"],
    es: "🔥 Para evitar incendios:\n• No quemes rastrojos en época seca: incorpóralos al suelo o úsalos para cubrirlo.\n• Abre cortafuegos (franjas limpias de 3 a 5 m) alrededor de tu parcela.\n• Ten agua y herramientas a mano.\n• Si ves humo o fuego, avisa de inmediato a tu alcaldía y a tus vecinos.\nEn el «Mapa», la capa «Incendios (VIIRS)» muestra los focos de calor que detectan los satélites.",
    en: "🔥 To prevent fires:\n• Do not burn crop residues in the dry season: work them into the soil or use them as mulch.\n• Open firebreaks (clean strips 3 to 5 m wide) around your plot.\n• Keep water and tools at hand.\n• If you see smoke or fire, tell your municipality and neighbors right away.\nOn the “Map”, the “Fires (VIIRS)” layer shows heat sources detected by satellites."
  },
  {
    id: "lluvia",
    k: ["inund*", "lluvi*", "aguacer*", "riada", "mazamorra", "desborde", "tormenta*", "flood*", "heavy rain", "storm*", "rain"],
    es: "🌊 Ante lluvias fuertes:\n• Limpia zanjas, canales y drenajes antes de la temporada.\n• No siembres en el fondo de las quebradas ni junto al río.\n• Guarda semillas, abono e insumos en un lugar seco y alto.\n• Si se esperan más de 15 mm para mañana, no riegues y protege lo cosechado.\nEn «Alertas» ves la lluvia esperada en tu granja.",
    en: "🌊 Before heavy rain:\n• Clear ditches, canals and drains before the season.\n• Do not sow at the bottom of gullies or next to the river.\n• Keep seeds, fertilizer and supplies somewhere dry and raised.\n• If more than 15 mm are expected tomorrow, do not irrigate and protect your harvest.\nIn “Alerts” you can see the rain expected on your farm."
  },
  {
    id: "agua",
    k: ["rieg*", "regar", "regad*", "agua", "sequi*", "seca", "seco", "yaku", "goteo", "aspers*", "atajado*", "water*", "irrig*", "drought", "dry"],
    es: "💧 Para cuidar el agua:\n• Riega temprano (antes de las 9) o al atardecer: se evapora menos.\n• Mejor por goteo o surcos cortos; evita regar con viento o sol fuerte.\n• Cubre el suelo con rastrojo o paja para guardar la humedad.\n• Mete el dedo 5 cm en la tierra: si está seca, riega.\n• Guarda agua de lluvia en atajados o tanques y organiza turnos con tu comunidad.",
    en: "💧 To save water:\n• Irrigate early (before 9 am) or at dusk: less water evaporates.\n• Drip or short furrows are best; avoid irrigating in wind or strong sun.\n• Cover the soil with crop residues or straw to keep moisture.\n• Push a finger 5 cm into the soil: if it is dry, irrigate.\n• Store rainwater in ponds or tanks and organize water turns with your community.",
    fn: async function (base) {
      if (!hasLocation()) return base + "\n\n" + t("kbMarkTip");
      try {
        var s = await loadStats(false), k = FARM.k || "maiz", c = CROPS[k], need = Math.round(c[0] * 90 / c[1]), bal = s.pr - need;
        var line = bal < 0 ? t("rW1", num(s.pr), cropName(k), num(need), num(-bal)) : t("rW2", num(s.pr), cropName(k), num(need));
        return line + "\n\n" + base;
      } catch (e) { return null; }
    }
  },
  {
    id: "siembra",
    k: ["siembr*", "sembr*", "plant*", "calendario", "cuando sembrar", "sow*", "tarpu*"],
    es: "🌱 Para sembrar este año:\n• En los valles se suele sembrar con las primeras lluvias (octubre a diciembre). Con el Súper Niño las lluvias pueden llegar tarde o ser pocas.\n• Siembra cuando el suelo esté húmedo unos 10 cm.\n• Siembra en 2 o 3 fechas para no perder todo de una vez.\n• Prefiere variedades de ciclo corto y semilla de calidad (pregunta en INIAF).",
    en: "🌱 Sowing this year:\n• In the valleys people usually sow with the first rains (October to December). With Super Niño the rains may come late or be scarce.\n• Sow when the soil is moist about 10 cm deep.\n• Sow on 2 or 3 dates so you do not lose everything at once.\n• Prefer short-cycle varieties and quality seed (ask INIAF)."
  },
  {
    id: "plagas",
    k: ["plaga*", "gusano*", "insect*", "bicho*", "hongo*", "enfermedad*", "pest*", "disease*", "worm*"],
    es: "🐛 Plagas y enfermedades:\n• Revisa tus plantas cada semana (hojas, tallos y frutos).\n• Saca y entierra las plantas muy enfermas, lejos de la parcela.\n• Rota cultivos y usa semilla sana.\n• Antes de usar un químico, consulta a un técnico (INIAF o SENASAG) y usa protección.\nSi me dices tu cultivo, te doy consejos más concretos.",
    en: "🐛 Pests and diseases:\n• Check your plants every week (leaves, stems and fruits).\n• Remove and bury badly diseased plants, away from the plot.\n• Rotate crops and use healthy seed.\n• Before using a chemical, ask a technician (INIAF or SENASAG) and wear protection.\nTell me your crop and I will give you more specific advice."
  },
  {
    id: "papa",
    crop: true,
    k: ["papa", "papas", "potato*", "tizon", "rancha", "gorgojo"],
    es: "🥔 Papa:\n• Usa semilla sana y rota la parcela (no papa sobre papa).\n• Con lluvia y humedad vigila la rancha o tizón (manchas oscuras en las hojas): actúa rápido y consulta a un técnico.\n• Aporca bien para proteger los tubérculos del gorgojo y de la helada.\n• En sequía, que no le falte agua en la floración.",
    en: "🥔 Potato:\n• Use healthy seed and rotate the plot (no potato after potato).\n• With rain and humidity watch for late blight (dark spots on leaves): act fast and ask a technician.\n• Hill up well to protect tubers from weevils and frost.\n• In drought, make sure it gets water during flowering."
  },
  {
    id: "maiz",
    crop: true,
    k: ["maiz", "choclo", "sara", "corn", "maize"],
    es: "🌽 Maíz:\n• El momento más delicado es la floración (cuando salen la espiga y el pelo del choclo): ahí no le debe faltar agua.\n• En años secos, prefiere variedades precoces.\n• Vigila el gusano cogollero en las hojas nuevas.\n• Cubre el suelo con rastrojo para guardar la humedad.",
    en: "🌽 Maize:\n• The most sensitive moment is flowering (when tassels and silks appear): it must not lack water then.\n• In dry years, prefer early varieties.\n• Watch for fall armyworm in the new leaves.\n• Cover the soil with crop residues to keep moisture."
  },
  {
    id: "hortalizas",
    crop: true,
    k: ["hortaliz*", "verdura*", "cebolla*", "tomate*", "lechuga*", "zanahoria*", "vegetable*"],
    es: "🥬 Hortalizas:\n• Riega poco y seguido, mejor por goteo, temprano o al atardecer.\n• Cubre el suelo con paja y, si puedes, da sombra en las horas de más calor.\n• Las carpas solares o túneles protegen de la helada y del granizo.\n• Rota cultivos y usa abono orgánico.",
    en: "🥬 Vegetables:\n• Irrigate little and often, preferably by drip, early or at dusk.\n• Cover the soil with straw and, if you can, give shade in the hottest hours.\n• Greenhouses or tunnels protect against frost and hail.\n• Rotate crops and use organic fertilizer."
  },
  {
    id: "frutales",
    crop: true,
    k: ["frut*", "durazno*", "manzana*", "citric*", "naranja*", "banano*", "platano*", "pina", "fruit*"],
    es: "🍑 Frutales:\n• Haz una taza (círculo de tierra) alrededor del tronco y cúbrela con rastrojo para guardar agua.\n• Riega profundo y menos seguido.\n• En zonas con helada, cubre los árboles jóvenes en noches despejadas.\n• En el trópico, cuida el drenaje en época de lluvias.",
    en: "🍑 Fruit trees:\n• Make a basin (ring of soil) around the trunk and cover it with residues to keep water.\n• Irrigate deeply and less often.\n• Where there is frost, cover young trees on clear nights.\n• In the tropics, take care of drainage in the rainy season."
  },
  {
    id: "ganado",
    crop: true,
    k: ["ganad*", "vaca*", "oveja*", "cabra*", "llama*", "forraj*", "pasto*", "alfalfa", "leche", "uywa", "livestock", "cattle", "fodder"],
    es: "🐄 Ganado y forraje:\n• Guarda forraje ahora (heno o ensilaje) para la época seca.\n• Asegura agua para los animales: atajados, bebederos y turnos.\n• Da sombra y no sobrecargues los pastos.\n• Vacuna y desparasita a tiempo: los animales débiles sufren más con la sequía y el frío.",
    en: "🐄 Livestock and fodder:\n• Store fodder now (hay or silage) for the dry season.\n• Secure water for the animals: ponds, troughs and turns.\n• Provide shade and do not overload pastures.\n• Vaccinate and deworm on time: weak animals suffer more from drought and cold."
  },
  {
    id: "suelo",
    k: ["suelo*", "abon*", "compost*", "fertiliz*", "tierra", "estiercol", "guano", "soil", "manure"],
    es: "🟫 Suelo y abono:\n• El estiércol bien descompuesto y el compost mejoran el suelo y guardan agua.\n• Cubre el suelo con rastrojo: se evapora menos agua y hay menos erosión.\n• En ladera, siembra en curvas de nivel y usa barreras vivas.\n• Si puedes, haz analizar tu suelo antes de comprar fertilizantes.",
    en: "🟫 Soil and fertilizer:\n• Well-rotted manure and compost improve the soil and hold water.\n• Cover the soil with residues: less water evaporates and there is less erosion.\n• On slopes, plant along contour lines and use living barriers.\n• If you can, test your soil before buying fertilizers."
  },
  {
    id: "cultivo",
    k: ["cultivo*", "que sembrar", "que cultivar", "conviene", "crop*", "what to grow"],
    fn: async function () {
      var m = farmMun();
      if (m) return t("kbCrop", m[0], t("t_" + m[3]), t("e_" + m[3]));
      return t("kbCropAll") + "\n" + ["valle", "alto", "seco", "trop"].map(function (z) { return "• " + t("t_" + z) + ": " + t("e_" + z); }).join("\n") + "\n\n" + t("kbMarkTip");
    }
  },
  {
    id: "mapa",
    k: ["mapa", "capa*", "ndvi", "vegetacion", "smap", "imerg", "viirs", "modis", "map", "layer*"],
    es: "🗺️ Capas del «Mapa»:\n• Lluvia (GPM IMERG): dónde está lloviendo.\n• Humedad del suelo (SMAP): cuánta agua tiene la tierra.\n• Vegetación (MODIS): verde intenso = plantas sanas; colores claros o cafés = vegetación seca o escasa.\n• Incendios (VIIRS): focos de calor detectados.\nCambia la fecha para comparar días.",
    en: "🗺️ “Map” layers:\n• Rain (GPM IMERG): where it is raining.\n• Soil moisture (SMAP): how much water the ground holds.\n• Vegetation (MODIS): deep green = healthy plants; light or brown = dry or sparse vegetation.\n• Fires (VIIRS): detected heat sources.\nChange the date to compare days."
  },
  {
    id: "apoyo",
    k: ["seguro*", "alcaldia", "gobierno", "gobernacion", "credito*", "emergencia", "insurance", "government"],
    es: "🏛️ Apoyo en la emergencia:\n• Con la emergencia nacional, tu alcaldía y la gobernación pueden tener cisternas, semillas o apoyo para riego: pregunta y registra tus pérdidas.\n• Pregunta si tu municipio tiene seguro agrario y cómo inscribirte.\n• Para semilla de calidad, consulta a INIAF.",
    en: "🏛️ Support during the emergency:\n• With the national emergency, your municipality and the regional government may have water trucks, seeds or irrigation support: ask and report your losses.\n• Ask whether your municipality has crop insurance and how to sign up.\n• For quality seed, ask INIAF."
  },
  {
    id: "app",
    k: ["como uso", "como funciona", "ayuda", "aplicacion", "app", "suscrib*", "correo", "help", "how to", "registr*"],
    es: "📱 Cómo usar la app:\n1. Marca tu granja en el «Mapa» o usa tu ubicación.\n2. En «Mi granja», elige tu cultivo y guarda.\n3. Mira tus «Datos NASA» con recomendaciones.\n4. En «Alertas» revisa el pronóstico y suscríbete para recibir avisos por correo.",
    en: "📱 How to use the app:\n1. Mark your farm on the “Map” or use your location.\n2. In “My farm”, choose your crop and save.\n3. See your “NASA data” with recommendations.\n4. In “Alerts” check the forecast and subscribe to get email alerts."
  },
  {
    id: "saludo",
    k: ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hello", "hi", "hey", "allillanchu", "napaykuy", "imaynalla"],
    es: "¡Hola! 🌱 Pregúntame por riego, heladas, lluvias fuertes, plagas, siembra o los datos NASA de tu granja.",
    en: "Hi! 🌱 Ask me about irrigation, frost, heavy rain, pests, sowing or your farm’s NASA data."
  },
  {
    id: "gracias",
    k: ["gracias", "thanks", "thank", "pagarasunki", "diospagarasunki", "sulpayki"],
    es: "¡De nada! 🌱 Si necesitas algo más, aquí estoy.",
    en: "You’re welcome! 🌱 I’m here if you need anything else."
  }
];
