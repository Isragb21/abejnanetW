const topics = [
  {
    id: 1,
    question: "¿Cómo agrego un usuario?",
    answer: "Abre Usuarios en el menú y pulsa Agregar usuario. Escribe su nombre, correo, contraseña y elige un rol. Después, guarda los cambios.",
    keywords: ["agregar usuario", "crear usuario", "nuevo usuario", "dar de alta usuario", "registrar usuario"],
    entity: "usuario",
    action: "add",
  },
  {
    id: 2,
    question: "¿Cómo edito o elimino un usuario?",
    answer: "Abre Usuarios y busca a la persona.\n\nPara cambiar sus datos, pulsa el lápiz, edita la información y guarda.\n\nPara quitarla, pulsa el bote de basura y confirma. Esa persona ya no podrá entrar.",
    keywords: ["editar usuario", "modificar usuario", "cambiar usuario", "eliminar usuario", "borrar usuario", "quitar usuario"],
    entity: "usuario",
    action: "changeOrRemove",
  },
  {
    id: 3,
    question: "¿Cómo agrego un apiario?",
    answer: "Abre Apiarios en el menú y pulsa el botón para agregar uno. El nombre es necesario; también puedes escribir su ubicación y una descripción. Pulsa Crear para guardarlo.",
    keywords: ["agregar apiario", "crear apiario", "nuevo apiario", "dar de alta apiario", "registrar apiario"],
    entity: "apiario",
    action: "add",
  },
  {
    id: 4,
    question: "¿Cómo edito o elimino un apiario?",
    answer: "Abre Apiarios y busca el apiario.\n\nPara cambiar sus datos, pulsa el lápiz, haz los cambios y guarda.\n\nPara quitarlo, pulsa el bote de basura y confirma.",
    keywords: ["editar apiario", "editar o eliminar un apiario", "modificar apiario", "cambiar apiario", "eliminar apiario", "borrar apiario", "quitar apiario"],
    entity: "apiario",
    action: "changeOrRemove",
  },
  {
    id: 5,
    question: "¿Qué relación hay entre un apiario y sus colmenas?",
    answer: "Un apiario es el lugar donde organizas tus colmenas. Cada colmena queda asignada a un apiario, y un apiario puede tener varias colmenas.",
    keywords: ["relacion apiario colmena", "relacion entre apiario y colmenas", "apiario y colmena", "apiario tiene colmenas", "colmena pertenece", "que es un apiario", "que significa apiario"],
  },
  {
    id: 6,
    question: "¿Cómo agrego una colmena a un apiario?",
    answer: "Abre Colmenas y pulsa Crear. Elige el apiario al que pertenece, escribe el nombre de la colmena y, si quieres, agrega una descripción. Pulsa Crear para guardarla.\n\nSi todavía no tienes apiarios, crea uno primero desde Apiarios.",
    keywords: ["agregar colmena", "crear colmena", "nueva colmena", "dar de alta colmena", "registrar colmena"],
    entity: "colmena",
    action: "add",
  },
  {
    id: 7,
    question: "¿Dónde veo las colmenas de un apiario?",
    answer: "Abre Colmenas. Puedes ver todas juntas o usar el filtro de apiario para mostrar solo las que pertenecen al lugar que buscas.",
    keywords: ["ver colmenas apiario", "listar colmenas", "colmenas por apiario", "buscar colmenas", "donde estan las colmenas"],
    entity: "colmena",
    action: "view",
  },
  {
    id: 8,
    question: "¿Cómo edito, elimino o veo una colmena?",
    answer: "Abre Colmenas y busca la colmena.\n\nPulsa Ver detalle para consultar su información y sensores. Pulsa Editar para cambiar sus datos. Para quitarla, pulsa Eliminar y confirma.",
    keywords: ["editar colmena", "modificar colmena", "eliminar colmena", "borrar colmena", "detalle colmena", "ver detalle colmena"],
    entity: "colmena",
    action: "changeOrRemoveOrView",
  },
  {
    id: 9,
    question: "¿Dónde consulto o agrego sensores?",
    answer: "Abre Sensores en el menú para consultar los sensores y su estado. Desde esa pantalla también puedes agregarlos; selecciona la colmena a la que corresponden y completa sus datos.",
    keywords: ["sensores", "sensor", "mediciones", "agregar sensor", "crear sensor", "ver sensor"],
  },
  {
    id: 10,
    question: "¿Dónde veo los reportes?",
    answer: "Abre Reportes en el menú, elige una colmena y un periodo para consultar sus mediciones. Desde ahí puedes descargar el reporte.",
    keywords: ["reportes", "reporte", "informes", "informe", "graficas", "estadisticas"],
  },
  {
    id: 11,
    question: "¿Qué hago si no puedo iniciar sesión?",
    answer: "Revisa que el correo y la contraseña estén escritos correctamente. Si te pide un código de seguridad, usa el código actual de tu aplicación de autenticación. Si el mensaje continúa, compártelo con la persona que administra AbejaNet.",
    keywords: ["iniciar sesion", "no puedo entrar", "no puedo acceder", "login", "contrasena", "codigo de seguridad"],
  },
  {
    id: 12,
    question: "¿Cómo cierro sesión?",
    answer: "Pulsa Cerrar sesión, al final del menú lateral.",
    keywords: ["cerrar sesion", "cierro sesion", "salir de mi cuenta", "logout"],
  },
  {
    id: 13,
    question: "¿Qué significa el error que aparece en la página?",
    answer: "Pega aquí el mensaje completo que aparece y dime en qué pantalla estabas y qué intentabas hacer. Así puedo explicarte qué pasó y qué probar.",
    keywords: ["error", "me aparece un error", "mensaje de error", "fallo", "no funciona"],
  },
  {
    id: 14,
    question: "¿Cómo cambio los datos de mi cuenta?",
    answer: "Abre Cuenta en el menú para consultar o actualizar la información de tu perfil. Cuando termines, guarda los cambios.",
    keywords: ["mi cuenta", "datos de mi cuenta", "cambiar mi nombre", "perfil"],
  },
];

