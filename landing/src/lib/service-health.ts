import packageMetadata from "../../../package.json";

export const SERVICE_NAME = "apiclaw-gateway";
export const SERVICE_VERSION = packageMetadata.version;

export interface ServiceHealth {
  status: "ok";
  service: typeof SERVICE_NAME;
  version: string;
  timestamp: string;
}

export function createServiceHealth(now = new Date()): ServiceHealth {
  return {
    status: "ok",
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: now.toISOString(),
  };
}
