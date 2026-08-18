import { ChatWidget } from "@/components/widget/chat-widget";
import { APP_NAME } from "@/lib/brand";

const PRODUCTS = [
  { name: "Aurora Headphones", price: "$129", detail: "Noise-cancelling wireless audio for travel and focus." },
  { name: "Northstar Desk Lamp", price: "$79", detail: "Adjustable warm light with a USB-C charging port." },
  { name: "Harbor Backpack", price: "$98", detail: "Everyday 16L carry with a padded 15-inch laptop sleeve." },
];

const PLANS = [
  { name: "Starter", price: "$12", detail: "For small teams getting started." },
  { name: "Growth", price: "$39", detail: "Live chat, tickets, and reporting." },
  { name: "Business", price: "$79", detail: "SSO, priority support, and SLAs." },
];

export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="font-semibold tracking-tight">{APP_NAME}</p>
          <nav className="hidden gap-6 text-sm text-slate-500 sm:flex">
            <a href="#home" className="hover:text-slate-900">Home</a>
            <a href="#products" className="hover:text-slate-900">Products</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#contact" className="hover:text-slate-900">Contact</a>
          </nav>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
            Customer website
          </span>
        </div>
      </header>

      <main id="home" className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-sm font-medium text-indigo-600">Help center</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
          How can we help you today?
        </h1>
        <p className="mt-4 max-w-xl text-slate-600">
          Track an order, update a payment method, or ask about your account.
          Use the chat button in the corner to talk with a {APP_NAME} agent.
        </p>

        <section id="products" className="mt-12">
          <h2 className="text-lg font-semibold">Popular products</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PRODUCTS.map((product) => (
              <article
                key={product.name}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
                <h3 className="font-medium">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{product.detail}</p>
                <p className="mt-3 text-sm font-semibold">{product.price}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-12">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <article key={plan.name} className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-indigo-600">{plan.name}</p>
                <p className="mt-2 text-2xl font-semibold">{plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                <p className="mt-2 text-sm text-slate-500">{plan.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-12 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-slate-600">
            Billing questions, shipping delays, and account access are handled in
            chat. An agent will reply from the {APP_NAME} workspace.
          </p>
          <p className="mt-3 text-sm text-slate-500">support@{APP_NAME.toLowerCase()}.example</p>
        </section>
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        Customer-facing demo store · Chat opens the live {APP_NAME} widget
      </footer>
      <ChatWidget />
    </div>
  );
}
