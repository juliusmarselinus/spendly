import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reply: "ANTHROPIC_API_KEY belum diset di .env.local" });
  }

  const systemPrompt = `Kamu adalah asisten keuangan pribadi di app Spendly. Jawab singkat, praktis, dalam Bahasa Indonesia santai.
Data user saat ini:
- Saldo saat ini: Rp${Number(context?.balance || 0).toLocaleString("id-ID")}
- Tanggal gajian tiap bulan: ${context?.payday || "belum diset"}
- Transaksi terakhir (JSON): ${JSON.stringify(context?.recentTransactions || [])}
Kalau user tanya batas pengeluaran harian, hitung dari saldo dibagi sisa hari sampai tanggal gajian berikutnya. Selalu kasih angka konkret.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 400,
        system: systemPrompt,
        messages: (messages || []).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await res.json();
    const reply = data?.content?.find((c: any) => c.type === "text")?.text || "Maaf, gagal memproses.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Gagal terhubung ke AI." });
  }
}