export function isListingOperator(
  user: {
    emailAddresses: Array<{
      emailAddress: string;
      verification: { status: string } | null;
    }>;
  } | null,
) {
  return !!user?.emailAddresses.some(
    (e) =>
      e.emailAddress.toLowerCase() === "gustav@nordsym.com" &&
      e.verification?.status === "verified",
  );
}
