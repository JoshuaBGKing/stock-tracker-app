type WorkflowEnvironment = {
  NODE_ENV?: string;
  ENABLE_INNGEST_DEV?: string;
};

// These preview jobs have no production delivery implementation. Never expose
// an unsigned development handler through `next start`, even with the flag set.
export function localWorkflowsEnabled(env: WorkflowEnvironment = process.env) {
  return env.NODE_ENV === "development" && env.ENABLE_INNGEST_DEV !== "false";
}
