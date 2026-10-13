import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteChatHistory,
  fetchChatHistory,
  sendChatMessage,
} from "../api/chat.js";
import { ApiClientError, userFacingMessage } from "../api/errors.js";
import {
  isChatAvailableForDocument,
  mapAssistantResponse,
  mapHistoryToThread,
} from "../utils/chatPresentation.js";
import { useTranslation } from "../i18n/LanguageProvider.jsx";
import { translateActive } from "../i18n/runtimeTranslator.js";
import { stopSpeaking } from "../speech/textToSpeech.js";

export const CHAT_STATE = {
  IDLE: "idle",
  LOADING_HISTORY: "loading_history",
  READY: "ready",
  SENDING: "sending",
  ERROR: "error",
  SESSION_EXPIRED: "session_expired",
  UNAVAILABLE: "unavailable",
};

export function useEmbeddedChat(documentRecord) {
  const documentId = documentRecord?.id;
  const { locale: language } = useTranslation();
  const [chatState, setChatState] = useState(CHAT_STATE.IDLE);
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [draft, setDraft] = useState("");

  const abortRef = useRef(null);
  const sendInFlightRef = useRef(false);

  const available = isChatAvailableForDocument(documentRecord);

  const resetThread = useCallback(() => {
    setMessages([]);
    setErrorMessage(null);
    setDraft("");
  }, []);

  const loadHistory = useCallback(
    async (signal) => {
      if (!documentId || !available) {
        setChatState(CHAT_STATE.UNAVAILABLE);
        resetThread();
        return;
      }

      setChatState(CHAT_STATE.LOADING_HISTORY);
      setErrorMessage(null);

      try {
        const data = await fetchChatHistory(documentId, { limit: 50 }, signal);
        setMessages(mapHistoryToThread(data.items || []));
        setChatState(CHAT_STATE.READY);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
        if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
          setChatState(CHAT_STATE.SESSION_EXPIRED);
          resetThread();
          setErrorMessage(userFacingMessage(error, translateActive));
          return;
        }
        setChatState(CHAT_STATE.ERROR);
        setErrorMessage(userFacingMessage(error, translateActive));
      }
    },
    [available, documentId, resetThread]
  );

  useEffect(() => {
    abortRef.current?.abort();
    stopSpeaking();
    resetThread();

    if (!documentId) {
      setChatState(CHAT_STATE.UNAVAILABLE);
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    loadHistory(controller.signal);

    return () => controller.abort();
  }, [documentId, loadHistory, resetThread]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || !documentId || !available || sendInFlightRef.current) {
        return;
      }

      sendInFlightRef.current = true;
      setChatState(CHAT_STATE.SENDING);
      setErrorMessage(null);
      setDraft("");

      const optimisticUser = {
        id: `local-user-${Date.now()}`,
        role: "user",
        text: trimmed,
        language,
      };
      setMessages((prev) => [...prev, optimisticUser]);

      try {
        const data = await sendChatMessage({
          documentId,
          message: trimmed,
          language,
        });
        const assistant = mapAssistantResponse(data);
        setMessages((prev) => [...prev, assistant]);
        setChatState(CHAT_STATE.READY);
      } catch (error) {
        if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
          setChatState(CHAT_STATE.SESSION_EXPIRED);
          setErrorMessage(userFacingMessage(error, translateActive));
        } else {
          setChatState(CHAT_STATE.ERROR);
          setErrorMessage(userFacingMessage(error, translateActive));
        }
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      } finally {
        sendInFlightRef.current = false;
      }
    },
    [available, documentId, language]
  );

  const clearHistory = useCallback(async () => {
    if (!documentId) {
      return;
    }

    try {
      await deleteChatHistory(documentId);
      resetThread();
      setChatState(CHAT_STATE.READY);
    } catch (error) {
      setErrorMessage(userFacingMessage(error, translateActive));
    }
  }, [documentId, resetThread]);

  const retryLoad = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    loadHistory(controller.signal);
  }, [loadHistory]);

  return {
    language,
    chatState,
    messages,
    errorMessage,
    draft,
    setDraft,
    available,
    sendMessage,
    clearHistory,
    retryLoad,
  };
}