const addPrefixes = ["agreg", "anad", "cre", "registr", "alta", "anex", "incorpor", "pon", "asign"];
const removePrefixes = ["elimin", "borr", "quit", "remov"];
const editPrefixes = ["edit", "modific", "actualiz", "cambi"];
const viewPrefixes = ["ver", "ve", "consult", "busc", "mostr", "abr", "revis"];

const normalize = (text) => text
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[¿?¡!.,;:()[\]{}]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const hasPrefix = (words, prefixes) => words.some((word) => prefixes.some((prefix) => word.startsWith(prefix)));

function matchAction(words, action) {
  const hasAdd = hasPrefix(words, addPrefixes) || words.includes("nuevo") || words.includes("nueva");
  const hasRemove = hasPrefix(words, removePrefixes);
  const hasEdit = hasPrefix(words, editPrefixes);
  const hasView = hasPrefix(words, viewPrefixes) || words.includes("donde");

  if (action === "add") return hasAdd;
  if (action === "changeOrRemove") return hasEdit || hasRemove;
  if (action === "view") return hasView;
  if (action === "changeOrRemoveOrView") return hasEdit || hasRemove || hasView;
  return false;
}

function getActionPrefixes(action) {
  if (action === "add") return addPrefixes;
  if (action === "changeOrRemove") return [...editPrefixes, ...removePrefixes];
  if (action === "view") return viewPrefixes;
  return [...editPrefixes, ...removePrefixes, ...viewPrefixes];
}

