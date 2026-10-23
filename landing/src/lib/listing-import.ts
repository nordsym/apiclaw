import { parseDocument } from "yaml";
import {
  parseListingSpecWithDecoder,
  SPEC_LIMIT,
} from "../../../src/listing-spec";

export { SPEC_LIMIT };

export function parseListingSpec(text: string, sourceUrl?: string) {
  return parseListingSpecWithDecoder(text, sourceUrl, (source) => {
    const doc = parseDocument(source, { uniqueKeys: true });
    if (doc.errors.length) throw Error("Invalid JSON/YAML specification");
    return doc.toJS({ maxAliasCount: 0 });
  });
}
