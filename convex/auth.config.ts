// Clerk JWT identity for Convex.
// Domain comes from CLERK_JWT_ISSUER_DOMAIN (set via `npx convex env set --prod`).
// In dev: https://superb-sparrow-46.clerk.accounts.dev
// In prod: https://clerk.apiclaw.cloud (after custom domain is configured)
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
