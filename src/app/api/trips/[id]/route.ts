import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/request-auth";
import { query } from "@/lib/server/db";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request); if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  const access = await query("select t.* from trips t left join trip_members tm on tm.trip_id=t.id where t.id=$1 and (t.owner_id=$2 or tm.user_id=$2) limit 1", [id, user.id]);
  if (!access.rowCount) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  const [members, stops, documents, expenses, notes, links, photos] = await Promise.all([
    query("select id,email,name,role,status,created_at from trip_members where trip_id=$1 order by role,created_at", [id]),
    query("select * from trip_stops where trip_id=$1 order by position,start_at,created_at", [id]),
    query("select * from trip_documents where trip_id=$1 order by created_at desc", [id]),
    query("select e.*,u.name as paid_by_name from trip_expenses e left join users u on u.id=e.paid_by where e.trip_id=$1 order by e.created_at desc", [id]),
    query("select * from trip_notes where trip_id=$1 order by updated_at desc", [id]),
    query("select * from trip_links where trip_id=$1 order by created_at desc", [id]),
    query("select * from trip_photos where trip_id=$1 order by created_at desc", [id]),
  ]);
  return NextResponse.json({ trip: access.rows[0], members: members.rows, stops: stops.rows, documents: documents.rows, expenses: expenses.rows, notes: notes.rows, links: links.rows, photos: photos.rows });
}
