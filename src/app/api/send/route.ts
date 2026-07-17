import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { instance, number, text } = await req.json();

    if (!instance || !number || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing EVOLUTION_API_URL or EVOLUTION_API_KEY" },
        { status: 500 }
      );
    }

    // Clean up trailing slashes
    const baseUrl = apiUrl.replace(/\/+$/, "");
    
    // Some versions of evolution-go use /message/sendText/{instance}, others /send/text
    // We will assume the standard v1/v2 route first.
    const url = `${baseUrl}/message/sendText/${instance}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify({
        number: number,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Evolution API Error:", errorText);
      return NextResponse.json(
        { error: `Evolution API returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
