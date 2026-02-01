import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;

// Pre-requisites
Given('the API Service is running', () => {
  cy.log('API Service check initiated');
});

Given('an Admin Auth Token is available', () => {
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

// API_TC_01 - Verify numeric Category Name
When('I send a POST request to create a category with numeric name {int}', (numericValue) => {
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
      "name": numericValue, 
      "parent": null 
    }
  }).then((res) => {
    apiResponse = res;
  });
});

// API_TC_02 - Verify non-existent Parent
When('I send a POST request to create a category with non-existent parent {string}', (invalidParentValue) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false, 
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": `Ghost_${Date.now()}`, 
      "parent": invalidParentValue 
    }
  }).then((res) => {
    apiResponse = res;
  });
});

// GENERIC ASSERTIONS
Then('the category response status should be {int}', (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus); 
});

Then('the response body should confirm {string} for category name', (errorMessage) => {
  const actualMessage = typeof apiResponse.body === 'string' 
    ? apiResponse.body 
    : (apiResponse.body.message || apiResponse.body.error);

  expect(actualMessage).to.contain(errorMessage); 
});

Then('the response body should confirm {string}', (expectedMessage) => {
  const actualMessage = apiResponse.body.message || apiResponse.body.error || apiResponse.body;
  expect(actualMessage).to.include(expectedMessage); 
});