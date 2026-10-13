import { useRef } from "react";
import { Card, SectionHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { Alert } from "../ui/Alert.jsx";
import { LoadingSkeleton } from "../ui/LoadingSkeleton.jsx";
import { ChatCitationList } from "./ChatCitationList.jsx";
import { useEmbeddedChat, CHAT_STATE } from "../../hooks/useEmbeddedChat.js";
import { answerStatusLabel, getSuggestedQuestions } from "../../utils/chatPresentation.js";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";
import { ReadAloudButton } from "../accessibility/ReadAloudButton.jsx";

export function EmbeddedChat({ documentRecord, layout = "inline" }) {
  const { t } = useTranslation();
  const chat = useEmbeddedChat(documentRecord);
  const listRef = useRef(null);
  const inputId = "chat-input-embedded";

  const disabled =
    !chat.available ||
    chat.chatState === CHAT_STATE.SENDING ||
    chat.chatState === CHAT_STATE.LOADING_HISTORY ||
    chat.chatState === CHAT_STATE.SESSION_EXPIRED;

  const suggestions = getSuggestedQuestions(t);

  function handleSubmit(event) {
    event.preventDefault();
    chat.sendMessage(chat.draft);
  }

  return (
    <Card className={layout === "sidebar" ? "sticky top-4" : ""}>
      <SectionHeader
        icon="💬"
        title={t("chat.title")}
        description={t("chat.description")}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chat.available ? (
          <Button type="button" variant="ghost" size="md" onClick={chat.clearHistory}>
            {t("chat.clear")}
          </Button>
        ) : null}
      </div>

      {!chat.available ? (
        <Alert tone="info" title={t("chat.unavailableTitle")} className="mt-4">
          {t("chat.unavailableBody")}
        </Alert>
      ) : null}

      {chat.chatState === CHAT_STATE.SESSION_EXPIRED ? (
        <Alert tone="warning" title={t("upload.sessionTitle")} className="mt-4" role="alert">
          {chat.errorMessage}
        </Alert>
      ) : null}

      {chat.chatState === CHAT_STATE.LOADING_HISTORY ? (
        <div className="mt-4" aria-busy="true">
          <LoadingSkeleton lines={4} />
        </div>
      ) : (
        <div
          ref={listRef}
          className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl bg-slate-50 p-3"
          aria-live="polite"
          aria-busy={chat.chatState === CHAT_STATE.SENDING}
        >
          {chat.messages.length === 0 && chat.available ? (
            <p className="text-sm text-slate-600">{t("chat.emptyHint")}</p>
          ) : null}

          {chat.messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "self-end bg-teal-700 text-white"
                  : "self-start border border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p>{message.text}</p>
              {message.role === "assistant" && message.answerStatus ? (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {answerStatusLabel(message.answerStatus, t)}
                </p>
              ) : null}
              {message.role === "assistant" ? (
                <ChatCitationList citations={message.citations} />
              ) : null}
              {message.role === "assistant" ? (
                <ReadAloudButton
                  text={message.text}
                  language={message.language || chat.language}
                />
              ) : null}
            </div>
          ))}

          {chat.chatState === CHAT_STATE.SENDING ? (
            <p className="text-sm text-slate-500" role="status">{t("chat.sending")}</p>
          ) : null}
        </div>
      )}

      {chat.available && chat.messages.length === 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50"
              onClick={() => chat.sendMessage(question)}
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor={inputId}>
          {t("chat.inputLabel")}
        </label>
        <input
          id={inputId}
          value={chat.draft}
          onChange={(event) => chat.setDraft(event.target.value)}
          disabled={disabled}
          placeholder={
            chat.available ? t("chat.placeholder") : t("chat.placeholderUnavailable")
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-100 disabled:bg-slate-100"
        />
        <Button type="submit" size="md" disabled={disabled || !chat.draft.trim()}>
          {t("chat.send")}
        </Button>
      </form>

      {chat.chatState === CHAT_STATE.ERROR && chat.errorMessage ? (
        <Alert tone="danger" title={t("chat.failedTitle")} className="mt-3" role="alert">
          {chat.errorMessage}
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={chat.retryLoad}
          >
            {t("chat.retry")}
          </Button>
        </Alert>
      ) : null}

      <p className="mt-2 text-xs leading-5 text-slate-500">{t("chat.disclaimer")}</p>
    </Card>
  );
}
