let controller = null;

export const createAbortController = () => {
  controller = new AbortController();
  return controller;
};

export const getAbortSignal = () => {
  if (!controller) {
    controller = new AbortController();
  }
  return controller.signal;
};

export const abortDeepSeekRequest = () => {
  if (controller) {
    controller.abort();
    console.log('[DeepSeek] Prompt request aborted.');
  }
};
