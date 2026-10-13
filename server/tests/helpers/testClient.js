import http from "node:http";

function parseSetCookie(setCookieValue) {
  const [pair] = setCookieValue.split(";");
  const separatorIndex = pair.indexOf("=");
  const name = pair.slice(0, separatorIndex);
  const value = pair.slice(separatorIndex + 1);
  return [name, value];
}

export class TestClient {
  constructor(app) {
    this.app = app;
    this.server = http.createServer(app);
    this.port = null;
    this.cookies = new Map();
    this.csrfToken = null;
  }

  async start() {
    await new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", resolve);
    });
    this.port = this.server.address().port;
  }

  async stop() {
    await new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  storeCookies(response) {
    const setCookies = response.headers.getSetCookie?.() || [];

    for (const cookie of setCookies) {
      const [name, value] = parseSetCookie(cookie);

      if (/Max-Age=0/i.test(cookie)) {
        this.cookies.delete(name);

        if (name === "dc_csrf_token") {
          this.csrfToken = null;
        }

        continue;
      }

      this.cookies.set(name, value);

      if (name === "dc_csrf_token") {
        this.csrfToken = value;
      }
    }
  }

  cookieHeader() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  async request(path, { method = "GET", body, headers = {}, authToken } = {}) {
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    const cookieHeader = this.cookieHeader();

    if (cookieHeader) {
      requestHeaders.Cookie = cookieHeader;
    }

    if (authToken) {
      requestHeaders.Authorization = `Bearer ${authToken}`;
    }

    if (this.csrfToken && !requestHeaders["X-CSRF-Token"]) {
      requestHeaders["X-CSRF-Token"] = this.csrfToken;
    }

    const response = await fetch(`http://127.0.0.1:${this.port}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    this.storeCookies(response);

    const text = await response.text();
    let json = null;

    if (text) {
      json = JSON.parse(text);
    }

    return { response, body: json };
  }
}
