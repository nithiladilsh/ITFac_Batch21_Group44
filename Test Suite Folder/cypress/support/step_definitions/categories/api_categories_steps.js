import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;

Given('the API Service is running', () => {
  cy.log('API Service check initiated');
});

Given('an Admin Auth Token is available', () => {
  // Uses "adminUser" and "adminPass" from cypress.env.json
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`, 
    body: {
      username: Cypress.env('adminUser'), 
      password: Cypress.env('adminPass')
    }
  }).then((res) => {
    authToken = res.body.token; 
  });
});

When('I send a POST request to create a category with numeric name {int}', (numericValue) => {
  // Generates a unique number to avoid "already exists" errors
  const uniqueNumericName = Number(`${numericValue}${Date.now()}`);

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false, 
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": uniqueNumericName, 
      "parentId": null
    }
  }).then((res) => {
    apiResponse = res;
  });
});

Then('the category response status should be {int}', (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus);
});

Then('the response body should confirm {string} for category name', (errorMessage) => {
  const actualMessage = typeof apiResponse.body === 'string' 
    ? apiResponse.body 
    : (apiResponse.body.message || apiResponse.body.error || apiResponse.body);

  expect(actualMessage).to.contain(errorMessage);
});