import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/dashboard-store";
import { sendQuotationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { agentId, to, subject, body: htmlBody } = data as {
      agentId?: string;
      to?: string;
      subject?: string;
      body?: string;
    };

    if (!agentId || !to || !htmlBody) {
      return NextResponse.json(
        { error: "agentId, to, body required" },
        { status: 400 }
      );
    }

    const agent = await getAgent(agentId);
    if (!agent?.smtp?.host) {
      return NextResponse.json(
        { error: "SMTP not configured for this agent" },
        { status: 400 }
      );
    }

    const result = await sendQuotationEmail(agent.smtp, {
      to,
      subject: subject || `Quotation from ${agent.storeName || agent.name}`,
      body: htmlBody,
      storeName: agent.storeName || agent.name || "Store",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
