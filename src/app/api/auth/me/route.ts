import { getVerifiedAdmin } from "@/lib/session";
export async function GET(){const admin=await getVerifiedAdmin();if(!admin)return Response.json({ok:false},{status:401});return Response.json({ok:true,admin:{id:admin.adminId,name:admin.name,email:admin.email,mustChangePassword:admin.mustChangePassword}})}
