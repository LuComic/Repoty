export type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
  verbose: boolean;
};

export function createLogger(verbose = false, silent = false): Logger {
  return {
    verbose,
    info: (message) => {
      if (!silent) console.error(message);
    },
    warn: (message) => {
      if (!silent) console.warn(message);
    },
    error: (message) => {
      if (!silent) console.error(message);
    },
    debug: (message) => {
      if (verbose && !silent) console.error(message);
    },
  };
}
