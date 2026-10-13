exports.convexMutation = async (path, args) => {
  globalThis.__listingCalls.push({ path, args });
  if (globalThis.__listingBackend) return globalThis.__listingBackend("mutation", path, args);
  if (globalThis.__listingFailure === 'structured') throw Object.assign(Error('[Request ID: fixture] Server Error'), { data: { code: 'LISTING_REVIEW_STALE' } });
  if (globalThis.__listingFailure) throw Error('stale');
  return null;
};
exports.convexQuery = async (path, args) => globalThis.__listingBackend ? globalThis.__listingBackend("query", path, args) : ({ page: [], isDone: true });
