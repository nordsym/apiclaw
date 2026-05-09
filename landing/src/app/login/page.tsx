import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = new URLSearchParams();

  const link = searchParams?.link;
  const ref = searchParams?.ref;
  const error = searchParams?.error;

  if (Array.isArray(link)) {
    if (link[0]) params.set("link", link[0]);
  } else if (link) {
    params.set("link", link);
  }

  if (Array.isArray(ref)) {
    if (ref[0]) params.set("ref", ref[0]);
  } else if (ref) {
    params.set("ref", ref);
  }

  if (Array.isArray(error)) {
    if (error[0]) params.set("error", error[0]);
  } else if (error) {
    params.set("error", error);
  }

  const query = params.toString();
  redirect(query ? `/sign-in?${query}` : "/sign-in");
}
