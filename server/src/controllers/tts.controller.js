import { synthesizeRapidApiSpeech } from "../services/rapidApiTts.service.js";

export async function postTtsSpeak(req, res, next) {
  try {
    const config = req.app.get("config");
    const { text, language, voice } = req.body;
    const { buffer, contentType } = await synthesizeRapidApiSpeech(
      { text, language, voice },
      config
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
}
