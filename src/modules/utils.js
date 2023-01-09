export const log = (msg) => {
  if (import.meta.env.VITE_ENV === 'production') {
    return;
  }

  console.log(msg);
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
