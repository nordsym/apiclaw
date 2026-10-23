import { parseDocument } from "yaml";
import { parseListingSpecWithDecoder } from "../src/listing-spec.js";

export function parseListingSpec(text: string, sourceUrl?: string) {
  return parseListingSpecWithDecoder(text, sourceUrl, (source) => {
    const doc = parseDocument(source, { uniqueKeys: true });
    if (doc.errors.length) throw Error("Invalid JSON/YAML specification");
    return doc.toJS({ maxAliasCount: 0 });
  });
}
