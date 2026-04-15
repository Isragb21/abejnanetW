const rawApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim();

const normalizeApiBaseUrl = (value) => {
	const withoutTrailingSlash = value.replace(/\/+$/, "");
	return /\/api$/i.test(withoutTrailingSlash)
		? withoutTrailingSlash
		: `${withoutTrailingSlash}/api`;
};

const API_BASE_URL = rawApiBaseUrl
	? normalizeApiBaseUrl(rawApiBaseUrl)
	: "http://localhost:4000/api";

export default API_BASE_URL;