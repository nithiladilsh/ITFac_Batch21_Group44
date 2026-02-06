import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;
let testSaleIds = [];

// Cleanup function to remove test sales data
const cleanUpApiSalesData = () => {
    cy.wait(2000);

    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: { username: Cypress.env("adminUser"), password: Cypress.env("adminPass") },
        failOnStatusCode: false,
    }).then((loginRes) => {
        if (!loginRes.body.token) return;
        const cleanupToken = loginRes.body.token;

        // Delete test sales by ID
        if (testSaleIds.length > 0) {
            cy.log(`Cleaning up ${testSaleIds.length} test sales...`);
            testSaleIds.forEach((saleId) => {
                cy.request({
                    method: "DELETE",
                    url: `${Cypress.env("apiUrl")}/sales/${saleId}`,
                    headers: { Authorization: `Bearer ${cleanupToken}` },
                    failOnStatusCode: false,
                });
            });
            testSaleIds = [];
        }
    });
};

// GLOBAL BEFORE: Clean up any leftovers from previous runs
Before(() => {
    cleanUpApiSalesData();
});

// GLOBAL AFTER: Clean up what we just created
After(() => {
    cleanUpApiSalesData();
});

// PRE-REQUISITES
Given("the API Service is running", () => {
    cy.log("API Service check initiated");
});

Given("an Admin Auth Token is available", () => {
    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: {
            username: Cypress.env("adminUser"),
            password: Cypress.env("adminPass"),
        },
    }).then((res) => {
        authToken = res.body.token;
        cy.log("Admin Token Retrieved");
    });
});

Given("a User Auth Token is available", () => {
    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: {
            username: Cypress.env("stdUser"),
            password: Cypress.env("stdPass"),
        },
    }).then((res) => {
        authToken = res.body.token;
        cy.log("User Token Retrieved");
    });
});

// ADMIN TEST STEPS

// API_TC_01 - Verify that the API rejects selling quantity greater than available stock
When("I send a POST request to sell a plant with quantity exceeding stock", () => {
    // Step 1: Get a plant with known stock
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).then((plantsRes) => {
        expect(plantsRes.status).to.eq(200);

        // Get plants array (handle both direct array and paginated response)
        let plants = null;
        if (Array.isArray(plantsRes.body)) {
            plants = plantsRes.body;
        } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
            plants = plantsRes.body.content;
        }

        expect(plants).to.not.be.null;
        expect(plants.length).to.be.greaterThan(0);

        const testPlant = plants[0];
        const availableStock = testPlant.quantity;
        const excessiveQuantity = availableStock + 10; // Exceed stock by 10

        cy.log(
            `Plant ID: ${testPlant.id}, Available Stock: ${availableStock}, Attempting to sell: ${excessiveQuantity}`,
        );

        // Step 2: Try to sell quantity greater than available stock
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${excessiveQuantity}`,
            failOnStatusCode: false,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            apiResponse = res;
            cy.log("API Response (Excessive Quantity): " + JSON.stringify(res.body));
        });
    });
});

Then("the sales response status should be {int}", (expectedStatus) => {
    expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response body should confirm {string} or {string}", (errorMessage1, errorMessage2) => {
    const actualMessage =
        typeof apiResponse.body === "string"
            ? apiResponse.body
            : apiResponse.body.message || apiResponse.body.error || "";

    cy.log(`Checking if response contains: "${errorMessage1}" or "${errorMessage2}"`);

    const containsError1 = actualMessage.toLowerCase().includes(errorMessage1.toLowerCase());
    const containsError2 = actualMessage.toLowerCase().includes(errorMessage2.toLowerCase());

    expect(containsError1 || containsError2).to.be.true;
});

// API_TC_14 - Verify that the API rejects string values for quantity parameter
When("I send a POST request to sell a plant with string quantity {string}", (stringQuantity) => {
    // Step 1: Get a plant
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).then((plantsRes) => {
        expect(plantsRes.status).to.eq(200);

        // Get plants array (handle both direct array and paginated response)
        let plants = null;
        if (Array.isArray(plantsRes.body)) {
            plants = plantsRes.body;
        } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
            plants = plantsRes.body.content;
        }

        expect(plants).to.not.be.null;
        expect(plants.length).to.be.greaterThan(0);

        const testPlant = plants[0];

        cy.log(
            `Plant ID: ${testPlant.id}, Attempting to sell with string quantity: "${stringQuantity}"`,
        );

        // Step 2: Try to sell with string quantity
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${stringQuantity}`,
            failOnStatusCode: false,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            apiResponse = res;
            cy.log("API Response (String Quantity): " + JSON.stringify(res.body));
        });
    });
});

