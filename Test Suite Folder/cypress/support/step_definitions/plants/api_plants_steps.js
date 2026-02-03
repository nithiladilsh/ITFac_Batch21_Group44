import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;
let categoryId; 

Given("the API Service is running", () => {
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/health`,
        headers: {
            Authorization: `Bearer ${authToken}`
        },
        failOnStatusCode: false
    }).then((res) => {
        expect(res.status).to.eq(200);
    });
});

Given("an Admin Auth Token is available", () => {
    if (!authToken) throw new Error("Admin Auth Token is not set");
    cy.log("Admin Auth Token is available");
});

Given("a valid plant category exists", () => {
    if (!categoryId) throw new Error("No valid plant category is available");
    cy.log(`Valid plant category exists: ${categoryId}`);
});

Given("a valid plant sub-category exists", () => {
    if (!categoryId) throw new Error("No valid plant sub-category is available");
    cy.log(`Valid plant sub-category exists: ${categoryId}`);
});

// PLANT CLEANUP FUNCTION
const cleanUpPlantApiData = () => {
    const prefix = "API_";

    cy.wait(2000);

    return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') },
        failOnStatusCode: false
    }).then((loginRes) => {
        if (!loginRes.body.token) return;
        const cleanupToken = loginRes.body.token;

        return cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/plants?page=0&size=2000`,
            headers: { 'Authorization': `Bearer ${cleanupToken}` },
            failOnStatusCode: false
        }).then((listRes) => {
            const plantList = listRes.body.content || listRes.body;

            if (plantList && plantList.length > 0) {
                const junkPlants = plantList.filter(p => p.name && p.name.startsWith(prefix));

                if (junkPlants.length > 0) {
                    cy.log(`🧹 Found ${junkPlants.length} test plants. Deleting...`);
                    junkPlants.forEach(plant => {
                        cy.request({
                            method: 'DELETE',
                            url: `${Cypress.env('apiUrl')}/plants/${plant.id}`,
                            headers: { 'Authorization': `Bearer ${cleanupToken}` },
                            failOnStatusCode: false
                        });
                    });
                }
            }
        });
    });
};

// GLOBAL BEFORE/AFTER
Before(() => cleanUpPlantApiData());
After(() => cleanUpPlantApiData());

// ADMIN AUTH TOKEN
Before(() => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') },
        failOnStatusCode: false
    }).then((res) => {
        authToken = res.body.token;
        if (!authToken) throw new Error("Admin token is not available");
        cy.log("Admin Token Retrieved");
    });
});

// CREATE SUB-CATEGORY BEFORE PLANT TESTS
Before(() => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
        const rootCategoryId = res.body[0].id; // root category

        const subCategoryName = `Plant${Math.floor(100 + Math.random() * 900)}`;

        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { Authorization: `Bearer ${authToken}` },
            body: { 
                name: subCategoryName,
                parent: { id: rootCategoryId } // sub-category
            }
        }).then((res) => {
            categoryId = res.body.id; // this must be used for TC_25
            cy.log(`Sub-category created: ${categoryId}`);
        });
    });
});

// API_TC_24 - Add Plant with Valid Data
When("I send a POST request to create a plant with valid data", () => {
    if (!categoryId) throw new Error("Cannot create plant: categoryId is missing");

    const uniquePlantName = `API_Plant_${Math.floor(1000 + Math.random() * 9000)}`;

    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        failOnStatusCode: false,
        body: {
            name: uniquePlantName,
            price: 500,
            quantity: 12
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Plant Create Response: " + JSON.stringify(res.body));
    });
});

// API_TC_25 - Missing Plant Name
When("I send a POST request to create a plant with empty name", () => {
    if (!categoryId) throw new Error("Cannot create plant: categoryId is missing");

    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        failOnStatusCode: false,
        body: {
            name: "",      
            price: 300,
            quantity: 5
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Plant Create Response (Empty Name): " + JSON.stringify(res.body));
    });
});

// API_TC_26 - Plant Name Less Than 3 Characters
When("I send a POST request to create a plant with name shorter than 3 characters", () => {
    if (!categoryId) throw new Error("Cannot create plant: categoryId is missing");

    const shortName = "AI"; // 2 characters, less than 3

    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        failOnStatusCode: false,
        body: {
            name: shortName,
            price: 300,
            quantity: 5
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Plant Create Response (Name Too Short): " + JSON.stringify(res.body));
    });
});

// API_TC_27 - Price zero or negative
When("I send a POST request to create a plant with price {int}", (priceValue) => {
    if (!categoryId) throw new Error("Cannot create plant: categoryId is missing");

    const uniquePlantName = `API_Plant_${Math.floor(1000 + Math.random() * 9000)}`;

    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        failOnStatusCode: false,
        body: {
            name: uniquePlantName,
            price: priceValue,
            quantity: 10
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Plant Create Response (Price Test): " + JSON.stringify(res.body));
    });
});

// API_TC_28 - Quantity negative
When("I send a POST request to create a plant with quantity {int}", (quantityValue) => {
    if (!categoryId) throw new Error("Cannot create plant: categoryId is missing");

    const uniquePlantName = `API_Plant_${Math.floor(1000 + Math.random() * 9000)}`;

    cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        failOnStatusCode: false,
        body: {
            name: uniquePlantName,
            price: 500, // valid price
            quantity: quantityValue
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Plant Create Response (Quantity Test): " + JSON.stringify(res.body));
    });
});


// COMMON THEN STEPS
Then("the plant response status should be {int}", (expectedStatus) => {
    expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response should indicate {string}", (expectedMessage) => {
    const detailsMessages = apiResponse.body.details
        ? Object.values(apiResponse.body.details).join(", ")
        : "";
    const actualMessage = detailsMessages || apiResponse.body.message || apiResponse.body.error;

    cy.log("Checking response message: " + actualMessage);
    expect(actualMessage).to.include(expectedMessage);
});

Then("the response body should contain the newly created plant details", () => {
    expect(apiResponse.body).to.have.property("id");
    expect(apiResponse.body).to.have.property("name");
    expect(apiResponse.body).to.have.property("price");
    expect(apiResponse.body).to.have.property("quantity");
});

Then("the response body should contain {string}", (expectedMessage) => {
    const actualMessage = apiResponse.body.message 
        || apiResponse.body.details?.name 
        || apiResponse.body.error 
        || apiResponse.body;
    cy.log("Checking response message: " + JSON.stringify(actualMessage));
    expect(JSON.stringify(actualMessage)).to.include(expectedMessage);
});