function getErrorAnswer(text, normalized, words) {
  const isError = /\b(error|fallo|no funciona|no se pudo|no fue posible|failed|exception)\b/.test(normalized)
    || /\b(err_connection|networkerror|failed to fetch)\b/.test(normalized)
    || /\b(401|403|404|409|500|502|503)\b/.test(normalized);
  if (!isError) return null;

  const mentions = (terms) => terms.some((term) => words.some((word) => word.startsWith(term)));

  if (mentions(["obligat", "required", "vaci", "falt", "complet", "llen", "seleccion"])) {
    if (mentions(["colmena", "colmenas"])) return "Ese aviso indica que falta un dato necesario. Para guardar una colmena, elige un apiario y escribe el nombre.";
    if (mentions(["apiario", "apiarios"])) return "Ese aviso indica que falta un dato necesario. Para guardar un apiario, escribe al menos su nombre.";
    return "Ese aviso indica que falta un dato necesario. Revisa los campos marcados en la pantalla y complétalos antes de guardar.";
  }

  if (/\b(401|403)\b/.test(normalized) || mentions(["sesion", "sesión", "permiso", "autorizado", "autenticacion"])) {
    return "Parece que tu sesión terminó o que tu cuenta no tiene permiso para hacer eso. Vuelve a iniciar sesión; si el aviso sigue, consulta a quien administra AbejaNet.";
  }

  if (/\b(404)\b/.test(normalized) || /\b(no encontrado|no existe)\b/.test(normalized)) {
    return "No se encontró la información que intentabas abrir. Vuelve al listado, selecciona el registro otra vez y prueba de nuevo.";
  }

  if (/\b(409)\b/.test(normalized) || /\b(duplicado|ya existe|ya registrado)\b/.test(normalized)) {
    return "Parece que ya hay un registro con esos datos. Revisa el nombre o la información que escribiste e intenta de nuevo.";
  }

  if (/\b(pdf|descarga)\b/.test(normalized) && /\b(generar|descargar|error|fallo)\b/.test(normalized)) {
    return "No se pudo preparar el reporte para descargar. Revisa que hayas elegido una colmena y un periodo con mediciones, e inténtalo otra vez. Si el aviso continúa, comparte el mensaje completo.";
  }

  if (/\b(500|502|503)\b/.test(normalized) || /\b(failed to fetch|networkerror|err_connection_refused|error de conexion|no se pudo conectar|no respondio|backend)\b/.test(normalized)) {
    return "No se pudo completar la operación porque AbejaNet no logró responder en este momento. Espera un poco y vuelve a intentarlo. Si continúa, comparte el mensaje completo y el nombre de la pantalla con quien administra el sistema.";
  }

  if (/\b(contrasena incorrecta|correo incorrecto|credenciales|codigo incorrecto|código incorrecto)\b/.test(normalized)) {
    return "Revisa que el correo, la contraseña o el código de seguridad estén escritos correctamente. Si no recuerdas la contraseña o el aviso continúa, consulta a quien administra AbejaNet.";
  }

  if (mentions(["colmena", "colmenas"]) && mentions(["apiario", "apiarios"])) {
    return "Si el aviso aparece al guardar una colmena, asegúrate de elegir un apiario y escribir el nombre de la colmena. Si aparece al hacer otra cosa, pega aquí el mensaje completo para orientarte mejor.";
  }

  return `Parece que algo no salió bien. ${text.length > 140 ? "Para revisarlo con precisión, " : ""}dime en qué pantalla apareció y qué estabas intentando hacer. Si puedes, pega también el mensaje completo.`;
}

export const FAQ = topics.map(({ id, question }) => ({ id, question }));

export function getAnswer(text, quickQuestionId) {
  if (quickQuestionId) {
    const quickTopic = topics.find(({ id }) => id === quickQuestionId);
    if (quickTopic) return quickTopic.answer;
  }

  const normalized = normalize(text || "");
  if (!normalized) return "";
  const words = normalized.split(" ");

  const errorAnswer = getErrorAnswer(text, normalized, words);
  if (errorAnswer) return errorAnswer;

  const topic = topics
    .map((candidate) => {
      const phraseScore = Math.max(
        0,
        ...candidate.keywords
          .filter((keyword) => normalized.includes(normalize(keyword)))
          .map((keyword) => normalize(keyword).length + 1000),
      );
      if (phraseScore) return { topic: candidate, score: phraseScore };
      if (!candidate.entity || !matchAction(words, candidate.action)) return null;

      const entityWords = candidate.entity === "usuario"
        ? ["usuario", "usuarios"]
        : candidate.entity === "apiario"
          ? ["apiario", "apiarios"]
          : ["colmena", "colmenas"];
      const entityPositions = words
        .map((word, index) => entityWords.includes(word) ? index : -1)
        .filter((index) => index >= 0);
      const actionIndex = words.findIndex((word) => getActionPrefixes(candidate.action).some((prefix) => word.startsWith(prefix)));
      if (!entityPositions.length || actionIndex < 0) return null;

      const distance = Math.min(...entityPositions.map((index) => Math.abs(index - actionIndex)));
      return { topic: candidate, score: 100 - distance };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0]?.topic;

  if (topic) return topic.answer;
  if (words.some((word) => ["hola", "buenas", "buenos"].includes(word))) {
    return "¡Hola! Puedo ayudarte a agregar apiarios y colmenas, consultar sensores y reportes, administrar usuarios o entender un mensaje de la página. ¿Qué necesitas hacer?";
  }

  return "Puedo ayudarte con apiarios, colmenas, sensores, reportes, usuarios y mensajes de error. Cuéntame qué quieres hacer y en qué pantalla; si apareció un aviso, pega aquí el mensaje completo.";
}
