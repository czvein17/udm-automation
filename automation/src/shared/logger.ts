export function makeLogger(runId: string) {
  return {
    info: (...args: any[]) => {
      const msg = args.map(String).join(" ");
      console.log(msg);
      // later: appendLog(runId, msg)
    },
    error: (...args: any[]) => {
      const msg = args.map(String).join(" ");
      console.error(msg);
      // later: appendLog(runId, msg)
    },
  };
}
