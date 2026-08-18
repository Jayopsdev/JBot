import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getCustomerProfile } from "@/lib/data/customers";
import { recordActivity } from "@/lib/activity";

const tagSchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  const { id } = await context.params;
  const parsed = tagSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const name = parsed.data.name;
  const tag = await prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  await prisma.customerTag.upsert({
    where: { customerId_tagId: { customerId: id, tagId: tag.id } },
    update: {},
    create: { customerId: id, tagId: tag.id },
  });

  await recordActivity({
    customerId: id,
    actorId: user.id,
    type: "tag.added",
    title: "Tag added",
    message: `${name} was added to ${customer.name}.`,
    href: `/customers/${id}`,
  });

  return NextResponse.json({ customer: await getCustomerProfile(id) });
}
