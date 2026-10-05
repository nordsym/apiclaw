import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { isListingOperator } from "@/lib/listing-review-auth";
import { ListingReviewQueue } from "./queue";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: { listing?: string };
}) {
  const user = await currentUser();
  if (!user)
    redirect(
      "/sign-in?redirect_url=" +
        encodeURIComponent(
          "/workspace/review-listings" +
            (searchParams.listing
              ? "?listing=" + encodeURIComponent(searchParams.listing)
              : ""),
        ),
    );
  if (!isListingOperator(user)) notFound();
  return <ListingReviewQueue listingId={searchParams.listing} />;
}
