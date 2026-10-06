export function getPageErrorMessage(error, t, fallbackKey = "common.errorGeneric") {
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.response?.status || error?.status || 0);

  if (error?.code === "ECONNABORTED" || /timed? ?out|timeout/.test(message)) {
    return t("common.errorTimeout");
  }

  if (status === 401 || status === 403) return t("common.errorAccess");
  if (status === 404) return t("common.errorNotFound");
  if (status === 409) return t("common.errorConflict");
  if (status >= 500) return t("common.errorService");

  if (
    /failed to fetch|network\s+error|networkerror|err_network|err_connection|localhost|127\.0\.0\.1|no respondio con json|no se pudo conectar|network request failed/.test(message)
  ) {
    return t("common.errorConnection");
  }

  return t(fallbackKey);
}
