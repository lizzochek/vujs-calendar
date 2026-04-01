const { defineConfig } = require("@vue/cli-service")

// GitHub project page: https://<user>.github.io/<repo>/
// Production base must match that path. CI sets VUE_PUBLIC_PATH from the repo name.
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath:
    process.env.NODE_ENV === "production"
      ? process.env.VUE_PUBLIC_PATH || "/vuejs-calendar/"
      : "/",
})
