import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getCustomerProfile } from "@/lib/data/customers";
import { recordActivity } from "@/lib/activity";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.email().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  company: z.string().trim().max(80).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await context.params;
  const customer = await getCustomerProfile(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json({ customer });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer update" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (parsed.data.email && parsed.data.email !== existing.email) {
    const clash = await prisma.customer.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (clash) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  await prisma.customer.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email?.toLowerCase(),
    },
  });

  await recordActivity({
    customerId: id,
    actorId: user.id,
    type: "customer.updated",
    title: "Customer updated",
    message: `${existing.name}'s profile was updated.`,
    href: `/customers/${id}`,
  });

  const customer = await getCustomerProfile(id);
  return NextResponse.json({ customer });
}
