import type { Storage as TenderlyStorage } from "@tenderly/actions";

import type { Storage } from "./storage";

export const tenderlyStorage = (storage: TenderlyStorage): Storage => ({
  get(key) {
    return storage.getStr(key);
  },

  put(key, value) {
    return storage.putStr(key, value);
  },

  delete(key) {
    return storage.delete(key);
  }
});
