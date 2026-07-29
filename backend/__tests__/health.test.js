import app from "../src/app.js"

describe("App Health Check", () => {
  it("should export an express app", () => {
    expect(app).toBeDefined()
    expect(typeof app).toBe("function")
  })

  it("should have /api/health endpoint configured", () => {
    const routes = app._router?.stack?.filter(r => r.route) || []
    const healthRoute = routes.find(r => r.route?.path === "/api/health")
    expect(healthRoute).toBeDefined()
  })
})
