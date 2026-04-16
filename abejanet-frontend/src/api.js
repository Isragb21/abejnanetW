const rawApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim();
const isProduction = process.env.NODE_ENV === "production";

const normalizeApiBaseUrl = (value) => {
	const withoutTrailingSlash = value.replace(/\/+$/, "");
	return /\/api$/i.test(withoutTrailingSlash)
		? withoutTrailingSlash
		: `${withoutTrailingSlash}/api`;
};

const resolveApiBaseUrl = () => {
	if (rawApiBaseUrl) {
		return normalizeApiBaseUrl(rawApiBaseUrl);
	}

	if (isProduction) {
		return "/api";
	}

	return "http://localhost:4000/api";
};

const resolvedApiBaseUrl = resolveApiBaseUrl();

if (isProduction && !rawApiBaseUrl) {
	console.warn(
		"REACT_APP_API_BASE_URL no esta configurada. Se usara /api en este build de produccion."
	);
}

export default resolvedApiBaseUrl;