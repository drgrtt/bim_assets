import { getUser } from "@netlify/identity";
import { getStore, getDeployStore } from "@netlify/blobs";

const defaults = {
  module01Viewed: false,
  test01Passed: false,
  test01Best: 0,
  module02Unlocked: false
};

function getProgressStore(){
  const deployContext = Netlify.context?.deploy?.context;
  if(deployContext === "production"){
    return getStore("bimbo-progress", { consistency: "strong" });
  }
  return getDeployStore("bimbo-progress");
}

export default async (req: Request) => {
  const user = await getUser();
  if(!user){
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getProgressStore();
  const key = `users/${user.id}.json`;

  if(req.method === "GET"){
    const saved = await store.get(key, { type: "json" });
    return Response.json(saved || defaults);
  }

  if(req.method === "POST"){
    let body: any = {};
    try{
      body = await req.json();
    }catch{
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const previous = (await store.get(key, { type: "json" })) || defaults;
    const incomingBest = Math.max(0, Math.min(5, Number(body.test01Best) || 0));
    const best = Math.max(Number(previous.test01Best) || 0, incomingBest);
    const passed = best >= 4;

    const next = {
      module01Viewed: Boolean(previous.module01Viewed || body.module01Viewed === true),
      test01Best: best,
      test01Passed: passed,
      module02Unlocked: passed,
      updatedAt: new Date().toISOString()
    };

    await store.setJSON(key, next);
    return Response.json(next);
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config = {
  path: "/api/progress"
};
