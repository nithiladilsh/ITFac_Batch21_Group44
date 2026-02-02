import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;

// PRE-REQUISITES
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
    cy.log("Admin Token Retrieved"); 
  });
});


// ADMIN TEST STEPS (API_TC_01 - API_TC_06)
// API_TC_01 - Verify that the API rejects non-string data types for Category Name
When('I send a POST request to create a category with numeric name {int}', (numericValue) => {
  const uniqueNumericName = Number(Math.floor(10000 + Math.random() * 90000));

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
      "parent": null 
    }
  }).then((res) => {
    apiResponse = res;
    cy.log("API Response (Numeric Name): " + JSON.stringify(res.body));
  });
});

// API_TC_02 - Verify that the API rejects creation with a non-existent Parent ID
When('I send a POST request to create a category with non-existent parent {string}', (invalidParentValue) => {
  const shortUniqueName = `Gh${Math.floor(1000 + Math.random() * 9000)}`;

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false, 
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": shortUniqueName, 
      "parent": invalidParentValue 
    }
  }).then((res) => {
    apiResponse = res;
    cy.log("API Response (Invalid Parent): " + JSON.stringify(res.body));
  });
});

// API_TC_03 - Verify that the API rejects whitespace-only Category Names
When('I send a POST request to create a category with whitespace name {string}', (whitespaceValue) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": whitespaceValue, 
      "parent": null          
    }
  }).then((res) => {
    apiResponse = res;
    cy.log("API Response (Whitespace): " + JSON.stringify(res.body));
  });
});

// API_TC_04 - Verify that the API prevents creating duplicate Category Names
When('I attempt to create a duplicate category with name {string}', (baseName) => {
  const uniqueName = `Dup${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. First Request: Create the category successfully
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": uniqueName,
      "parent": null
    }
  }).then((firstRes) => {
    expect(firstRes.status).to.eq(201); 
    cy.log(`Created Initial Category: ${uniqueName}`);

    // 2. Second Request: Try to create the EXACT SAME category again
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/categories`,
      failOnStatusCode: false, 
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        "name": uniqueName, 
        "parent": null
      }
    }).then((secondRes) => {
      apiResponse = secondRes; 
      cy.log("Duplicate Attempt Response: " + JSON.stringify(secondRes.body));
    });
  });
});

// API_TC_05 - Verify that the API rejects Null values for Category Name
When('I send a POST request to create a category with null name', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false, 
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": null,   
      "parent": null 
    }
  }).then((res) => {
    apiResponse = res;
    cy.log("API Response (Null Name): " + JSON.stringify(res.body));
  });
});

// API_TC_06 - Verify that the API rejects String values for Parent ID
When('I send a POST request to create a category with string parent ID {string}', (stringId) => {
  const uniqueName = `Sub${Math.floor(1000 + Math.random() * 9000)}`;

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": uniqueName,
      "parentId": stringId 
    }
  }).then((res) => {
    apiResponse = res;
    cy.log("API Response (Schema Test): " + JSON.stringify(res.body));
  });
});

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
  cy.log(`Checking if response contains: "${expectedMessage}"`);
  expect(JSON.stringify(actualMessage)).to.include(expectedMessage); 
});


// USER TEST STEPS (API_TC_07 - API_TC_12)

// API_TC_07 - Verify that the API pagination returns the correct item count
// 1. User Login 
Given('a User Auth Token is available', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username: Cypress.env('stdUser'), 
      password: Cypress.env('stdPass')
    }
  }).then((res) => {
    authToken = res.body.token; 
    cy.log("User Token Retrieved");
  });
});

// 2. GET Request with Pagination
When('I send a GET request to retrieve categories with page {int} and size {int}', (page, size) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/categories/page`,
    qs: {
      page: page,
      size: size
    },
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  }).then((res) => {
    apiResponse = res;
  });
});

Then('the response body should contain exactly {int} categories', (count) => {
  const dataList = apiResponse.body.content ? apiResponse.body.content : apiResponse.body;
  
  cy.log("Categories found: " + JSON.stringify(dataList.map(c => c.name)));
  expect(dataList).to.have.length(count);
});

// API_TC_08 - Verify that Standard Users are forbidden from creating categories
When('I send a POST request to create a category with name {string}', (name) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/categories`,
    failOnStatusCode: false, 
    headers: {
      'Authorization': `Bearer ${authToken}`, 
      'Content-Type': 'application/json'
    },
    body: {
      "name": name,
      "parent": null
    }
  }).then((res) => {
    apiResponse = res;
    cy.log("Security Check Response: " + JSON.stringify(res.body));
  });
});