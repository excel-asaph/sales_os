// A stand-in for graph.facebook.com, answering the calls the WhatsApp
// connection wizard makes (src/lib/meta-setup.ts), for testing it without a
// Meta account. See docs/V2_LOCAL_DEV.md, "Testing the connection wizard".
//
//   node scripts/fake-meta.mjs            listens on :4555
//   META_GRAPH_BASE_URL=http://localhost:4555 npm run dev
//
// It knows one app (id 1234567890, secret "a" x 32), a permanent token
// ("EAA" + "G" x 70), a temporary one ("EAA" + "T" x 70), and one WhatsApp
// account with a registered and an unregistered number. Like real Meta may,
// it refuses to let a token describe itself, which exercises the wizard's
// fallback to the app's own token. GET /__log lists the calls it received;
// GET /__break?unsubscribed=1&red=PN-REG simulates problems for Check connection.
import http from "node:http";
const GOOD = "EAA" + "G".repeat(70), TEMP = "EAA" + "T".repeat(70), APP = "1234567890", SECRET = "a".repeat(32);
const log = [];
// Problems the tests can switch on: GET /__break?unsubscribed=1&red=PN-REG
const broken = { unsubscribed: false, red: new Set(), registered: new Set(["PN-REG"]) };
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const err = (res, msg) => json(res, 400, { error: { message: msg, code: 190 } });
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x"); const p = url.pathname.replace(/^\/v\d+\.\d+/, ""); const q = url.searchParams;
  const bearer = (req.headers.authorization ?? "").replace("Bearer ", "");
  let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
    log.push(`${req.method} ${p}`);
    if (p === "/__log") return json(res, 200, log);
    if (p === "/__break") {
      broken.unsubscribed = q.get("unsubscribed") === "1";
      broken.red = new Set((q.get("red") ?? "").split(",").filter(Boolean));
      return json(res, 200, { ok: true });
    }
    if (p === "/app") return [GOOD, TEMP].includes(bearer) ? json(res, 200, { id: APP, name: "Demo Ebooks App" }) : err(res, "Invalid OAuth access token");
    if (p === "/debug_token") {
      // Like Meta may: a system-user token can't describe itself; the app token can.
      if (q.get("access_token") !== `${APP}|${SECRET}`) return err(res, "(#100) You must provide an app access token");
      const t = q.get("input_token");
      if (![GOOD, TEMP].includes(t)) return json(res, 200, { data: { is_valid: false } });
      return json(res, 200, { data: { app_id: APP, is_valid: true, expires_at: t === TEMP ? Math.floor(Date.now() / 1000) + 3600 : 0,
        scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
        granular_scopes: [{ scope: "whatsapp_business_management", target_ids: ["WABA1"] }, { scope: "whatsapp_business_messaging", target_ids: ["WABA1"] }] } });
    }
    if (p === "/oauth/access_token") return q.get("client_id") === APP && q.get("client_secret") === SECRET ? json(res, 200, { access_token: `${APP}|x` }) : err(res, "Error validating client secret.");
    if (bearer !== GOOD) return err(res, "Invalid OAuth access token");
    if (p === "/WABA1") return json(res, 200, { id: "WABA1", name: "Demo Ebooks WhatsApp" });
    if (p === "/WABA1/phone_numbers") return json(res, 200, { data: [
      { id: "PN-REG", display_phone_number: "+234 800 000 0009", verified_name: "Demo Ebooks", platform_type: "CLOUD_API" },
      { id: "PN-NEW", display_phone_number: "+234 800 000 0010", verified_name: "Demo Ebooks Two", platform_type: "NOT_APPLICABLE" } ] });
    if (p === "/WABA1/subscribed_apps" && req.method === "POST") { broken.unsubscribed = false; return json(res, 200, { success: true }); }
    if (p === "/WABA1/subscribed_apps") return json(res, 200, { data: broken.unsubscribed ? [] : [{ whatsapp_business_api_data: { id: APP, name: "Demo Ebooks App" } }] });
    if (p === "/PN-REG" || p === "/PN-NEW") {
      const id = p.slice(1);
      return json(res, 200, { id, display_phone_number: id === "PN-REG" ? "+234 800 000 0009" : "+234 800 000 0010",
        platform_type: broken.registered.has(id) ? "CLOUD_API" : "NOT_APPLICABLE", quality_rating: broken.red.has(id) ? "RED" : "GREEN" });
    }
    if (p === "/PN-NEW/register" && req.method === "POST") { log.push(`  register body ${body}`); broken.registered.add("PN-NEW"); return json(res, 200, { success: true }); }
    return err(res, `fake meta: no route for ${req.method} ${p}`);
  });
}).listen(4555, () => console.log("fake meta on 4555"));
