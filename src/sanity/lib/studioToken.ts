type StudioClient = {
  config: () => { token?: unknown };
};

export async function resolveStudioToken(client: StudioClient): Promise<string | undefined> {
  const configured = client.config().token;
  const value = typeof configured === "function" ? await configured() : configured;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
