import { USE_LOCAL_DATA } from "../api/config.js";
import { onAccessTokenClear } from "../session/accessTokenStore.js";
import { clearLocalDataStore } from "./localDataStore.js";

export function registerLocalSession() {
  if (!USE_LOCAL_DATA) {
    return;
  }
  onAccessTokenClear(() => {
    clearLocalDataStore();
  });
}
