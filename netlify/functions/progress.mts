import { getUser } from "@netlify/identity";
import { getStore, getDeployStore } from "@netlify/blobs";

const defaults = {
  onboardingDone: false,
  module01Viewed: false,
  test01Passed: false,
  test01Best: 0,
  module02Unlocked: false,
  module02Viewed: false,
  test02Passed: false,
  test02Best: 0,
  module03Unlocked: false
};

function getProgressStore(){
  const deployContext = Netlify.context?.deploy?.context;
  if(deployContext === "production") return getStore("bimbo-progress", { consistency: "strong" });
  return getDeployStore("bimbo-progress");
}

export default async (req: Request) => {
  const user = await getUser();
  if(!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const store = getProgressStore();
  const key = `users/${user.id}.json`;

  if(req.method === "GET"){
    const saved = await store.get(key, { type: "json" });
    return Response.json({ ...defaults, ...(saved || {}) });
  }

  if(req.method === "POST"){
    let body: any = {};
    try{ body = await req.json(); }
    catch{ return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

    const previous = { ...defaults, ...((await store.get(key, { type: "json" })) || {}) };

    const test01Best = Math.max(
      Number(previous.test01Best) || 0,
      Math.max(0, Math.min(5, Number(body.test01Best) || 0))
    );
    const test01Passed = test01Best >= 4;

    const test02Best = Math.max(
      Number(previous.test02Best) || 0,
      Math.max(0, Math.min(5, Number(body.test02Best) || 0))
    );
    const test02Passed = test02Best >= 4 && test01Passed;

    const next = {
      onboardingDone: Boolean(previous.onboardingDone || body.onboardingDone === true),
      module01Viewed: Boolean(previous.module01Viewed || body.module01Viewed === true),
      test01Best,
      test01Passed,
      module02Unlocked: test01Passed,
      module02Viewed: Boolean(previous.module02Viewed || (test01Passed && body.module02Viewed === true)),
      test02Best,
      test02Passed,
      module03Unlocked: test02Passed,
      updatedAt: new Date().toISOString()
    };

    await store.setJSON(key, next);
    return Response.json(next);
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config = { path: "/api/progress" };
