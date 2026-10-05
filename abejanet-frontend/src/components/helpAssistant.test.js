import { FAQ, getAnswer } from "./helpAssistant";

describe("help assistant", () => {
  test.each([
    ["¿Cómo agrego un apiario?", "Apiarios", "nombre"],
    ["quiero crear apiarios", "Apiarios", "nombre"],
    ["como editar o eliminar un apiario?", "Para cambiar sus datos", "bote de basura"],
    ["como se agrega una colmena al apiario", "Colmenas", "apiario"],
    ["¿Qué significa la relación entre apiario y colmenas?", "lugar", "varias colmenas"],
    ["¿Dónde veo las colmenas de un apiario?", "Colmenas", "filtro"],
    ["¿Cómo cierro sesión?", "Cerrar sesión", "menú lateral"],
  ])("responde a: %s", (question, ...expectedPhrases) => {
    const answer = getAnswer(question);

    expectedPhrases.forEach((phrase) => {
      expect(answer.toLowerCase()).toContain(phrase.toLowerCase());
    });
  });

  test.each([
    ["Me aparece error: faltan campos obligatorios en colmena", "elige un apiario"],
    ["Error 401 al guardar", "Vuelve a iniciar sesión"],
    ["Error 404 al abrir", "No se encontró"],
    ["Error 409, el registro ya existe", "ya hay un registro"],
    ["Failed to fetch al cargar", "No se pudo completar"],
    ["Error 503", "No se pudo completar"],
  ])("explica un error común: %s", (message, expectedPhrase) => {
    expect(getAnswer(message)).toContain(expectedPhrase);
  });

  test("cada pregunta rápida tiene una respuesta específica", () => {
    FAQ.forEach(({ id, question }) => {
      expect(getAnswer(question, id)).not.toContain("Puedo ayudarte con");
    });
  });

  test("pide detalles útiles cuando no reconoce una consulta", () => {
    const answer = getAnswer("¿Me puedes ayudar con esto?");

    expect(answer).toContain("en qué pantalla");
    expect(answer).toContain("mensaje completo");
  });
});
