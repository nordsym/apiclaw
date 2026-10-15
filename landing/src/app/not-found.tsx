import { SiteHeader } from "@/components/home/SiteHeader";

export default function NotFound() {
  return <main className="claw min-h-screen">
    <SiteHeader />
    <div className="claw-container py-24">
      <p className="claw-eyebrow">404</p>
      <h1 className="claw-display mt-4 text-4xl">Page not found</h1>
      <p className="claw-lede mt-5">This link does not lead to a page. Start again from APIClaw.</p>
      <a href="/" className="claw-btn claw-btn-solid mt-8">Go home</a>
    </div>
  </main>;
}
