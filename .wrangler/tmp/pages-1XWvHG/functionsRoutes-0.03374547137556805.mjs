import { onRequestPost as __api_submit_form_ts_onRequestPost } from "/Users/stetson/CascadeProjects/radiant-307/functions/api/submit-form.ts"

export const routes = [
    {
      routePath: "/api/submit-form",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_submit_form_ts_onRequestPost],
    },
  ]