export function createLogger(output = console) {
  const write = (level) => (message) => output[level](`[${new Date().toISOString()}] ${message}`);
  return Object.freeze({ info: write('info'), warn: write('warn'), error: write('error') });
}
