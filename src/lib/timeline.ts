export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  href?: string | null;
};

export function lastActivityAt(input: {
  updatedAt: Date;
  conversations: { updatedAt: Date }[];
  tickets: { updatedAt: Date }[];
  notes: { createdAt: Date; updatedAt?: Date }[];
}) {
  const dates = [
    input.updatedAt,
    ...input.conversations.map((item) => item.updatedAt),
    ...input.tickets.map((item) => item.updatedAt),
    ...input.notes.map((item) => item.updatedAt ?? item.createdAt),
  ];
  return dates.reduce((latest, date) => (date > latest ? date : latest));
}
