import { config } from "dotenv";
config({ path: ".env.local" });config();
async function main(){const { processNextJob } = await import("../src/lib/knowledge/worker");let processed=0;for(;;){const result=await processNextJob();if(!result)break;processed++}console.log(`OneAI worker processed ${processed} job(s)`)}
main().then(()=>process.exit(0)).catch((error)=>{console.error(error);process.exit(1)});
