import { NextResponse } from "next/server";

export function localStorageOnlyResponse() {
  return NextResponse.json(
    {
      error:
        "This demo keeps customers, chats, and tickets in browser localStorage.",
    },
    { status: 410 },
  );
}
