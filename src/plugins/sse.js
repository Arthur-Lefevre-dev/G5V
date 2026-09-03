/**
 * Lightweight Vue 3 SSE helper compatible with the former vue-sse API used by G5V.
 */
class SseClient {
  constructor(options = {}) {
    this.url = options.url;
    this.format = options.format || "json";
    this.withCredentials = options.withCredentials !== false;
    this._handlers = {};
    this._errorHandlers = [];
    this._source = null;
  }

  on(event, handler) {
    if (event === "error") {
      this._errorHandlers.push(handler);
      return this;
    }
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return this;
  }

  connect() {
    if (this._source) return Promise.resolve(this);

    this._source = new EventSource(this.url, {
      withCredentials: this.withCredentials
    });

    this._source.onmessage = event => {
      this._dispatch("message", event.data);
    };

    this._source.onerror = err => {
      this._errorHandlers.forEach(fn => fn(err));
    };

    Object.keys(this._handlers).forEach(eventName => {
      if (eventName === "message") return;
      this._source.addEventListener(eventName, event => {
        this._dispatch(eventName, event.data);
      });
    });

    return Promise.resolve(this);
  }

  _dispatch(eventName, raw) {
    let payload = raw;
    if (this.format === "json") {
      try {
        payload = JSON.parse(raw);
      } catch (err) {
        this._errorHandlers.forEach(fn => fn(err));
        return;
      }
    }
    (this._handlers[eventName] || []).forEach(fn => fn(payload));
  }

  disconnect() {
    if (this._source) {
      this._source.close();
      this._source = null;
    }
  }
}

const sse = {
  create(options) {
    return new SseClient(options);
  }
};

export default {
  install(app) {
    app.config.globalProperties.$sse = sse;
  }
};
