import { useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! Upload a discharge summary before asking me about its medical instructions.",
    },
  ]);
  const [apiStatus, setApiStatus] = useState("Checking connection...");
  const [loading, setLoading] = useState(false);

  async function checkBackend() {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) throw new Error("Backend unavailable");

      const data = await response.json();
      setApiStatus(data.message);
    } catch {
      setApiStatus("Backend not connected. Start the server terminal.");
    }
  }

  async function sendQuestion(event) {
    event.preventDefault();

    const text = question.trim();
    if (!text || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text },
    ]);
    setQuestion("");

    // The chatbot is intentionally not connected to Gemini yet.
    // It must not answer medical questions without a verified
    // uploaded discharge summary and source-grounding logic.
    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        text: "The document-grounded chatbot is not enabled yet. First, we need to upload and review a discharge summary.",
      },
    ]);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-2xl text-white">
              +
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                DischargeCare
              </h1>
              <p className="text-sm text-slate-500">
                Your guide from hospital to home
              </p>
            </div>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">
            English · Hindi planned
          </span>
        </header>

        <section className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Caregiver dashboard
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            Welcome to your care journey.
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Keep discharge instructions, daily care tasks and follow-up
            information organized in one place.
          </p>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-xl">
                💬
              </div>
              <div>
                <h3 className="text-xl font-bold">Ask DischargeCare</h3>
                <p className="text-sm text-slate-500">
                  Help understanding your discharge summary
                </p>
              </div>
            </div>

            <div
              className="mt-5 flex min-h-48 flex-col gap-3 rounded-2xl bg-slate-50 p-4"
              aria-live="polite"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "self-end bg-emerald-700 text-white"
                      : "self-start border border-slate-100 bg-white text-slate-700"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <form onSubmit={sendQuestion} className="mt-4 flex gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question..."
                aria-label="Ask DischargeCare a question"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                Send
              </button>
            </form>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Medical answers will be enabled only after a discharge
              summary is processed. Missing or unclear instructions must
              be confirmed with a healthcare professional.
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-2xl">📄</div>
              <h3 className="mt-3 text-lg font-bold">Upload Summary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start by uploading a hospital discharge PDF or photograph.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-emerald-700 px-4 py-3 font-semibold text-emerald-800 hover:bg-emerald-50"
                onClick={() =>
                  alert("Document upload will be implemented in the next module.")
                }
              >
                Upload a document
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-2xl">📋</div>
              <h3 className="mt-3 text-lg font-bold">Daily Care Plan</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your documented care instructions and daily tasks will
                appear here after review.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-2xl">📅</div>
              <h3 className="mt-3 text-lg font-bold">
                Follow-ups & Reminders
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review appointments, pending clarifications and your
                daily care-plan review reminder.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Backend status: {apiStatus}
            </p>
            <button
              type="button"
              onClick={checkBackend}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium hover:bg-slate-200"
            >
              Check connection
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}