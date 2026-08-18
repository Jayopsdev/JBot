import {
  ConversationStatus,
  CustomerStatus,
  PrismaClient,
  SenderType,
  TicketPriority,
  TicketStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo123!";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.note.deleteMany();
  await prisma.customerTag.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [alex, sarah, david] = await Promise.all([
    prisma.user.create({
      data: {
        id: "user_alex",
        name: "Alex Johnson",
        email: "alex@supporthub.local",
        password,
        role: UserRole.ADMIN,
        status: UserStatus.ONLINE,
      },
    }),
    prisma.user.create({
      data: {
        id: "user_sarah",
        name: "Sarah Williams",
        email: "sarah@supporthub.local",
        password,
        role: UserRole.AGENT,
        status: UserStatus.ONLINE,
      },
    }),
    prisma.user.create({
      data: {
        id: "user_david",
        name: "David Kumar",
        email: "david@supporthub.local",
        password,
        role: UserRole.AGENT,
        status: UserStatus.AWAY,
      },
    }),
  ]);

  const tagRecords = await Promise.all(
    [
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
    ].map((name, index) =>
      prisma.tag.create({
        data: { id: `tag_${index + 1}`, name },
      }),
    ),
  );

  const tag = Object.fromEntries(tagRecords.map((item) => [item.name, item.id]));

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: "cust_john",
        name: "John Smith",
        email: "john@example.com",
        phone: "+1 415 555 0182",
        company: "ABC Technologies",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(240),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_priya",
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "+91 98765 44120",
        company: "TechNova",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(220),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_rahul",
        name: "Rahul Mehta",
        email: "rahul@example.com",
        phone: "+91 98200 11844",
        company: "CloudWorks",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(200),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_emily",
        name: "Emily Davis",
        email: "emily@example.com",
        phone: "+1 646 555 0137",
        company: "Bright Solutions",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(180),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_michael",
        name: "Michael Brown",
        email: "michael@example.com",
        phone: "+1 312 555 0176",
        company: "Acme Corp",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(170),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_aisha",
        name: "Aisha Khan",
        email: "aisha.khan@northwind.io",
        phone: "+971 50 123 8841",
        company: "Northwind Analytics",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(160),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_james",
        name: "James Wilson",
        email: "james.wilson@pixelgrid.com",
        phone: "+44 20 7946 0991",
        company: "PixelGrid",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(150),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_sofia",
        name: "Sofia Rossi",
        email: "sofia.rossi@lumenlab.eu",
        phone: "+39 02 555 4410",
        company: "LumenLab",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(140),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_chen",
        name: "Chen Wei",
        email: "chen.wei@orbitpay.asia",
        phone: "+65 8123 4409",
        company: "OrbitPay",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(130),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_olivia",
        name: "Olivia Martinez",
        email: "olivia.martinez@harborops.com",
        phone: "+1 206 555 0108",
        company: "HarborOps",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(120),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_daniel",
        name: "Daniel Park",
        email: "daniel.park@stackline.kr",
        phone: "+82 10 5552 1180",
        company: "Stackline",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(110),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_fatima",
        name: "Fatima Ali",
        email: "fatima.ali@greenfield.ae",
        phone: "+971 55 442 1903",
        company: "Greenfield Retail",
        status: CustomerStatus.INACTIVE,
        createdAt: hoursAgo(100),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_lucas",
        name: "Lucas Bernard",
        email: "lucas.bernard@atelier.io",
        phone: "+33 1 42 68 5300",
        company: "Atelier Cloud",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(90),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_nina",
        name: "Nina Patel",
        email: "nina.patel@kairosoft.in",
        phone: "+91 99001 22876",
        company: "KairoSoft",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(80),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_tom",
        name: "Tom Hughes",
        email: "tom.hughes@northbridge.co",
        phone: "+1 617 555 0194",
        company: "Northbridge",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(70),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_hannah",
        name: "Hannah Lee",
        email: "hannah.lee@brightpath.edu",
        phone: "+1 503 555 0122",
        company: "BrightPath Education",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(60),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_carlos",
        name: "Carlos Rivera",
        email: "carlos.rivera@mesa.digital",
        phone: "+52 55 1200 8844",
        company: "Mesa Digital",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(50),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_mei",
        name: "Mei Tanaka",
        email: "mei.tanaka@sakuraops.jp",
        phone: "+81 3 5550 2219",
        company: "SakuraOps",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(40),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_oliver",
        name: "Oliver Grant",
        email: "oliver.grant@summitlegal.com",
        phone: "+44 161 496 0288",
        company: "Summit Legal",
        status: CustomerStatus.INACTIVE,
        createdAt: hoursAgo(30),
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust_ananya",
        name: "Ananya Reddy",
        email: "ananya.reddy@helixhealth.in",
        phone: "+91 98450 77321",
        company: "Helix Health",
        status: CustomerStatus.ACTIVE,
        createdAt: hoursAgo(20),
      },
    }),
  ]);

  const customerById = Object.fromEntries(customers.map((item) => [item.id, item]));

  await prisma.customerTag.createMany({
    data: [
      { customerId: "cust_john", tagId: tag.Enterprise },
      { customerId: "cust_john", tagId: tag.Billing },
      { customerId: "cust_john", tagId: tag["Payment Issue"] },
      { customerId: "cust_priya", tagId: tag.VIP },
      { customerId: "cust_priya", tagId: tag.Technical },
      { customerId: "cust_priya", tagId: tag["Returning Customer"] },
      { customerId: "cust_rahul", tagId: tag.Shipping },
      { customerId: "cust_emily", tagId: tag.Premium },
      { customerId: "cust_michael", tagId: tag.Onboarding },
      { customerId: "cust_aisha", tagId: tag.Enterprise },
      { customerId: "cust_aisha", tagId: tag.Technical },
      { customerId: "cust_james", tagId: tag.Billing },
      { customerId: "cust_sofia", tagId: tag.New },
      { customerId: "cust_chen", tagId: tag.VIP },
      { customerId: "cust_olivia", tagId: tag.Technical },
      { customerId: "cust_daniel", tagId: tag.Trial },
      { customerId: "cust_fatima", tagId: tag["Churn Risk"] },
      { customerId: "cust_lucas", tagId: tag.Partner },
      { customerId: "cust_nina", tagId: tag.Onboarding },
      { customerId: "cust_tom", tagId: tag.Premium },
      { customerId: "cust_hannah", tagId: tag.New },
      { customerId: "cust_ananya", tagId: tag["At Risk"] },
    ],
  });

  type SeedConversation = {
    id: string;
    customerId: string;
    assignedAgentId: string;
    status: ConversationStatus;
    hoursAgoCreated: number;
    messages: { senderType: SenderType; senderId: string; content: string; hoursAgo: number; read: boolean }[];
  };

  const conversationSeeds: SeedConversation[] = [
    {
      id: "conv_payment",
      customerId: "cust_john",
      assignedAgentId: alex.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 6,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_john",
          content: "Hi, my payment failed when I tried to renew our annual plan. The card was charged but the workspace is still showing past due.",
          hoursAgo: 6,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: alex.id,
          content: "Thanks for flagging this, John. I can see a declined retry on the Visa ending 4242. I am checking the processor log now.",
          hoursAgo: 5.7,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_john",
          content: "We also received a duplicate invoice email. Can you reverse the extra charge if it went through?",
          hoursAgo: 1.2,
          read: false,
        },
      ],
    },
    {
      id: "conv_password",
      customerId: "cust_priya",
      assignedAgentId: sarah.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 8,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_priya",
          content: "I cannot reset my password. The reset email never arrives and I am locked out of the admin console.",
          hoursAgo: 8,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: sarah.id,
          content: "I found the reset emails going to spam for TechNova. I just triggered a fresh link and added your domain to the allowlist.",
          hoursAgo: 7.5,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_priya",
          content: "Got it, thank you. The link works now but it is asking for an old backup code.",
          hoursAgo: 0.8,
          read: false,
        },
      ],
    },
    {
      id: "conv_order",
      customerId: "cust_rahul",
      assignedAgentId: david.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 30,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_rahul",
          content: "Our hardware kit still has not arrived. Tracking has been stuck in customs for five days.",
          hoursAgo: 30,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: david.id,
          content: "I opened a shipping investigation with the carrier. I will send you an updated ETA as soon as they respond.",
          hoursAgo: 28,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_rahul",
          content: "Customs asked for a commercial invoice copy. Can you send that today?",
          hoursAgo: 26,
          read: true,
        },
      ],
    },
    {
      id: "conv_subscription",
      customerId: "cust_emily",
      assignedAgentId: sarah.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 12,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_emily",
          content: "Need help changing my subscription from Team to Business before our next billing date.",
          hoursAgo: 12,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: sarah.id,
          content: "I can do a mid-cycle upgrade and prorate the difference. Do you want annual billing kept in place?",
          hoursAgo: 11.4,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_emily",
          content: "Yes, keep annual billing. Please apply the partner discount if it is still valid.",
          hoursAgo: 3,
          read: false,
        },
      ],
    },
    {
      id: "conv_verification",
      customerId: "cust_michael",
      assignedAgentId: alex.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 4,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_michael",
          content: "Account verification is stuck on 'documents under review' even though we uploaded everything yesterday.",
          hoursAgo: 4,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: alex.id,
          content: "The business license image is cropped. If you resend a full-page PDF I can push this through compliance today.",
          hoursAgo: 3.5,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_michael",
          content: "Just uploaded the full PDF. Please let me know when compliance has it.",
          hoursAgo: 3.1,
          read: true,
        },
      ],
    },
    {
      id: "conv_api",
      customerId: "cust_aisha",
      assignedAgentId: david.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 2,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_aisha",
          content: "Our webhook endpoint started returning 401 after the key rotation. Production jobs are backing up.",
          hoursAgo: 2,
          read: false,
        },
        {
          senderType: SenderType.AGENT,
          senderId: david.id,
          content: "I rotated a replacement signing secret and posted it in the secure note. Please update the collector and retry the failed jobs.",
          hoursAgo: 1.7,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_aisha",
          content: "Updated. The 401s stopped, but a handful of events from the last hour are still missing.",
          hoursAgo: 1.4,
          read: false,
        },
      ],
    },
    {
      id: "conv_refund",
      customerId: "cust_james",
      assignedAgentId: sarah.id,
      status: ConversationStatus.CLOSED,
      hoursAgoCreated: 50,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_james",
          content: "We were charged twice for March. Please refund the duplicate payment.",
          hoursAgo: 50,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: sarah.id,
          content: "Confirmed the duplicate capture. I issued a refund of $249 and it should appear in 3-5 business days.",
          hoursAgo: 48,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_james",
          content: "Perfect, thank you. Closing this on our side.",
          hoursAgo: 47,
          read: true,
        },
      ],
    },
    {
      id: "conv_2fa",
      customerId: "cust_sofia",
      assignedAgentId: alex.id,
      status: ConversationStatus.CLOSED,
      hoursAgoCreated: 70,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_sofia",
          content: "I cannot enable two-factor authentication. The QR code never appears.",
          hoursAgo: 70,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: alex.id,
          content: "This was a known issue with Safari 17. After the patch, 2FA should render. Can you try Chrome once?",
          hoursAgo: 69,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_sofia",
          content: "That worked. Thanks for the workaround.",
          hoursAgo: 68,
          read: true,
        },
      ],
    },
    {
      id: "conv_invoice",
      customerId: "cust_chen",
      assignedAgentId: david.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 18,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_chen",
          content: "Our finance team never received the March invoice. Can you resend it with VAT included?",
          hoursAgo: 18,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: david.id,
          content: "I regenerated the invoice with your GST number and sent it to finance@orbitpay.asia.",
          hoursAgo: 16,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_chen",
          content: "Finance confirmed they received it. Thank you.",
          hoursAgo: 15,
          read: true,
        },
      ],
    },
    {
      id: "conv_dashboard",
      customerId: "cust_olivia",
      assignedAgentId: sarah.id,
      status: ConversationStatus.OPEN,
      hoursAgoCreated: 9,
      messages: [
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_olivia",
          content: "The analytics dashboard is loading very slowly this morning, especially the live visitors widget.",
          hoursAgo: 9,
          read: true,
        },
        {
          senderType: SenderType.AGENT,
          senderId: sarah.id,
          content: "We are seeing elevated query times on the US-West replica. I have opened an incident and will update you shortly.",
          hoursAgo: 8.4,
          read: true,
        },
        {
          senderType: SenderType.CUSTOMER,
          senderId: "cust_olivia",
          content: "It is still spinning after 20 seconds. Our ops team is waiting on this for a standup.",
          hoursAgo: 0.4,
          read: false,
        },
      ],
    },
  ];

  for (const conversation of conversationSeeds) {
    const createdAt = hoursAgo(conversation.hoursAgoCreated);
    const lastMessageAt = hoursAgo(conversation.messages[conversation.messages.length - 1].hoursAgo);

    await prisma.conversation.create({
      data: {
        id: conversation.id,
        customerId: conversation.customerId,
        assignedAgentId: conversation.assignedAgentId,
        status: conversation.status,
        createdAt,
        updatedAt: lastMessageAt,
        messages: {
          create: conversation.messages.map((message) => ({
            senderType: message.senderType,
            senderId: message.senderId,
            content: message.content,
            read: message.read,
            createdAt: hoursAgo(message.hoursAgo),
          })),
        },
      },
    });
  }

  await prisma.ticket.createMany({
    data: [
      {
        ticketNumber: "SH-1041",
        customerId: "cust_john",
        conversationId: "conv_payment",
        assignedAgentId: alex.id,
        subject: "Payment failed on annual renewal",
        description: "Customer reports a failed renewal. Card may have been captured while workspace still shows past due.",
        priority: TicketPriority.URGENT,
        status: TicketStatus.IN_PROGRESS,
        createdAt: hoursAgo(6),
        updatedAt: hoursAgo(1.2),
      },
      {
        ticketNumber: "SH-1042",
        customerId: "cust_priya",
        conversationId: "conv_password",
        assignedAgentId: sarah.id,
        subject: "Cannot reset password",
        description: "Reset emails were not arriving. Backup codes are now blocking the new password flow.",
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        createdAt: hoursAgo(8),
        updatedAt: hoursAgo(0.8),
      },
      {
        ticketNumber: "SH-1043",
        customerId: "cust_rahul",
        conversationId: "conv_order",
        assignedAgentId: david.id,
        subject: "Order has not arrived",
        description: "Hardware kit stuck in customs. Carrier investigation opened.",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.PENDING,
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(28),
      },
      {
        ticketNumber: "SH-1044",
        customerId: "cust_emily",
        conversationId: "conv_subscription",
        assignedAgentId: sarah.id,
        subject: "Need help changing my subscription",
        description: "Upgrade from Team to Business with annual billing and partner discount.",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.IN_PROGRESS,
        createdAt: hoursAgo(12),
        updatedAt: hoursAgo(3),
      },
      {
        ticketNumber: "SH-1045",
        customerId: "cust_michael",
        conversationId: "conv_verification",
        assignedAgentId: alex.id,
        subject: "Account verification problem",
        description: "KYC review stalled because the uploaded license is cropped.",
        priority: TicketPriority.HIGH,
        status: TicketStatus.PENDING,
        createdAt: hoursAgo(4),
        updatedAt: hoursAgo(3.5),
      },
      {
        ticketNumber: "SH-1046",
        customerId: "cust_aisha",
        conversationId: "conv_api",
        assignedAgentId: david.id,
        subject: "Webhook authentication failing after key rotation",
        description: "Production webhooks return 401. Jobs are backing up since the secret rotation.",
        priority: TicketPriority.URGENT,
        status: TicketStatus.OPEN,
        createdAt: hoursAgo(2),
        updatedAt: hoursAgo(2),
      },
      {
        ticketNumber: "SH-1047",
        customerId: "cust_james",
        conversationId: "conv_refund",
        assignedAgentId: sarah.id,
        subject: "Duplicate March charge refund",
        description: "Duplicate capture of $249 refunded. Customer confirmed.",
        priority: TicketPriority.LOW,
        status: TicketStatus.RESOLVED,
        createdAt: hoursAgo(50),
        updatedAt: hoursAgo(47),
      },
      {
        ticketNumber: "SH-1048",
        customerId: "cust_sofia",
        conversationId: "conv_2fa",
        assignedAgentId: alex.id,
        subject: "Two-factor setup QR code missing",
        description: "Safari rendering issue. Workaround provided and verified.",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.RESOLVED,
        createdAt: hoursAgo(70),
        updatedAt: hoursAgo(68),
      },
      {
        ticketNumber: "SH-1049",
        customerId: "cust_chen",
        conversationId: "conv_invoice",
        assignedAgentId: david.id,
        subject: "Missing March invoice",
        description: "Invoice regenerated with VAT/GST details and resent to finance.",
        priority: TicketPriority.LOW,
        status: TicketStatus.PENDING,
        createdAt: hoursAgo(18),
        updatedAt: hoursAgo(16),
      },
      {
        ticketNumber: "SH-1050",
        customerId: "cust_olivia",
        conversationId: "conv_dashboard",
        assignedAgentId: sarah.id,
        subject: "Dashboard loading slowly",
        description: "Analytics dashboard latency on US-West replica. Incident in progress.",
        priority: TicketPriority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        createdAt: hoursAgo(9),
        updatedAt: hoursAgo(0.4),
      },
      {
        ticketNumber: "SH-1051",
        customerId: "cust_daniel",
        assignedAgentId: david.id,
        subject: "Trial workspace hitting rate limits",
        description: "Trial account is hitting API rate limits during a proof of concept.",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        createdAt: hoursAgo(15),
        updatedAt: hoursAgo(14),
      },
      {
        ticketNumber: "SH-1052",
        customerId: "cust_nina",
        assignedAgentId: sarah.id,
        subject: "Onboarding checklist not completing",
        description: "Customer cannot mark DNS verification as complete in the onboarding wizard.",
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.IN_PROGRESS,
        createdAt: hoursAgo(22),
        updatedAt: hoursAgo(10),
      },
      {
        ticketNumber: "SH-1053",
        customerId: "cust_tom",
        assignedAgentId: alex.id,
        subject: "SSO login loop with Okta",
        description: "Okta SSO redirects back to the login screen after a successful assertion.",
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        createdAt: hoursAgo(11),
        updatedAt: hoursAgo(7),
      },
      {
        ticketNumber: "SH-1054",
        customerId: "cust_ananya",
        assignedAgentId: david.id,
        subject: "PHI export delayed",
        description: "Helix Health needs a data export for an audit. Current job is stuck at 62%.",
        priority: TicketPriority.URGENT,
        status: TicketStatus.PENDING,
        createdAt: hoursAgo(13),
        updatedAt: hoursAgo(5),
      },
      {
        ticketNumber: "SH-1055",
        customerId: "cust_lucas",
        assignedAgentId: sarah.id,
        subject: "Partner sandbox credentials expired",
        description: "Partner sandbox keys expired last night. Requesting rotation and a 30-day extension.",
        priority: TicketPriority.LOW,
        status: TicketStatus.RESOLVED,
        createdAt: hoursAgo(40),
        updatedAt: hoursAgo(36),
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        customerId: "cust_john",
        authorId: alex.id,
        content: "Finance contact prefers email over chat. Confirm any refund with their AP team before issuing it.",
        createdAt: hoursAgo(20),
      },
      {
        customerId: "cust_priya",
        authorId: sarah.id,
        content: "VIP account. Escalations should skip L1 and come directly to me or Alex.",
        createdAt: hoursAgo(16),
      },
      {
        customerId: "cust_rahul",
        authorId: david.id,
        content: "Warehouse confirmed the kit left Singapore on Friday. Customs hold is in Mumbai.",
        createdAt: hoursAgo(26),
      },
      {
        customerId: "cust_emily",
        authorId: sarah.id,
        content: "Partner discount is 15% and valid through the end of the quarter.",
        createdAt: hoursAgo(10),
      },
      {
        customerId: "cust_michael",
        authorId: alex.id,
        content: "Compliance needs a full-page business license PDF, not a cropped photo.",
        createdAt: hoursAgo(3),
      },
      {
        customerId: "cust_aisha",
        authorId: david.id,
        content: "Enterprise contract includes a 15-minute incident response SLA for production API issues.",
        createdAt: hoursAgo(1.5),
      },
      {
        customerId: "cust_olivia",
        authorId: sarah.id,
        content: "Customer is presenting to leadership today. Treat dashboard latency as a high-visibility issue.",
        createdAt: hoursAgo(8),
      },
      {
        customerId: "cust_chen",
        authorId: david.id,
        content: "OrbitPay billing entity is in Singapore. Always include GST on invoices.",
        createdAt: hoursAgo(17),
      },
      {
        customerId: "cust_ananya",
        authorId: alex.id,
        content: "Health-tech customer. Do not use production data in screenshots or internal notes.",
        createdAt: hoursAgo(12),
      },
      {
        customerId: "cust_fatima",
        authorId: sarah.id,
        content: "Inactive after trial ended. Worth a win-back call if they return through the widget.",
        createdAt: hoursAgo(90),
      },
      {
        customerId: "cust_tom",
        authorId: alex.id,
        content: "Okta ACS URL was updated last week. Likely related to the SSO loop.",
        createdAt: hoursAgo(9),
      },
    ],
  });

  const tickets = await prisma.ticket.findMany();
  const ticketByNumber = Object.fromEntries(
    tickets.map((ticket) => [ticket.ticketNumber, ticket]),
  );
  const seededTicket = (number: string) => {
    const ticket = ticketByNumber[number];
    if (!ticket) throw new Error(`Missing seed ticket ${number}`);
    return ticket;
  };

  await prisma.activity.createMany({
    data: [
      {
        customerId: "cust_john",
        actorId: alex.id,
        type: "ticket.status_changed",
        title: "Ticket status changed",
        message: "Ticket status changed to In Progress",
        href: `/tickets/${seededTicket("SH-1041").id}`,
        ticketId: seededTicket("SH-1041").id,
        conversationId: "conv_payment",
        createdAt: hoursAgo(1.2),
      },
      {
        customerId: "cust_john",
        actorId: alex.id,
        type: "tag.added",
        title: "Tag added",
        message: "Payment Issue was added to John Smith.",
        href: "/customers/cust_john",
        createdAt: hoursAgo(19),
      },
      {
        customerId: "cust_priya",
        actorId: sarah.id,
        type: "ticket.status_changed",
        title: "Ticket status changed",
        message: "Ticket status changed to Open",
        href: `/tickets/${seededTicket("SH-1042").id}`,
        ticketId: seededTicket("SH-1042").id,
        conversationId: "conv_password",
        createdAt: hoursAgo(8),
      },
      {
        customerId: "cust_emily",
        actorId: sarah.id,
        type: "ticket.status_changed",
        title: "Ticket status changed",
        message: "Ticket status changed to In Progress",
        href: `/tickets/${seededTicket("SH-1044").id}`,
        ticketId: seededTicket("SH-1044").id,
        conversationId: "conv_subscription",
        createdAt: hoursAgo(11),
      },
      {
        customerId: "cust_james",
        actorId: sarah.id,
        type: "ticket.status_changed",
        title: "Ticket status changed",
        message: "Ticket status changed to Resolved",
        href: `/tickets/${seededTicket("SH-1047").id}`,
        ticketId: seededTicket("SH-1047").id,
        conversationId: "conv_refund",
        createdAt: hoursAgo(47),
      },
      {
        customerId: "cust_sofia",
        actorId: alex.id,
        type: "customer.updated",
        title: "Customer updated",
        message: "Sofia Rossi's profile was updated.",
        href: "/customers/cust_sofia",
        createdAt: hoursAgo(65),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: "conversation",
        title: "New message from John Smith",
        message: "We also received a duplicate invoice email. Can you reverse the extra charge if it went through?",
        href: "/chat?conversation=conv_payment",
        read: false,
        createdAt: hoursAgo(1.2),
      },
      {
        userId: alex.id,
        type: "ticket",
        title: "Urgent ticket assigned",
        message: "SH-1041 Payment failed on annual renewal needs an update.",
        href: `/tickets/${seededTicket("SH-1041").id}`,
        read: false,
        createdAt: hoursAgo(2),
      },
      {
        userId: alex.id,
        type: "ticket",
        title: "SSO issue waiting on you",
        message: "Tom Hughes reported an Okta login loop on SH-1053.",
        href: `/tickets/${seededTicket("SH-1053").id}`,
        read: true,
        createdAt: hoursAgo(7),
      },
      {
        userId: sarah.id,
        type: "conversation",
        title: "New message from Priya Sharma",
        message: "The reset link works now but it is asking for an old backup code.",
        href: "/chat?conversation=conv_password",
        read: false,
        createdAt: hoursAgo(0.8),
      },
      {
        userId: sarah.id,
        type: "conversation",
        title: "New message from Olivia Martinez",
        message: "The dashboard is still spinning after 20 seconds.",
        href: "/chat?conversation=conv_dashboard",
        read: false,
        createdAt: hoursAgo(0.4),
      },
      {
        userId: sarah.id,
        type: "ticket",
        title: "Subscription change in progress",
        message: "Emily Davis asked to keep annual billing on SH-1044.",
        href: `/tickets/${seededTicket("SH-1044").id}`,
        read: true,
        createdAt: hoursAgo(3),
      },
      {
        userId: david.id,
        type: "conversation",
        title: "New conversation from Aisha Khan",
        message: "Webhook endpoint started returning 401 after the key rotation.",
        href: "/chat?conversation=conv_api",
        read: false,
        createdAt: hoursAgo(2),
      },
      {
        userId: david.id,
        type: "ticket",
        title: "Audit export delayed",
        message: "SH-1054 PHI export is still stuck at 62%.",
        href: `/tickets/${seededTicket("SH-1054").id}`,
        read: false,
        createdAt: hoursAgo(5),
      },
      {
        userId: david.id,
        type: "ticket",
        title: "Shipping investigation opened",
        message: "Rahul Mehta's hardware kit is still in customs.",
        href: `/tickets/${seededTicket("SH-1043").id}`,
        read: true,
        createdAt: hoursAgo(28),
      },
    ],
  });

  console.log("SupportStall seed complete.");
  console.log("Demo login: alex@supporthub.local / Demo123!");
  console.log(`Customers: ${customers.length}`);
  console.log(`Conversations: ${conversationSeeds.length}`);
  console.log(`Named customer sample: ${customerById.cust_john.name}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