// API_TC_15 - Verify that the API rejects requests with missing quantity parameter
When("I send a POST request to sell a plant without quantity parameter", () => {
    // Step 1: Get a plant
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).then((plantsRes) => {
        expect(plantsRes.status).to.eq(200);

        // Get plants array (handle both direct array and paginated response)
        let plants = null;
        if (Array.isArray(plantsRes.body)) {
            plants = plantsRes.body;
        } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
            plants = plantsRes.body.content;
        }

        expect(plants).to.not.be.null;
        expect(plants.length).to.be.greaterThan(0);

        const testPlant = plants[0];

        cy.log(`Plant ID: ${testPlant.id}, Attempting to sell without quantity parameter`);

        // Step 2: Try to sell without quantity parameter
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}`,
            failOnStatusCode: false,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            apiResponse = res;
            cy.log("API Response (Missing Quantity): " + JSON.stringify(res.body));
        });
    });
});

// API_TC_16 - Verify that the API rejects floating-point values for quantity parameter
When("I send a POST request to sell a plant with float quantity {string}", (floatQuantity) => {
    // Step 1: Get a plant
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).then((plantsRes) => {
        expect(plantsRes.status).to.eq(200);

        // Get plants array (handle both direct array and paginated response)
        let plants = null;
        if (Array.isArray(plantsRes.body)) {
            plants = plantsRes.body;
        } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
            plants = plantsRes.body.content;
        }

        expect(plants).to.not.be.null;
        expect(plants.length).to.be.greaterThan(0);

        const testPlant = plants[0];

        cy.log(
            `Plant ID: ${testPlant.id}, Attempting to sell with float quantity: ${floatQuantity}`,
        );

        // Step 2: Try to sell with float quantity
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${floatQuantity}`,
            failOnStatusCode: false,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            apiResponse = res;
            cy.log("API Response (Float Quantity): " + JSON.stringify(res.body));
        });
    });
});

// API_TC_17 - Verify that the API returns 404 for non-existent plant ID
When("I send a POST request to sell a plant with non-existent plant ID {int}", (nonExistentId) => {
    cy.log(`Attempting to sell plant with non-existent ID: ${nonExistentId}`);

    // Try to sell with non-existent plant ID
    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/sales/plant/${nonExistentId}?quantity=1`,
        failOnStatusCode: false,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    }).then((res) => {
        apiResponse = res;
        cy.log("API Response (Non-existent Plant): " + JSON.stringify(res.body));
    });
});

// API_TC_18 - Verify that the API returns 404 when deleting non-existent sales record
When("I send a DELETE request for non-existent sales record ID {int}", (nonExistentId) => {
    cy.log(`Attempting to delete non-existent sales record ID: ${nonExistentId}`);

    // Try to delete non-existent sales record
    cy.request({
        method: "DELETE",
        url: `${Cypress.env("apiUrl")}/sales/${nonExistentId}`,
        failOnStatusCode: false,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    }).then((res) => {
        apiResponse = res;
        cy.log("API Response (Delete Non-existent Sales): " + JSON.stringify(res.body));
    });
});

// API_TC_19 - Verify that the API returns 404 when retrieving non-existent sales record
When("I send a GET request for sales record with non-existent ID {int}", (nonExistentId) => {
    cy.log(`Attempting to retrieve non-existent sales record ID: ${nonExistentId}`);

    // Try to get non-existent sales record
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/sales/${nonExistentId}`,
        failOnStatusCode: false,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    }).then((res) => {
        apiResponse = res;
        cy.log("API Response (Get Non-existent Sales): " + JSON.stringify(res.body));
    });
});

