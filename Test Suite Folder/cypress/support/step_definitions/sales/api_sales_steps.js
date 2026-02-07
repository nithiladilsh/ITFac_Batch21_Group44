import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import { ensureAdminToken, ensureUserToken } from "../apiCommonSteps";

let apiResponse;
let authToken;
let testSaleIds = [];

// TOKEN SYNC HOOK 
Before({ tags: "@api" }, () => {
    ensureAdminToken().then(() => {
        cy.get('@adminToken').then((token) => {
            authToken = token;
        });
    });
});

// HELPER TO CAPTURE RESPONSE 
const capture = (res) => {
    apiResponse = res;
    cy.wrap(res).as('lastApiResponse');
};

// Cleanup function
const cleanUpApiSalesData = () => {
    if (testSaleIds.length > 0) {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/auth/login`,
            body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') },
            failOnStatusCode: false
        }).then((res) => {
            const token = res.body.token;
            if (!token) return;
            
            testSaleIds.forEach((saleId) => {
                cy.request({
                    method: "DELETE",
                    url: `${Cypress.env("apiUrl")}/sales/${saleId}`,
                    headers: { Authorization: `Bearer ${token}` },
                    failOnStatusCode: false,
                });
            });
            testSaleIds = [];
        });
    }
};

// GLOBAL BEFORE/AFTER
Before(() => { cleanUpApiSalesData(); });
After(() => { cleanUpApiSalesData(); });

// API_TC_01 - Verify that the API rejects selling quantity greater than available stock
When("I send a POST request to sell a plant with quantity exceeding stock", () => {
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then((plantsRes) => {
        const plants = plantsRes.body.content || plantsRes.body;
        // Find any plant to test against
        const testPlant = plants[0]; 
        const excessiveQuantity = (testPlant.quantity || 0) + 10;

        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${excessiveQuantity}`,
            failOnStatusCode: false,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            capture(res);
            cy.log("API Response (Excessive Quantity): " + JSON.stringify(res.body));
        });
    });
});

Then("the sales response status should be {int}", (expectedStatus) => {
    expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response body should confirm {string} or {string}", (errorMessage1, errorMessage2) => {
    const actualMessage = typeof apiResponse.body === "string" ? apiResponse.body : apiResponse.body.message || apiResponse.body.error || "";
    const containsError1 = actualMessage.toLowerCase().includes(errorMessage1.toLowerCase());
    const containsError2 = actualMessage.toLowerCase().includes(errorMessage2.toLowerCase());
    expect(containsError1 || containsError2).to.be.true;
});

// API_TC_14 - String Quantity
When("I send a POST request to sell a plant with string quantity {string}", (stringQuantity) => {
     cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then((plantsRes) => {
        const plants = plantsRes.body.content || plantsRes.body;
        const testPlant = plants[0];

        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${stringQuantity}`,
            failOnStatusCode: false,
            headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        }).then(capture);
    });
});

// API_TC_16 - Float Quantity
When("I send a POST request to sell a plant with float quantity {string}", (floatQuantity) => {
    cy.request({
       method: "GET",
       url: `${Cypress.env("apiUrl")}/plants`,
       headers: { Authorization: `Bearer ${authToken}` },
   }).then((plantsRes) => {
       const plants = plantsRes.body.content || plantsRes.body;
       const testPlant = plants[0];

       cy.request({
           method: "POST",
           url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${floatQuantity}`,
           failOnStatusCode: false,
           headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
       }).then(capture);
   });
});

// API_TC_15 - Missing Quantity
When("I send a POST request to sell a plant without quantity parameter", () => {
     cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then((plantsRes) => {
        const plants = plantsRes.body.content || plantsRes.body;
        const testPlant = plants[0];

        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}`, 
            failOnStatusCode: false,
            headers: { Authorization: `Bearer ${authToken}` },
        }).then(capture);
    });
});

// API_TC_17 - Non-existent Plant ID
When("I send a POST request to sell a plant with non-existent plant ID {int}", (nonExistentId) => {
    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/sales/plant/${nonExistentId}?quantity=1`,
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then(capture);
});

// API_TC_18 - Delete Non-existent Sales Record
When("I send a DELETE request for non-existent sales record ID {int}", (nonExistentId) => {
    cy.request({
        method: "DELETE",
        url: `${Cypress.env("apiUrl")}/sales/${nonExistentId}`,
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then(capture);
});

// API_TC_19 - Get Non-existent Sales Record
When("I send a GET request for sales record with non-existent ID {int}", (nonExistentId) => {
    cy.log(`Attempting to retrieve non-existent sales record ID: ${nonExistentId}`);
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/sales/${nonExistentId}`,
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
    }).then(capture);
});

// API_TC_20 - User Role Create Sale (Forbidden)
When("I send a POST request to sell a plant with valid data as a User", () => {
    // 1. Get Plant with stock > 0
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then((plantsRes) => {
        const plants = plantsRes.body.content || plantsRes.body;
        const testPlant = plants.find(p => p.quantity > 0) || plants[0]; 
        
        ensureUserToken().then(() => {
            cy.get('@userToken').then((uToken) => {
                cy.request({
                    method: "POST",
                    url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=1`,
                    failOnStatusCode: false,
                    headers: { Authorization: `Bearer ${uToken}` },
                }).then((res) => {
                    if (res.status === 201 || res.status === 200) {
                        testSaleIds.push(res.body.id);
                    }
                    capture(res);
                });
            });
        });
    });
});

// API_TC_21 - User Role Delete Sale (Forbidden)
When("I send a DELETE request for an existing sales record as a User", () => {
    // 1. Get Plant with stock > 0
     cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then((plantsRes) => {
        const plants = plantsRes.body.content || plantsRes.body;
        // Find a plant that actually has stock to sell
        const testPlant = plants.find(p => p.quantity > 0);
        
        if (!testPlant) {
            throw new Error("No plants with positive quantity found to test sales deletion.");
        }

        // 2. Create Sale as Admin
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=1`,
            headers: { Authorization: `Bearer ${authToken}` },
        }).then((createRes) => {
            const saleId = createRes.body.id;
            testSaleIds.push(saleId); 

            // 3. Try to delete as User
            ensureUserToken().then(() => {
                cy.get('@userToken').then((uToken) => {
                    cy.request({
                        method: "DELETE",
                        url: `${Cypress.env("apiUrl")}/sales/${saleId}`,
                        failOnStatusCode: false,
                        headers: { Authorization: `Bearer ${uToken}` },
                    }).then(capture);
                });
            });
        });
    });
});

// API_TC_22 - String ID Get
When("I send a GET request for sales record with string ID {string}", (stringId) => {
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/sales/${stringId}`,
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then(capture);
});

// API_TC_23 - String ID Delete
When("I send a DELETE request with string ID {string}", (stringId) => {
    cy.request({
        method: "DELETE",
        url: `${Cypress.env("apiUrl")}/sales/${stringId}`,
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${authToken}` },
    }).then(capture);
});