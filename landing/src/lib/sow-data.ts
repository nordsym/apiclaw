// APIClaw SOW customer configs — mirrors NordSym-Hemsida sow-data.js pattern

export interface SowSection {
  title: string;
  content?: string[];
  items?: { label: string; value: string }[];
  phases?: { name: string; desc: string }[];
  groups?: {
    label: string;
    apis: { name: string; status: "live" | "blocked" | "unavailable" }[];
  }[];
  note?: string;
}

export interface SowCustomer {
  customerName: string;
  customerRep: string;
  vertical: string;
  pricing: { fixed: number; nectar: string };
  paymentLink: string | null;
  partnerEmail: string;
  showDealRoom: boolean;
  sections: SowSection[];
}

export const SOW_CUSTOMERS: Record<string, SowCustomer> = {
  apilayer: {
    customerName: "APILayer / Zyla Labs Inc.",
    customerRep: "Pratham Shah",
    vertical: "API Infrastructure × Distribution — Joint Growth Framework",
    pricing: { fixed: 0, nectar: "Partnership — revenue share on volume" },
    paymentLink: null,
    partnerEmail: "pratham@apilayer.com",
    showDealRoom: true,
    sections: [
      {
        title: "1. Parties",
        content: [
          "<strong>APIClaw</strong> (operated by NordSym AB, org.nr 559535-5768), represented by Gustav Hemmingsson, CEO",
          "<strong>APILayer / Zyla Labs Inc.</strong>, represented by Pratham Shah",
        ],
      },
      {
        title: "2. Effective Date",
        content: [
          "This Partnership Agreement becomes effective upon digital signature by both parties. Execution begins immediately upon signing.",
        ],
      },
      {
        title: "3. Integration Status",
        groups: [
          {
            label: "Unified APILayer APIs — 10/14 live",
            apis: [
              { name: "Exchange Rates", status: "live" },
              { name: "Market Data", status: "live" },
              { name: "Aviation Data", status: "live" },
              { name: "PDF Generation", status: "live" },
              { name: "Screenshot", status: "live" },
              { name: "Email Verification", status: "live" },
              { name: "VAT Check", status: "live" },
              { name: "Finance News", status: "live" },
              { name: "Web Scrape", status: "live" },
              { name: "Skills & Jobs", status: "live" },
              { name: "Phone Verification", status: "blocked" },
              { name: "World News", status: "blocked" },
              { name: "Image Crop", status: "blocked" },
              { name: "Form Submit", status: "blocked" },
            ],
          },
          {
            label: "Legacy APILayer APIs — 13/15 integrated",
            apis: [
              { name: "Fixer", status: "live" },
              { name: "Currencylayer", status: "live" },
              { name: "Coinlayer", status: "live" },
              { name: "Exchangerate.host", status: "live" },
              { name: "Weatherstack", status: "live" },
              { name: "IPstack", status: "live" },
              { name: "IPapi", status: "live" },
              { name: "Positionstack", status: "live" },
              { name: "Languagelayer", status: "live" },
              { name: "Scrapestack", status: "live" },
              { name: "Serpstack", status: "live" },
              { name: "Mediastack", status: "live" },
              { name: "Userstack", status: "live" },
              { name: "Zenscrape", status: "unavailable" },
              { name: "Zenserp", status: "unavailable" },
            ],
          },
        ],
        note: "27 APIs live in Direct Call tier. 4 unified blocked by subscription tier — requires APILayer plan upgrade. 2 legacy unavailable at integration time.",
      },
      {
        title: "4. Partnership Scope",
        phases: [
          {
            name: "Customer announcement",
            desc: "APILayer communicates the APIClaw integration to its customer base. Customers gain zero-friction access to all 27 APIs through a single endpoint.",
          },
          {
            name: "Joint content",
            desc: "One blog post or case study published on apilayer.com showing how APIClaw makes APILayer APIs agent-ready for the AI era.",
          },
          {
            name: "Documentation feature",
            desc: "APIClaw referenced in APILayer documentation for all 27 APIs, giving developers a keyless access option.",
          },
          {
            name: "Volume incentives",
            desc: "Tiered discount or revenue share model tied to APIClaw-driven call volume. Structure to be agreed within 14 days of signing.",
          },
        ],
      },
      {
        title: "5. Partner Dashboard",
        content: [
          "APILayer receives access to the APIClaw Partner Dashboard upon signing. Dashboard includes real-time usage stats, discovery data, and call performance across all 27 APIs.",
        ],
      },
      {
        title: "6. Duration & Review",
        content: [
          "<strong>Initial term:</strong> 12 months from effective date.",
          "<strong>Week 1 checkpoint:</strong> Both parties review integration performance, usage data, and distribution execution.",
          "<strong>Renewal:</strong> Automatic month-to-month after initial term. 30 days written notice to terminate.",
        ],
      },
      {
        title: "7. Confidentiality",
        content: [
          "Both parties agree to keep commercial terms, usage data, and technical integration details confidential. Public announcements require mutual written approval.",
        ],
      },
      {
        title: "8. Standard Terms",
        content: [
          "<strong>IP:</strong> APIClaw infrastructure and APILayer APIs remain respective party IP. Joint content is co-owned.",
          "<strong>Liability:</strong> Neither party liable for indirect or consequential damages arising from API availability or performance.",
          "<strong>Governing Law:</strong> Swedish law. Disputes resolved through negotiation before arbitration.",
        ],
      },
    ],
  },
};