// API_TC_20 - Verify that the API returns 403 when User role tries to create a sale
When("I send a POST request to sell a plant with valid data as a User", () => {
    // Step 1: Get a plant
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }).then((plantsRes) => {
        expect(plantsRes.status).to.eq(200);

        // Get plants array (handle both direct array and paginated response)
        let plants = null;
        if (Array.isArray(plantsRes.body)) {
            plants = plantsRes.body;
        } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
            plants = plantsRes.body.content;
        }

        expect(plants).to.not.be.null;
        expect(plants.length).to.be.greaterThan(0);

        const testPlant = plants[0];
        const validQuantity = Math.min(1, testPlant.quantity);

        cy.log(`User attempting to sell Plant ID: ${testPlant.id}, Quantity: ${validQuantity}`);

        // Step 2: Try to create sale as User (should be forbidden)
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${validQuantity}`,
            failOnStatusCode: false,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            apiResponse = res;
            cy.log("API Response (User Create Sale): " + JSON.stringify(res.body));
        });
    });
});

// API_TC_21 - Verify that the API returns 403 when User role tries to delete a sale
When("I send a DELETE request for an existing sales record as a User", () => {
    // Step 1: Login as admin and create a sale
    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: {
            username: Cypress.env("adminUser"),
            password: Cypress.env("adminPass"),
        },
    }).then((adminLoginRes) => {
        const adminToken = adminLoginRes.body.token;

        // Get a plant
        cy.request({
            method: "GET",
            url: `${Cypress.env("apiUrl")}/plants`,
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        }).then((plantsRes) => {
            let plants = null;
            if (Array.isArray(plantsRes.body)) {
                plants = plantsRes.body;
            } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
                plants = plantsRes.body.content;
            }

            const testPlant = plants[0];
            const validQuantity = Math.min(1, testPlant.quantity);

            // Create a sale as admin
            cy.request({
                method: "POST",
                url: `${Cypress.env("apiUrl")}/sales/plant/${testPlant.id}?quantity=${validQuantity}`,
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            }).then((createRes) => {
                const saleId = createRes.body.id;
                testSaleIds.push(saleId);

                cy.log(`Created sale ID ${saleId}, User attempting to delete it`);

                // Step 2: Try to delete as User (should be forbidden)
                cy.request({
                    method: "DELETE",
                    url: `${Cypress.env("apiUrl")}/sales/${saleId}`,
                    failOnStatusCode: false,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }).then((res) => {
                    apiResponse = res;
                    cy.log("API Response (User Delete Sale): " + JSON.stringify(res.body));
                });
            });
        });
    });
});

// API_TC_22 - Verify that the API returns 400 when retrieving sales with string ID
When("I send a GET request for sales record with string ID {string}", (stringId) => {
    cy.log(`Attempting to retrieve sales record with string ID: ${stringId}`);

    // Try to get sales record with string ID
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/sales/${stringId}`,
        failOnStatusCode: false,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    }).then((res) => {
        apiResponse = res;
        cy.log("API Response (Get String ID): " + JSON.stringify(res.body));
    });
});

// API_TC_23 - Verify that the API returns 400 when deleting sales with string ID
When("I send a DELETE request with string ID {string}", (stringId) => {
    cy.log(`Attempting to delete sales record with string ID: ${stringId}`);

    // Try to delete sales record with string ID
    cy.request({
        method: "DELETE",
        url: `${Cypress.env("apiUrl")}/sales/${stringId}`,
        failOnStatusCode: false,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    }).then((res) => {
        apiResponse = res;
        cy.log("API Response (Delete String ID): " + JSON.stringify(res.body));
    });
});
