export const logAuthEvent = (event, details = {}) => {
  console.log(
    JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
};
