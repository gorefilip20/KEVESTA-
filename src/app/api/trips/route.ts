import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getRequestUser } from "@/lib/server/request-auth";
import { query, withTransaction } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const result = await query("select t.*, tm.role from trips t join trip_members tm on tm.trip_id = t.id where (t.owner_id = $1 or tm.user_id = $1) order by t.updated_at desc", [user.id]);
  return NextResponse.json({ trips: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json(); const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name) return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
    const trip = await withTransaction(async (client) => {
      const created = await client.query("insert into trips (owner_id, name, destination, start_date, end_date, country_code, cover_image) values ($1,$2,$3,$4,$5,$6,$7) returning *", [user.id, name, body.destination || null, body.startDate || null, body.endDate || null, body.countryCode || null, body.coverImage || null]);
      await client.query("insert into trip_members (trip_id, user_id, email, name, role, status) values ($1,$2,$3,$4,'owner','accepted')", [created.rows[0].id, user.id, user.email, user.name]);
      return created.rows[0];
    });
    return NextResponse.json({ trip }, { status: 201 });
  } catch { return NextResponse.json({ error: "Trip could not be created" }, { status: 503 }); }
}

export async function PUT(request: NextRequest) {
  const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json(); const tripId = typeof body.tripId === "string" ? body.tripId : ""; const action = body.action;
    const access = await query("select t.id from trips t left join trip_members tm on tm.trip_id=t.id where t.id=$1 and (t.owner_id=$2 or tm.user_id=$2) limit 1", [tripId, user.id]);
    if (!access.rowCount) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    if (action === "invite") {
      const email = String(body.email || "").trim().toLowerCase(); if (!email.includes("@")) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      const inviteToken = crypto.randomBytes(18).toString("hex"); const result = await query("insert into trip_members (trip_id,email,role,invite_token) values ($1,$2,'traveler',$3) on conflict (trip_id,email) do update set invite_token=excluded.invite_token, status='invited' returning id,email,invite_token,status", [tripId, email, inviteToken]);
      return NextResponse.json({ member: result.rows[0], inviteUrl: `/trip/invite/${inviteToken}` }, { status: 201 });
    }
    if (action === "stop") { const result = await query("insert into trip_stops (trip_id,title,description,location,start_at,end_at,category,created_by) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *", [tripId, body.title, body.description || null, body.location || null, body.startAt || null, body.endAt || null, body.category || "place", user.id]); return NextResponse.json({ stop: result.rows[0] }, { status: 201 }); }
    if (action === "document") { const result = await query("insert into trip_documents (trip_id,title,document_type,file_url,reference,expires_at,created_by) values ($1,$2,$3,$4,$5,$6,$7) returning *", [tripId, body.title, body.documentType || "other", body.fileUrl || null, body.reference || null, body.expiresAt || null, user.id]); return NextResponse.json({ document: result.rows[0] }, { status: 201 }); }
    if (action === "expense") { const result = await query("insert into trip_expenses (trip_id,description,amount_cents,currency,paid_by,split_type) values ($1,$2,$3,$4,$5,$6) returning *", [tripId, body.description, Math.round(Number(body.amount || 0) * 100), body.currency || "USD", user.id, body.splitType || "equal"]); return NextResponse.json({ expense: result.rows[0] }, { status: 201 }); }
    if (action === "note") { const result = await query("insert into trip_notes (trip_id,title,body,created_by) values ($1,$2,$3,$4) returning *", [tripId, body.title, body.body, user.id]); return NextResponse.json({ note: result.rows[0] }, { status: 201 }); }
    if (action === "link") { const result = await query("insert into trip_links (trip_id,title,url,created_by) values ($1,$2,$3,$4) returning *", [tripId, body.title, body.url, user.id]); return NextResponse.json({ link: result.rows[0] }, { status: 201 }); }
    if (action === "photo") { const result = await query("insert into trip_photos (trip_id,url,caption,created_by) values ($1,$2,$3,$4) returning *", [tripId, body.url, body.caption || null, user.id]); return NextResponse.json({ photo: result.rows[0] }, { status: 201 }); }
    if (action === "plan") {
      const prompt = String(body.prompt || "").slice(0, 1200); if (!prompt) return NextResponse.json({ error: "Planning prompt is required" }, { status: 400 });
      const items = prompt.split(/\n|,|;| then /i).map((item: string) => item.trim()).filter(Boolean).slice(0, 8);
      const created = [];
      for (let index = 0; index < items.length; index += 1) { const result = await query("insert into trip_stops (trip_id,title,description,category,position,created_by) values ($1,$2,$3,'ai_suggestion',$4,$5) returning *", [tripId, items[index], "Suggested by KEVESTA AI planning", index, user.id]); created.push(result.rows[0]); }
      return NextResponse.json({ stops: created, message: "Your planning ideas are now itinerary stops." }, { status: 201 });
    }
    return NextResponse.json({ error: "Unsupported trip action" }, { status: 400 });
  } catch { return NextResponse.json({ error: "Trip update could not be saved" }, { status: 503 }); }
}
