import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { listCustomers } from "@/lib/data/customers";

export async function GET(request: Request) {
  const { response } = await requireUser();
  if (response) return response;

  const url = new URL(request.url);
  const result = await listCustomers({
    query: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    page: Number(url.searchParams.get("page") ?? "1"),
    pageSize: Number(url.searchParams.get("pageSize") ?? "8"),
    sort: url.searchParams.get("sort") ?? undefined,
  });

  return NextResponse.json(result);
}
