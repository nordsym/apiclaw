exports.convexMutation = async (path, args) => {
  globalThis.__listingCalls.push({ path, args });
  if (globalThis.__listingFailure) throw Error('stale');
  return null;
};
exports.convexQuery = async () => ({ page: [], isDone: true });
