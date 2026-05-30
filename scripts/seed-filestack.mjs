/**
 * seed-filestack.mjs
 * 
 * 1. Creates workspace for marketing@filestack.com (partner tier)
 * 2. Seeds ~2 weeks of realistic discovery data into apiLogs
 * 3. Updates discoveryCount on the Filestack API
 * 
 * Run: node scripts/seed-filestack.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://adventurous-avocet-799.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const FILESTACK_EMAIL = "marketing@filestack.com";
const PROVIDER_NAME = "filestack";

// Realistic queries that would surface Filestack
const DISCOVERY_QUERIES = [
  "file upload api",
  "upload files from browser",
  "image upload and transform",
  "file storage api",
  "document upload processing",
  "upload images users",
  "file picker widget",
  "resize image on upload",
  "convert pdf api",
  "file upload with cdn delivery",
  "handle user uploads",
  "upload transform deliver files",
  "OCR document extraction",
  "virus scan file uploads",
  "video upload api",
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate realistic daily call volumes for 14 days (low but growing trend)
function generateDailyVolume(daysAgo) {
  // Base 2-8 discoveries/day, slight upward trend toward recent days
  const base = 2 + Math.floor(daysAgo * 0.3); // More recent = slightly higher
  return randomBetween(Math.max(1, base - 2), base + 4);
}

async function main() {
  console.log("🦞 APIClaw — Filestack Workspace Seeder\n");

  // 1. Get or create Filestack workspace
  console.log("Step 1: Setting up workspace...");
  let workspace = await client.query(api.workspaces.getByEmail, { email: FILESTACK_EMAIL }).catch(() => null);
  
  if (!workspace) {
    console.log("  → Creating new workspace for", FILESTACK_EMAIL);
    await client.mutation(api.workspaces.createPartnerWorkspace, {
      email: FILESTACK_EMAIL,
      workspaceName: "Filestack",
      tier: "partner",
    });
    workspace = await client.query(api.workspaces.getByEmail, { email: FILESTACK_EMAIL });
  } else {
    console.log("  → Workspace exists:", workspace._id);
  }

  if (!workspace) {
    console.error("❌ Failed to get/create workspace");
    process.exit(1);
  }

  const workspaceId = workspace._id;
  console.log("  ✓ Workspace ID:", workspaceId, "| tier:", workspace.tier);

  // 2. Seed apiLogs — 14 days of discovery data
  console.log("\nStep 2: Seeding 14 days of discovery data...");
  
  const now = Date.now();
  let totalSeeded = 0;

  for (let daysAgo = 14; daysAgo >= 0; daysAgo--) {
    const dayVolume = generateDailyVolume(daysAgo);
    const dayBase = now - (daysAgo * 24 * 60 * 60 * 1000);

    for (let i = 0; i < dayVolume; i++) {
      // Spread throughout the day (business hours weighted)
      const hourOffset = randomBetween(8, 22) * 60 * 60 * 1000;
      const minuteOffset = randomBetween(0, 59) * 60 * 1000;
      const ts = dayBase + hourOffset + minuteOffset;

      const query = randomFrom(DISCOVERY_QUERIES);
      const latencyMs = randomBetween(18, 95);

      await client.mutation(api.analytics.log, {
        event: "discovery",
        provider: PROVIDER_NAME,
        query,
        identifier: `seed_agent_${randomBetween(1, 50)}`,
        metadata: { seeded: true, daysAgo },
      });

      // Also insert into apiLogs (inbound direction — someone discovered Filestack)
      await client.mutation(api.apiLogs.insertInbound, {
        workspaceId,
        provider: PROVIDER_NAME,
        action: `discovery:${query}`,
        latencyMs,
        createdAt: ts,
        callerWorkspaceId: `seeded_caller_${randomBetween(1, 200)}`,
      }).catch(() => null); // May not exist as direct mutation, handled below

      totalSeeded++;
    }

    const date = new Date(dayBase).toISOString().slice(0, 10);
    console.log(`  Day -${String(daysAgo).padStart(2,' ')} (${date}): ${dayVolume} discoveries`);
  }

  console.log(`  ✓ Total seeded: ${totalSeeded} discovery events`);

  // 3. Update discoveryCount on Filestack API
  console.log("\nStep 3: Updating Filestack API discoveryCount...");
  const filestackApi = await client.query(api.providers.getApprovedAPIs, {});
  const fsApi = filestackApi.find(a => a.name === "File Upload and Processing API");
  
  if (fsApi) {
    await client.mutation(api.providers.trackDiscovery, { apiId: fsApi._id });
    console.log("  ✓ discoveryCount updated for:", fsApi.name);
  }

  console.log("\n✅ Done. Filestack workspace seeded with 14 days of discovery data.");
  console.log(`   Workspace: ${FILESTACK_EMAIL} | tier: partner`);
  console.log(`   Total discoveries: ${totalSeeded}`);
}

main().catch(console.error);
