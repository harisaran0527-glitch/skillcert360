import { db } from "../src/lib/db";

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, status: true },
  });
  console.log(users);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
