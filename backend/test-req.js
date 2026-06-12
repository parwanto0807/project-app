import http from "http";

const req = http.request(
  {
    hostname: "localhost",
    port: 5000,
    path: "/api/payroll/meal-allowance/preview/ALL?periodeBulan=2026-05&siklus=1",
    method: "GET",
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("STATUS:", res.statusCode);
      console.log("BODY:", data);
    });
  }
);

req.on("error", (e) => {
  console.error("ERROR:", e.message);
});

req.end();
