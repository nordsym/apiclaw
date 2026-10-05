import { createRoot } from "react-dom/client";
import { WorkspaceCatalog } from "../../src/components/WorkspaceCatalog";
createRoot(document.getElementById("root")!).render(
  <WorkspaceCatalog sessionToken="st_listing_test_owner" />,
);
