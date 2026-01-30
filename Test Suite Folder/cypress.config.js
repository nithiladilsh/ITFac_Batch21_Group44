const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const { allureCypress } = require("allure-cypress/reporter");

module.exports = defineConfig({
  e2e: {
    // Defines paths for both Cucumber (UI) and Javascript (API) test files
    specPattern: [
      "cypress/e2e/ui/features/**/*.feature",
      "cypress/e2e/api/**/*.cy.js"
    ],
    async setupNodeEvents(on, config) {
      // Required for Cucumber and Allure Reporting
      await addCucumberPreprocessorPlugin(on, config);
      allureCypress(on, config);

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );
      return config;
    },
    baseUrl: "http://localhost:8080/ui",
    env: {
      apiUrl: "http://localhost:8080/api"
    },
    video: false,
    screenshotOnRunFailure: true
  },
});