import { getPageErrorMessage } from "./pageErrors";

const translate = (key) => ({
  "common.errorGeneric": "No se pudo completar",
  "common.errorConnection": "Revisa tu conexión",
  "common.errorTimeout": "Tardó demasiado",
  "common.errorAccess": "Vuelve a iniciar sesión",
  "common.errorNotFound": "No encontramos la información",
  "common.errorConflict": "El registro ya existe",
  "common.errorService": "Inténtalo más tarde",
  "col.deleteFail": "No se pudo eliminar",
}[key] || key);

describe("page error messages", () => {
  test.each([
    [{ name: "TypeError", message: "Failed to fetch" }, "Revisa tu conexión"],
    [{ message: "Fetch failed at http://localhost:4000/api/hives" }, "Revisa tu conexión"],
    [{ status: 401 }, "Vuelve a iniciar sesión"],
    [{ response: { status: 404 } }, "No encontramos la información"],
    [{ status: 409 }, "El registro ya existe"],
    [{ status: 503 }, "Inténtalo más tarde"],
    [{ code: "ECONNABORTED" }, "Tardó demasiado"],
  ])("shows app-owned wording for %o", (error, expected) => {
    expect(getPageErrorMessage(error, translate)).toBe(expected);
  });

  test("replaces technical connection details with app-owned wording", () => {
    const technicalMessage = "SequelizeConnectionRefusedError: localhost:5432";

    const userMessage = getPageErrorMessage(new Error(technicalMessage), translate);

    expect(userMessage).toBe("Revisa tu conexión");
    expect(userMessage).not.toContain("localhost");
  });
});
