import { createRoot } from "react-dom/client";
import { ListingReviewQueue } from "../../src/app/workspace/review-listings/queue";
import { WorkspaceCatalog } from "../../src/components/WorkspaceCatalog";
createRoot(document.getElementById("root")!).render(
  location.pathname === "/review" ? (
    <ListingReviewQueue
      listingId={
        new URLSearchParams(location.search).get("listing") ?? undefined
      }
    />
  ) : (
    <WorkspaceCatalog sessionToken="st_listing_test_owner" />
  ),
);
