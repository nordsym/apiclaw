// Run this with: npx ts-node scripts/activate-hivr-workspace.ts
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://adventurous-avocet-799.convex.cloud");

async function main() {
  // The workspace ID for symbot@nordsym.com
  const workspaceId = "n172qdtk5zcss0mkz0yetecab182953p";
  
  // We need to use a direct mutation - but we don't have one for setting status
  // Let's send a magic link instead
  const result = await client.mutation("workspaces:createMagicLink", {
    email: "symbot@nordsym.com"
  });
  
  console.log("Magic link result:", result);
  console.log("\nGustav: Check your email (symbot@nordsym.com alias) and click the link to activate!");
}

main().catch(console.error);
