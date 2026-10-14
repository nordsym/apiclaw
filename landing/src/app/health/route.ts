import { createServiceHealth } from "../../lib/service-health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(createServiceHealth(), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
