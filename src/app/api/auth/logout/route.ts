import { authorizeAdminApi } from "@/lib/auth";
import { deleteAdminSession } from "@/lib/session";
export async function POST(request:Request){const auth=await authorizeAdminApi(request,true);if(auth.error)return auth.error;await deleteAdminSession();return Response.json({ok:true})}
