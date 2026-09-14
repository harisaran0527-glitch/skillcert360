import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
 const courses = await db.course.findMany({include:{provider:true,skill:{select:{id:true,name:true,slug:true,active:true,levelId:true,category:{select:{active:true}}}},level:true},orderBy:[{level:{order:'asc'}},{skill:{name:'asc'}},{id:'asc'}]});
 writeFileSync('reports/course-catalogue/before.json', JSON.stringify({capturedAt:new Date().toISOString(),courses},null,2));
 console.log(JSON.stringify({total:courses.length,active:courses.filter(c=>c.active).length,pending:courses.filter(c=>c.officialUrlStatus==='OFFICIAL_LINK_PENDING').length,skills:[...new Map(courses.map(c=>[c.skillId,{name:c.skill.name,slug:c.skill.slug,level:c.level.name,active:c.skill.active,courses:courses.filter(x=>x.skillId===c.skillId).length}])).values()]},null,2));
}
main().catch(e=>{console.error(e.code ?? e.name);process.exitCode=1}).finally(()=>db.$disconnect());
