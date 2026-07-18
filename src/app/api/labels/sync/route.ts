import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { instance } = await req.json();

    if (!instance) {
      return NextResponse.json({ error: "Missing required field: instance" }, { status: 400 });
    }

    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing EVOLUTION_API_URL or EVOLUTION_API_KEY" },
        { status: 500 }
      );
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client error" }, { status: 500 });
    }

    // 1. Get instance ID from DB
    const { data: instanceData, error: instanceError } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name", instance)
      .single();

    if (instanceError || !instanceData) {
      return NextResponse.json({ error: `Instance not found in DB: ${instance}` }, { status: 404 });
    }
    const instanceId = instanceData.id;

    // 2. Fetch labels from Evolution Go
    const baseUrl = apiUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/label/list`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "instance": instance,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Evolution API Error:", errorText);
      return NextResponse.json(
        { error: `Evolution API returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const labels = await response.json();
    
    if (!Array.isArray(labels)) {
      return NextResponse.json({ error: "Invalid response from Evolution API", data: labels }, { status: 500 });
    }

    // 3. Upsert labels to Supabase
    let synced = 0;
    for (const label of labels) {
      // label object: { id, instance_id, label_id, label_name, label_color, predefined_id }
      // The label_color comes as a string like "824666100000" or similar, or integer.
      // We will hash it or just map it to an integer 0-16 for the UI, or just store it.
      // Let's just use a simple hash of the color or name to map to our 0-16 index.
      let colorInt = 0;
      if (label.label_color) {
         // Just extract last 2 digits of the string to map nicely, or sum chars
         const str = String(label.label_color);
         colorInt = Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 17;
      }
      
      const { error: upsertError } = await supabase
        .from("whatsapp_labels")
        .upsert({
          instance_id: instanceId,
          provider_label_id: label.label_id,
          name: label.label_name || 'Sin Nombre',
          color: colorInt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instance_id,name'
        });

      if (upsertError) {
        console.error("Error upserting label:", upsertError);
      } else {
        synced++;
      }
    }

    return NextResponse.json({ success: true, synced, total: labels.length });

  } catch (error) {
    console.error("Error syncing labels:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
