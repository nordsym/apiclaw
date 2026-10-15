import BookForm from "./BookForm";

export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 3);
  return <BookForm initialEmail={typeof email === "string" ? email : ""} initialDate={date.toISOString().slice(0, 10)} />;
}
