import { API_BASE_URL, USE_LOCAL_DATA } from "./config.js";
import { parseApiError, ApiClientError } from "./errors.js";
import { getAccessToken, setAccessToken, clearAccessToken } from "../session/accessTokenStore.js";
import { notifySessionExpired } from "../session/sessionLifecycle.js";
import { localApiFetch, localUploadDocument } from "../localSession/localApi.js";

export async function apiFetch(path, options = {}) {
  if (USE_LOCAL_DATA) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return localApiFetch(path, options);
  }

  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    signal,
  } = options;

  const requestHeaders = { ...headers };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body:
      body !== undefined && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
    signal,
    credentials: "omit",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = parseApiError(payload, response.status);
    if (error.code === "UNAUTHORIZED") {
      clearAccessToken();
      notifySessionExpired();
    }
    throw error;
  }

  return payload;
}

let sessionPromise = null;

export async function ensureAnonymousSession() {
  if (getAccessToken()) {
    return getAccessToken();
  }

  if (!sessionPromise) {
    sessionPromise = apiFetch("/auth/anonymous-session", {
      method: "POST",
      auth: false,
    })
      .then((payload) => {
        setAccessToken(payload.data.accessToken);
        return payload.data.accessToken;
      })
      .finally(() => {
        sessionPromise = null;
      });
  }

  return sessionPromise;
}

export function uploadDocumentMultipart(file, { onProgress, signal }) {
  if (USE_LOCAL_DATA) {
    return ensureAnonymousSession().then(() =>
      localUploadDocument(file, { onProgress, signal })
    );
  }

  return new Promise(async (resolve, reject) => {
    try {
      await ensureAnonymousSession();
    } catch (error) {
      reject(error);
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", `${API_BASE_URL}/documents`);
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        reject(new ApiClientError("Invalid server response.", { status: xhr.status }));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const error = parseApiError(payload, xhr.status);
        if (error.code === "UNAUTHORIZED") {
          clearAccessToken();
          notifySessionExpired();
        }
        reject(error);
        return;
      }

      resolve({ status: xhr.status, data: payload.data, message: payload.message });
    };

    xhr.onerror = () => {
      reject(new ApiClientError("Network error during upload.", { code: "NETWORK_ERROR" }));
    };

    xhr.onabort = () => {
      reject(new DOMException("Aborted", "AbortError"));
    };

    xhr.send(formData);
  });
}
