import { DEMO_AGENTS } from "@/lib/constants";
import type {
  AppActivity,
  AppConversation,
  AppCustomer,
  AppCustomerTag,
  AppDatabase,
  AppMessage,
  AppNote,
  AppNotification,
  AppTicket,
} from "@/lib/local-db/types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSeedDatabase(): AppDatabase {
  const users = DEMO_AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    role: agent.role,
    status: agent.status,
  }));

  const alex = "user_alex";
  const sarah = "user_sarah";
  const david = "user_david";

  const customers: AppCustomer[] = (
    [
    ["cust_john", "John Smith", "john@example.com", "+1 415 555 0182", "ABC Technologies", "ACTIVE", 240],
    ["cust_priya", "Priya Sharma", "priya@example.com", "+91 98765 44120", "TechNova", "ACTIVE", 220],
    ["cust_rahul", "Rahul Mehta", "rahul@example.com", "+91 98200 11844", "CloudWorks", "ACTIVE", 200],
    ["cust_emily", "Emily Davis", "emily@example.com", "+1 646 555 0137", "Bright Solutions", "ACTIVE", 180],
    ["cust_michael", "Michael Brown", "michael@example.com", "+1 312 555 0176", "Acme Corp", "ACTIVE", 170],
    ["cust_aisha", "Aisha Khan", "aisha.khan@northwind.io", "+971 50 123 8841", "Northwind Analytics", "ACTIVE", 160],
    ["cust_james", "James Wilson", "james.wilson@pixelgrid.com", "+44 20 7946 0991", "PixelGrid", "ACTIVE", 150],
    ["cust_sofia", "Sofia Rossi", "sofia.rossi@lumenlab.eu", "+39 02 555 4410", "LumenLab", "ACTIVE", 140],
    ["cust_chen", "Chen Wei", "chen.wei@orbitpay.asia", "+65 8123 4409", "OrbitPay", "ACTIVE", 130],
    ["cust_olivia", "Olivia Martinez", "olivia.martinez@harborops.com", "+1 206 555 0108", "HarborOps", "ACTIVE", 120],
    ["cust_daniel", "Daniel Park", "daniel.park@stackline.kr", "+82 10 5552 1180", "Stackline", "ACTIVE", 110],
    ["cust_fatima", "Fatima Ali", "fatima.ali@greenfield.ae", "+971 55 442 1903", "Greenfield Retail", "INACTIVE", 100],
    ["cust_lucas", "Lucas Bernard", "lucas.bernard@atelier.io", "+33 1 42 68 5300", "Atelier Cloud", "ACTIVE", 90],
    ["cust_nina", "Nina Patel", "nina.patel@kairosoft.in", "+91 99001 22876", "KairoSoft", "ACTIVE", 80],
    ["cust_tom", "Tom Hughes", "tom.hughes@northbridge.co", "+1 617 555 0194", "Northbridge", "ACTIVE", 70],
    ["cust_hannah", "Hannah Lee", "hannah.lee@brightpath.edu", "+1 503 555 0122", "BrightPath Education", "ACTIVE", 60],
    ["cust_carlos", "Carlos Rivera", "carlos.rivera@mesa.digital", "+52 55 1200 8844", "Mesa Digital", "ACTIVE", 50],
    ["cust_mei", "Mei Tanaka", "mei.tanaka@sakuraops.jp", "+81 3 5550 2219", "SakuraOps", "ACTIVE", 40],
    ["cust_oliver", "Oliver Grant", "oliver.grant@summitlegal.com", "+44 161 496 0288", "Summit Legal", "INACTIVE", 30],
    ["cust_ananya", "Ananya Reddy", "ananya.reddy@helixhealth.in", "+91 98450 77321", "Helix Health", "ACTIVE", 20],
  ] as const).map(([id, name, email, phone, company, status, hours]) => ({
    id,
    name,
    email,
    phone,
    company,
    avatar: null,
    status,
    createdAt: hoursAgo(hours),
    updatedAt: hoursAgo(hours / 8),
  }));

  const tags = [
    "VIP",
    "Enterprise",
    "Billing",
    "Onboarding",
    "At Risk",
    "New",
    "Partner",
    "Trial",
    "Premium",
    "Technical",
    "Shipping",
    "Churn Risk",
    "Payment Issue",
    "Returning Customer",
  ].map((name, index) => ({ id: `tag_${index + 1}`, name }));

  const tagId = Object.fromEntries(tags.map((tag) => [tag.name, tag.id]));

  const customerTags: AppCustomerTag[] = [
    ["cust_john", "Enterprise"],
    ["cust_john", "Billing"],
    ["cust_john", "Payment Issue"],
    ["cust_priya", "VIP"],
    ["cust_priya", "Technical"],
    ["cust_priya", "Returning Customer"],
    ["cust_rahul", "Shipping"],
    ["cust_emily", "Premium"],
    ["cust_michael", "Onboarding"],
    ["cust_aisha", "Enterprise"],
    ["cust_aisha", "Technical"],
    ["cust_james", "Billing"],
    ["cust_sofia", "New"],
    ["cust_chen", "VIP"],
    ["cust_olivia", "Technical"],
    ["cust_daniel", "Trial"],
    ["cust_fatima", "Churn Risk"],
    ["cust_lucas", "Partner"],
    ["cust_nina", "Onboarding"],
    ["cust_tom", "Premium"],
    ["cust_hannah", "New"],
    ["cust_ananya", "At Risk"],
  ].map(([customerId, name]) => ({ customerId, tagId: tagId[name] }));

  const conversationSeeds: {
    id: string;
    customerId: string;
    assignedAgentId: string;
    status: "OPEN" | "CLOSED";
    created: number;
    messages: { senderType: "AGENT" | "CUSTOMER"; senderId: string; content: string; hoursAgo: number; read: boolean }[];
  }[] = [
    {
      id: "conv_payment",
      customerId: "cust_john",
      assignedAgentId: alex,
      status: "OPEN",
      created: 6,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_john", content: "Hi, my payment failed when I tried to renew our annual plan. The card was charged but the workspace is still showing past due.", hoursAgo: 6, read: true },
        { senderType: "AGENT", senderId: alex, content: "Thanks for flagging this, John. I can see a declined retry on the Visa ending 4242. I am checking the processor log now.", hoursAgo: 5.7, read: true },
        { senderType: "CUSTOMER", senderId: "cust_john", content: "We also received a duplicate invoice email. Can you reverse the extra charge if it went through?", hoursAgo: 1.2, read: false },
      ],
    },
    {
      id: "conv_password",
      customerId: "cust_priya",
      assignedAgentId: sarah,
      status: "OPEN",
      created: 8,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_priya", content: "I cannot reset my password. The reset email never arrives and I am locked out of the admin console.", hoursAgo: 8, read: true },
        { senderType: "AGENT", senderId: sarah, content: "I found the reset emails going to spam for TechNova. I just triggered a fresh link and added your domain to the allowlist.", hoursAgo: 7.5, read: true },
        { senderType: "CUSTOMER", senderId: "cust_priya", content: "Got it, thank you. The link works now but it is asking for an old backup code.", hoursAgo: 0.8, read: false },
      ],
    },
    {
      id: "conv_order",
      customerId: "cust_rahul",
      assignedAgentId: david,
      status: "OPEN",
      created: 30,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_rahul", content: "Our hardware kit still has not arrived. Tracking has been stuck in customs for five days.", hoursAgo: 30, read: true },
        { senderType: "AGENT", senderId: david, content: "I opened a shipping investigation with the carrier. I will send you an updated ETA as soon as they respond.", hoursAgo: 28, read: true },
        { senderType: "CUSTOMER", senderId: "cust_rahul", content: "Customs asked for a commercial invoice copy. Can you send that today?", hoursAgo: 26, read: true },
      ],
    },
    {
      id: "conv_subscription",
      customerId: "cust_emily",
      assignedAgentId: sarah,
      status: "OPEN",
      created: 12,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_emily", content: "Need help changing my subscription from Team to Business before our next billing date.", hoursAgo: 12, read: true },
        { senderType: "AGENT", senderId: sarah, content: "I can do a mid-cycle upgrade and prorate the difference. Do you want annual billing kept in place?", hoursAgo: 11.4, read: true },
        { senderType: "CUSTOMER", senderId: "cust_emily", content: "Yes, keep annual billing. Please apply the partner discount if it is still valid.", hoursAgo: 3, read: false },
      ],
    },
    {
      id: "conv_verification",
      customerId: "cust_michael",
      assignedAgentId: alex,
      status: "OPEN",
      created: 4,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_michael", content: "Account verification is stuck on 'documents under review' even though we uploaded everything yesterday.", hoursAgo: 4, read: true },
        { senderType: "AGENT", senderId: alex, content: "The business license image is cropped. If you resend a full-page PDF I can push this through compliance today.", hoursAgo: 3.5, read: true },
        { senderType: "CUSTOMER", senderId: "cust_michael", content: "Just uploaded the full PDF. Please let me know when compliance has it.", hoursAgo: 3.1, read: true },
      ],
    },
    {
      id: "conv_api",
      customerId: "cust_aisha",
      assignedAgentId: david,
      status: "OPEN",
      created: 2,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_aisha", content: "Our webhook endpoint started returning 401 after the key rotation. Production jobs are backing up.", hoursAgo: 2, read: false },
        { senderType: "AGENT", senderId: david, content: "I rotated a replacement signing secret and posted it in the secure note. Please update the collector and retry the failed jobs.", hoursAgo: 1.7, read: true },
        { senderType: "CUSTOMER", senderId: "cust_aisha", content: "Updated. The 401s stopped, but a handful of events from the last hour are still missing.", hoursAgo: 1.4, read: false },
      ],
    },
    {
      id: "conv_refund",
      customerId: "cust_james",
      assignedAgentId: sarah,
      status: "CLOSED",
      created: 50,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_james", content: "We were charged twice for March. Please refund the duplicate payment.", hoursAgo: 50, read: true },
        { senderType: "AGENT", senderId: sarah, content: "Confirmed the duplicate capture. I issued a refund of $249 and it should appear in 3-5 business days.", hoursAgo: 48, read: true },
        { senderType: "CUSTOMER", senderId: "cust_james", content: "Perfect, thank you. Closing this on our side.", hoursAgo: 47, read: true },
      ],
    },
    {
      id: "conv_2fa",
      customerId: "cust_sofia",
      assignedAgentId: alex,
      status: "CLOSED",
      created: 70,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_sofia", content: "I cannot enable two-factor authentication. The QR code never appears.", hoursAgo: 70, read: true },
        { senderType: "AGENT", senderId: alex, content: "This was a known issue with Safari 17. After the patch, 2FA should render. Can you try Chrome once?", hoursAgo: 69, read: true },
        { senderType: "CUSTOMER", senderId: "cust_sofia", content: "That worked. Thanks for the workaround.", hoursAgo: 68, read: true },
      ],
    },
    {
      id: "conv_invoice",
      customerId: "cust_chen",
      assignedAgentId: david,
      status: "OPEN",
      created: 18,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_chen", content: "Our finance team never received the March invoice. Can you resend it with VAT included?", hoursAgo: 18, read: true },
        { senderType: "AGENT", senderId: david, content: "I regenerated the invoice with your GST number and sent it to finance@orbitpay.asia.", hoursAgo: 16, read: true },
        { senderType: "CUSTOMER", senderId: "cust_chen", content: "Finance confirmed they received it. Thank you.", hoursAgo: 15, read: true },
      ],
    },
    {
      id: "conv_dashboard",
      customerId: "cust_olivia",
      assignedAgentId: sarah,
      status: "OPEN",
      created: 9,
      messages: [
        { senderType: "CUSTOMER", senderId: "cust_olivia", content: "The analytics dashboard is loading very slowly this morning, especially the live visitors widget.", hoursAgo: 9, read: true },
        { senderType: "AGENT", senderId: sarah, content: "We are seeing elevated query times on the US-West replica. I have opened an incident and will update you shortly.", hoursAgo: 8.4, read: true },
        { senderType: "CUSTOMER", senderId: "cust_olivia", content: "It is still spinning after 20 seconds. Our ops team is waiting on this for a standup.", hoursAgo: 0.4, read: false },
      ],
    },
  ];

  const conversations: AppConversation[] = [];
  const messages: AppMessage[] = [];
  for (const item of conversationSeeds) {
    const last = item.messages[item.messages.length - 1];
    conversations.push({
      id: item.id,
      customerId: item.customerId,
      assignedAgentId: item.assignedAgentId,
      status: item.status,
      createdAt: hoursAgo(item.created),
      updatedAt: hoursAgo(last.hoursAgo),
    });
    for (const message of item.messages) {
      messages.push({
        id: id("msg"),
        conversationId: item.id,
        senderType: message.senderType,
        senderId: message.senderId,
        content: message.content,
        read: message.read,
        createdAt: hoursAgo(message.hoursAgo),
      });
    }
  }

  const tickets: AppTicket[] = [
    ["ticket-1041", "SH-1041", "cust_john", "conv_payment", alex, "Payment failed on annual renewal", "Customer reports a failed renewal. Card may have been captured while workspace still shows past due.", "URGENT", "IN_PROGRESS", 6, 1.2],
    ["ticket-1042", "SH-1042", "cust_priya", "conv_password", sarah, "Cannot reset password", "Reset emails were not arriving. Backup codes are now blocking the new password flow.", "HIGH", "OPEN", 8, 0.8],
    ["ticket-1043", "SH-1043", "cust_rahul", "conv_order", david, "Order has not arrived", "Hardware kit stuck in customs. Carrier investigation opened.", "MEDIUM", "PENDING", 30, 28],
    ["ticket-1044", "SH-1044", "cust_emily", "conv_subscription", sarah, "Need help changing my subscription", "Upgrade from Team to Business with annual billing and partner discount.", "MEDIUM", "IN_PROGRESS", 12, 3],
    ["ticket-1045", "SH-1045", "cust_michael", "conv_verification", alex, "Account verification problem", "KYC review stalled because the uploaded license is cropped.", "HIGH", "PENDING", 4, 3.5],
    ["ticket-1046", "SH-1046", "cust_aisha", "conv_api", david, "Webhook authentication failing after key rotation", "Production webhooks return 401. Jobs are backing up since the secret rotation.", "URGENT", "OPEN", 2, 2],
    ["ticket-1047", "SH-1047", "cust_james", "conv_refund", sarah, "Duplicate March charge refund", "Duplicate capture of $249 refunded. Customer confirmed.", "LOW", "RESOLVED", 50, 47],
    ["ticket-1048", "SH-1048", "cust_sofia", "conv_2fa", alex, "Two-factor setup QR code missing", "Safari rendering issue. Workaround provided and verified.", "MEDIUM", "RESOLVED", 70, 68],
    ["ticket-1049", "SH-1049", "cust_chen", "conv_invoice", david, "Missing March invoice", "Invoice regenerated with VAT/GST details and resent to finance.", "LOW", "PENDING", 18, 16],
    ["ticket-1050", "SH-1050", "cust_olivia", "conv_dashboard", sarah, "Dashboard loading slowly", "Analytics dashboard latency on US-West replica. Incident in progress.", "HIGH", "IN_PROGRESS", 9, 0.4],
    ["ticket-1051", "SH-1051", "cust_daniel", null, david, "Trial workspace hitting rate limits", "Trial account is hitting API rate limits during a proof of concept.", "MEDIUM", "OPEN", 15, 14],
    ["ticket-1052", "SH-1052", "cust_nina", null, sarah, "Onboarding checklist not completing", "Customer cannot mark DNS verification as complete in the onboarding wizard.", "MEDIUM", "IN_PROGRESS", 22, 10],
    ["ticket-1053", "SH-1053", "cust_tom", null, alex, "SSO login loop with Okta", "Okta SSO redirects back to the login screen after a successful assertion.", "HIGH", "OPEN", 11, 7],
    ["ticket-1054", "SH-1054", "cust_ananya", null, david, "PHI export delayed", "Helix Health needs a data export for an audit. Current job is stuck at 62%.", "URGENT", "PENDING", 13, 5],
    ["ticket-1055", "SH-1055", "cust_lucas", null, sarah, "Partner sandbox credentials expired", "Partner sandbox keys expired last night. Requesting rotation and a 30-day extension.", "LOW", "RESOLVED", 40, 36],
  ].map((row) => ({
    id: String(row[0]),
    ticketNumber: String(row[1]),
    customerId: String(row[2]),
    conversationId: row[3] ? String(row[3]) : null,
    assignedAgentId: String(row[4]),
    subject: String(row[5]),
    description: String(row[6]),
    priority: row[7] as AppTicket["priority"],
    status: row[8] as AppTicket["status"],
    createdAt: hoursAgo(Number(row[9])),
    updatedAt: hoursAgo(Number(row[10])),
  }));

  const notes: AppNote[] = (
    [
    ["cust_john", alex, "Finance contact prefers email over chat. Confirm any refund with their AP team before issuing it.", 20],
    ["cust_priya", sarah, "VIP account. Escalations should skip L1 and come directly to me or Alex.", 16],
    ["cust_rahul", david, "Warehouse confirmed the kit left Singapore on Friday. Customs hold is in Mumbai.", 26],
    ["cust_emily", sarah, "Partner discount is 15% and valid through the end of the quarter.", 10],
    ["cust_michael", alex, "Compliance needs a full-page business license PDF, not a cropped photo.", 3],
    ["cust_aisha", david, "Enterprise contract includes a 15-minute incident response SLA for production API issues.", 1.5],
    ["cust_olivia", sarah, "Customer is presenting to leadership today. Treat dashboard latency as a high-visibility issue.", 8],
    ["cust_chen", david, "OrbitPay billing entity is in Singapore. Always include GST on invoices.", 17],
    ["cust_ananya", alex, "Health-tech customer. Do not use production data in screenshots or internal notes.", 12],
    ["cust_fatima", sarah, "Inactive after trial ended. Worth a win-back call if they return through the widget.", 90],
    ["cust_tom", alex, "Okta ACS URL was updated last week. Likely related to the SSO loop.", 9],
  ] as const).map(([customerId, authorId, content, hours]) => ({
    id: id("note"),
    customerId,
    authorId,
    content,
    createdAt: hoursAgo(hours),
    updatedAt: hoursAgo(hours),
  }));

  const notifications: AppNotification[] = [
    { userId: alex, type: "conversation", title: "New customer message", message: "We also received a duplicate invoice email.", href: "/chat?conversation=conv_payment", read: false, createdAt: hoursAgo(1.2) },
    { userId: alex, type: "ticket", title: "Ticket assigned", message: "SH-1041 Payment failed on annual renewal needs an update.", href: "/tickets/ticket-1041", read: false, createdAt: hoursAgo(2) },
    { userId: alex, type: "ticket", title: "New ticket", message: "Tom Hughes reported an Okta login loop on SH-1053.", href: "/tickets/ticket-1053", read: true, createdAt: hoursAgo(7) },
    { userId: sarah, type: "conversation", title: "New customer message", message: "The reset link works now but it is asking for an old backup code.", href: "/chat?conversation=conv_password", read: false, createdAt: hoursAgo(0.8) },
    { userId: sarah, type: "conversation", title: "New customer message", message: "The dashboard is still spinning after 20 seconds.", href: "/chat?conversation=conv_dashboard", read: false, createdAt: hoursAgo(0.4) },
    { userId: david, type: "conversation", title: "New customer message", message: "Webhook endpoint started returning 401 after the key rotation.", href: "/chat?conversation=conv_api", read: false, createdAt: hoursAgo(2) },
    { userId: david, type: "ticket", title: "Ticket status update", message: "SH-1054 PHI export is still stuck at 62%.", href: "/tickets/ticket-1054", read: false, createdAt: hoursAgo(5) },
  ].map((item) => ({ ...item, id: id("ntf") }));

  const activities: AppActivity[] = [
    { customerId: "cust_john", actorId: alex, type: "ticket.status_changed", title: "Ticket status changed", message: "Ticket status changed to In Progress", href: "/tickets/ticket-1041", ticketId: "ticket-1041", conversationId: "conv_payment", createdAt: hoursAgo(1.2) },
    { customerId: "cust_john", actorId: alex, type: "tag.added", title: "Tag added", message: "Payment Issue was added to John Smith.", href: "/customers/cust_john", ticketId: null, conversationId: null, createdAt: hoursAgo(19) },
    { customerId: "cust_emily", actorId: sarah, type: "ticket.status_changed", title: "Ticket status changed", message: "Ticket status changed to In Progress", href: "/tickets/ticket-1044", ticketId: "ticket-1044", conversationId: "conv_subscription", createdAt: hoursAgo(11) },
    { customerId: "cust_james", actorId: sarah, type: "ticket.status_changed", title: "Ticket status changed", message: "Ticket status changed to Resolved", href: "/tickets/ticket-1047", ticketId: "ticket-1047", conversationId: "conv_refund", createdAt: hoursAgo(47) },
  ].map((item) => ({ ...item, id: id("act") }));

  return {
    users,
    customers,
    conversations,
    messages,
    tickets,
    notes,
    tags,
    customerTags,
    notifications,
    activities,
    onlineCustomerIds: [],
    typing: null,
  };
}
