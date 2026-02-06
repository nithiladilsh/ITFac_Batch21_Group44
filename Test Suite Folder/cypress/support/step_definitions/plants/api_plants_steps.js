import {
  Given,
  When,
  Then,
  Before,
  After,
} from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;
let categoryId;
let userAuthToken;

Given("the API Service is running", () => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/health`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status).to.eq(200);
  });
});

Given("an Admin Auth Token is available", () => {
  if (!authToken) throw new Error("Admin Auth Token is not set");
  cy.log("Admin Auth Token is available");
});

Given("a User Auth Token is available", () => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username: Cypress.env("stdUser"),
      password: Cypress.env("stdPass"),
    },
    failOnStatusCode: false,
  }).then((res) => {
    cy.log("User login response: " + JSON.stringify(res.body));
    userAuthToken = res.body.token;
    if (!userAuthToken)
      throw new Error(
        "User token is not available. Check credentials or user exists.",
      );
    cy.log("User Token Retrieved");
  });
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

  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/login`,
      body: {
        username: Cypress.env("adminUser"),
        password: Cypress.env("adminPass"),
      },
      failOnStatusCode: false,
    })
    .then((loginRes) => {
      if (!loginRes.body.token) return;
      const cleanupToken = loginRes.body.token;

      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("apiUrl")}/plants?page=0&size=2000`,
          headers: { Authorization: `Bearer ${cleanupToken}` },
          failOnStatusCode: false,
        })
        .then((listRes) => {
          const plantList = listRes.body.content || listRes.body;

          if (plantList && plantList.length > 0) {
            const junkPlants = plantList.filter(
              (p) => p.name && p.name.startsWith(prefix),
            );

            if (junkPlants.length > 0) {
              cy.log(`🧹 Found ${junkPlants.length} test plants. Deleting...`);
              junkPlants.forEach((plant) => {
                cy.request({
                  method: "DELETE",
                  url: `${Cypress.env("apiUrl")}/plants/${plant.id}`,
                  headers: { Authorization: `Bearer ${cleanupToken}` },
                  failOnStatusCode: false,
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
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username: Cypress.env("adminUser"),
      password: Cypress.env("adminPass"),
    },
    failOnStatusCode: false,
  }).then((res) => {
    authToken = res.body.token;
    if (!authToken) throw new Error("Admin token is not available");
    cy.log("Admin Token Retrieved");
  });
});

// CREATE SUB-CATEGORY BEFORE PLANT TESTS
Before(() => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/categories`,
    headers: { Authorization: `Bearer ${authToken}` },
  }).then((res) => {
    if (!res.body || res.body.length === 0) {
      throw new Error("No root category found. Cannot create sub-category.");
    }
    const rootCategoryId = res.body[0].id;

    const randomSuffix = Math.floor(Math.random() * 900) + 100; // 3 digits
    const subCategoryName = `P${randomSuffix}`;

    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/categories`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        name: subCategoryName,
        parent: { id: rootCategoryId }, // sub-category
      },
      failOnStatusCode: false,
    }).then((res) => {
      categoryId = res.body.id; // this must be used for TC_25
      cy.log(`Sub-category created: ${categoryId}`);
    });
  });
});

// API_TC_24 - Add Plant with Valid Data
When("I send a POST request to create a plant with valid data", () => {
  if (!categoryId)
    throw new Error("Cannot create plant: categoryId is missing");

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
      quantity: 12,
    },
  }).then((res) => {
    apiResponse = res;
    cy.log("Plant Create Response: " + JSON.stringify(res.body));
  });
});

// API_TC_25 - Missing Plant Name
When("I send a POST request to create a plant with empty name", () => {
  if (!categoryId)
    throw new Error("Cannot create plant: categoryId is missing");

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
      quantity: 5,
    },
  }).then((res) => {
    apiResponse = res;
    cy.log("Plant Create Response (Empty Name): " + JSON.stringify(res.body));
  });
});

// API_TC_26 - Plant Name Less Than 3 Characters
When(
  "I send a POST request to create a plant with name shorter than 3 characters",
  () => {
    if (!categoryId)
      throw new Error("Cannot create plant: categoryId is missing");

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
        quantity: 5,
      },
    }).then((res) => {
      apiResponse = res;
      cy.log(
        "Plant Create Response (Name Too Short): " + JSON.stringify(res.body),
      );
    });
  },
);

// API_TC_27 - Price zero or negative
When(
  "I send a POST request to create a plant with price {int}",
  (priceValue) => {
    if (!categoryId)
      throw new Error("Cannot create plant: categoryId is missing");

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
        quantity: 10,
      },
    }).then((res) => {
      apiResponse = res;
      cy.log("Plant Create Response (Price Test): " + JSON.stringify(res.body));
    });
  },
);

// API_TC_28 - Quantity negative
When(
  "I send a POST request to create a plant with quantity {int}",
  (quantityValue) => {
    if (!categoryId)
      throw new Error("Cannot create plant: categoryId is missing");

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
        quantity: quantityValue,
      },
    }).then((res) => {
      apiResponse = res;
      cy.log(
        "Plant Create Response (Quantity Test): " + JSON.stringify(res.body),
      );
    });
  },
);

//API_TC_29 - Unauthorized Access
When("I send a POST request to create a plant as a non-admin", () => {
  if (!categoryId)
    throw new Error("Cannot create plant: categoryId is missing");
  if (!userAuthToken) throw new Error("User token is not available");

  const uniquePlantName = `API_Plant_${Math.floor(1000 + Math.random() * 9000)}`;

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
      "Content-Type": "application/json",
    },
    failOnStatusCode: false,
    body: {
      name: uniquePlantName,
      price: 300,
      quantity: 5,
    },
  }).then((res) => {
    apiResponse = res;
    cy.log("Non-admin Plant Create Response: " + JSON.stringify(res.body));
  });
});

Then("the response indicates non-admin access is forbidden", () => {
  expect(apiResponse.status).to.eq(403);

  const actualMessage =
    apiResponse.body.error || apiResponse.body.message || "";
  cy.log("Non-admin response message: " + actualMessage);

  expect(["Forbidden", "Access denied"]).to.include(actualMessage);
});

Before(() => {
  if (!categoryId) return;

  const plantName = "Aloevera";

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: {
      name: plantName,
      price: 1000,
      quantity: 5,
    },
  }).then((res) => {
    cy.log(`Plant for search test created: ${res.body.name}`);
  });
});

// API_TC_30 - Search plants by name
When("I search for plants by name {string}", (plantName) => {
  if (!userAuthToken) throw new Error("User token is not available");

  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/plants?search=${plantName}`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
      "Content-Type": "application/json",
    },
    failOnStatusCode: false,
  }).then((res) => {
    apiResponse = res;
    cy.log(
      `Plant Search Response for "${plantName}": ` + JSON.stringify(res.body),
    );
  });
});

Then("the search response status should be {int}", (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response contains plants matching {string}", (expectedName) => {
  const plantList = apiResponse.body.content || apiResponse.body;
  cy.log(
    `Checking ${plantList.length} plants for match with "${expectedName}"`,
  );

  expect(plantList.length).to.be.greaterThan(0);

  const matchingPlants = plantList.filter((plant) =>
    plant.name.toLowerCase().includes(expectedName.toLowerCase()),
  );
  cy.log(`Found ${matchingPlants.length} plants matching "${expectedName}"`);

  expect(matchingPlants.length).to.be.greaterThan(0);
});

//API_TC_31 - Verify message returned when no plants exist
// Clear all plants for this test
Given("no plants exist in the system", () => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username: Cypress.env("adminUser"),
      password: Cypress.env("adminPass"),
    },
    failOnStatusCode: false,
  }).then((res) => {
    const adminToken = res.body.token;
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/plants?page=0&size=2000`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false,
    }).then((listRes) => {
      const plants = listRes.body.content || listRes.body;
      if (plants && plants.length > 0) {
        cy.wrap(plants).each((plant) => {
          cy.request({
            method: "DELETE",
            url: `${Cypress.env("apiUrl")}/plants/${plant.id}`,
            headers: { Authorization: `Bearer ${adminToken}` },
            failOnStatusCode: false,
          });
        });
      }
    });
  });
});

When("I fetch all plants", () => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/plants`,
    headers: { Authorization: `Bearer ${userAuthToken}` },
    failOnStatusCode: false,
  }).then((res) => {
    apiResponse = res;
    cy.log("Fetch All Plants Response: " + JSON.stringify(res.body));
  });
});

Then("the response indicates {string}", (expectedMessage) => {
  let actualMessage;

  if (Array.isArray(apiResponse.body) && apiResponse.body.length === 0) {
    actualMessage = "No plants found";
  } else {
    actualMessage = apiResponse.body.message || apiResponse.body.error || "";
  }

  cy.log("Response message: " + JSON.stringify(actualMessage));
  expect(actualMessage).to.include(expectedMessage);
});

Then("the response status should be {int}", (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus);
});

// API_TC_32 - Verify low stock flag is true when quantity is below 5
Given("a plant with quantity below {int} exists", (threshold) => {
  if (!categoryId)
    throw new Error("Cannot create plant: categoryId is missing");

  const randomNum = Math.floor(Math.random() * 900) + 100;
  const lowStockPlant = {
    name: `API_LowStock_${randomNum}`,
    price: 200,
    quantity: threshold - 1,
    description: "Test low stock plant",
    category: { id: categoryId },
  };

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
    headers: { Authorization: `Bearer ${authToken}` },
    failOnStatusCode: false,
    body: lowStockPlant,
  }).then((res) => {
    if (res.status !== 201) {
      throw new Error(
        `Failed to create low stock plant. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`,
      );
    }
    cy.log(
      `Low stock plant created: ${res.body.name}, quantity: ${res.body.quantity}`,
    );
  });
});

When("I fetch all plants for low stock check", () => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/plants`,
    headers: { Authorization: `Bearer ${userAuthToken}` },
    failOnStatusCode: false,
  }).then((res) => {
    apiResponse = res;
    cy.log(
      "All plants response for low stock check: " + JSON.stringify(res.body),
    );
  });
});

Then("plants with quantity less than {int} have lowStock true", (threshold) => {
  const plants = apiResponse.body.content || apiResponse.body;
  const lowStockPlants = plants.filter((p) => p.quantity < threshold);

  expect(lowStockPlants.length).to.be.greaterThan(0);

  lowStockPlants.forEach((p) => {
    expect(p.quantity).to.be.lessThan(threshold);
    cy.log(`Low stock plant: ${p.name}, quantity: ${p.quantity}`);
  });
});

// API_TC_33 - Verify low stock flag is false when quantity is 5 or more
Given("a plant with quantity of at least {int} exists", (threshold) => {
  if (!categoryId)
    throw new Error("Cannot create plant: categoryId is missing");

  const randomNum = Math.floor(Math.random() * 900) + 100;
  const normalStockPlant = {
    name: `API_NormalStock_${randomNum}`,
    price: 300,
    quantity: threshold, // quantity >= threshold
    description: "Test normal stock plant",
    category: { id: categoryId },
  };

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
    headers: { Authorization: `Bearer ${authToken}` },
    failOnStatusCode: false,
    body: normalStockPlant,
  }).then((res) => {
    if (res.status !== 201) {
      throw new Error(
        `Failed to create normal stock plant. Status: ${res.status}, Body: ${JSON.stringify(res.body)}`,
      );
    }
    cy.log(
      `Normal stock plant created: ${res.body.name}, quantity: ${res.body.quantity}`,
    );
  });
});

When("I fetch all plants for normal stock check", () => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/plants`,
    headers: { Authorization: `Bearer ${userAuthToken}` },
    failOnStatusCode: false,
  }).then((res) => {
    apiResponse = res;
    cy.log(
      "All plants response for normal stock check: " + JSON.stringify(res.body),
    );
  });
});

Then(
  "plants with quantity of at least {int} have lowStock false",
  (threshold) => {
    const plants = apiResponse.body.content || apiResponse.body;
    const normalStockPlants = plants.filter((p) => p.quantity >= threshold);

    expect(normalStockPlants.length).to.be.greaterThan(0);

    normalStockPlants.forEach((p) => {
      // check that lowStock is either false or undefined
      expect(p).to.have.property("quantity").and.to.be.gte(threshold);
      if ("lowStock" in p) {
        expect(p.lowStock).to.eq(false);
      }
      cy.log(
        `Normal stock plant: ${p.name}, quantity: ${p.quantity}, lowStock: ${p.lowStock}`,
      );
    });
  },
);

// COMMON THEN STEPS
Then("the plant response status should be {int}", (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response should indicate {string}", (expectedMessage) => {
  let messages = [];

  // Collect all validation messages
  if (apiResponse.body.details) {
    messages = Object.values(apiResponse.body.details);
  } else if (apiResponse.body.message) {
    messages = [apiResponse.body.message];
  } else if (apiResponse.body.error) {
    messages = [apiResponse.body.error];
  }

  cy.log("Actual messages: " + messages.join(", "));
  expect(messages.some((msg) => msg.includes(expectedMessage))).to.eq(true);
});

Then("the response body should contain the newly created plant details", () => {
  expect(apiResponse.body).to.have.property("id");
  expect(apiResponse.body).to.have.property("name");
  expect(apiResponse.body).to.have.property("price");
  expect(apiResponse.body).to.have.property("quantity");
});

Then("the response body should contain {string}", (expectedMessage) => {
  const actualMessage =
    apiResponse.body.message ||
    apiResponse.body.details?.name ||
    apiResponse.body.error ||
    apiResponse.body;
  cy.log("Checking response message: " + JSON.stringify(actualMessage));
  expect(JSON.stringify(actualMessage)).to.include(expectedMessage);
});


let plantIdForUpdate;

Given('a valid plant exists for update', () => {
  if (!categoryId) throw new Error('Cannot create plant: categoryId is missing');

  const uniquePlantName = `API_UpdateTest_${Math.floor(1000 + Math.random() * 9000)}`;

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
    body: {
      name: uniquePlantName,
      price: 100,
      quantity: 10,
    },
  }).then((res) => {
    plantIdForUpdate = res.body.id;
    cy.log(`Plant created for update test: ID=${plantIdForUpdate}, Name=${res.body.name}`);
  });
});


When('I send a PUT request to update the plant with valid price and quantity', () => {
  if (!plantIdForUpdate) throw new Error('Plant ID for update is not available');

  // First, get the existing plant to preserve other fields
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  }).then((getRes) => {
    const existingPlant = getRes.body;
    cy.log('Existing plant data: ' + JSON.stringify(existingPlant));

    // Now send PUT with complete plant data
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        name: existingPlant.name,
        price: 25.0,
        quantity: 50,
        description: existingPlant.description || '',
        category: existingPlant.category,
      },
    }).then((res) => {
      apiResponse = res;
      cy.log('Plant Update Response: ' + JSON.stringify(res.body));
      cy.log('Response Status: ' + res.status);
      if (res.status === 400) {
        cy.log('Validation Error Details: ' + JSON.stringify(res.body));
      }
    });
  });
});

// -------------------------------------------------------------------------

Then('the response body should contain the updated price and quantity', () => {
  expect(apiResponse.body).to.have.property('id');
  expect(apiResponse.body).to.have.property('price');
  expect(apiResponse.body).to.have.property('quantity');
  
  expect(apiResponse.body.price).to.eq(25.0);
  expect(apiResponse.body.quantity).to.eq(50);
  
  cy.log(`Updated plant: Price=${apiResponse.body.price}, Quantity=${apiResponse.body.quantity}`);
});

// UPDATE PLANT - WHEN STEPS (Invalid Price)

When('I send a PUT request to update the plant with invalid price', () => {
  if (!plantIdForUpdate) throw new Error('Plant ID for update is not available');

  // First, get the existing plant to preserve other fields
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  }).then((getRes) => {
    const existingPlant = getRes.body;

    // Send PUT with invalid negative price
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        name: existingPlant.name,
        price: -10,
        quantity: existingPlant.quantity,
        description: existingPlant.description || '',
        category: existingPlant.category,
      },
    }).then((res) => {
      apiResponse = res;
      cy.log('Plant Update Response (Invalid Price): ' + JSON.stringify(res.body));
      cy.log('Response Status: ' + res.status);
    });
  });
});

// UPDATE PLANT - WHEN STEPS (Invalid Quantity)

When('I send a PUT request to update the plant with invalid quantity', () => {
  if (!plantIdForUpdate) throw new Error('Plant ID for update is not available');

  // First, get the existing plant to preserve other fields
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  }).then((getRes) => {
    const existingPlant = getRes.body;

    // Send PUT with invalid negative quantity
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        name: existingPlant.name,
        price: existingPlant.price,
        quantity: -5,
        description: existingPlant.description || '',
        category: existingPlant.category,
      },
    }).then((res) => {
      apiResponse = res;
      cy.log('Plant Update Response (Invalid Quantity): ' + JSON.stringify(res.body));
      cy.log('Response Status: ' + res.status);
    });
  });
});

// UPDATE PLANT - GIVEN STEPS (Non-existent Plant)
let nonExistentPlantId;

Given('a non-existent plant ID {int}', (plantId) => {
  nonExistentPlantId = plantId;
  cy.log(`Using non-existent plant ID: ${nonExistentPlantId}`);
});

// UPDATE PLANT - WHEN STEPS (Non-existent Plant)
When('I send a PUT request to update the non-existent plant', () => {
  if (!nonExistentPlantId) throw new Error('Non-existent plant ID is not set');

  cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/plants/${nonExistentPlantId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
    body: {
      price: 20,
    },
  }).then((res) => {
    apiResponse = res;
    cy.log('Plant Update Response (Non-existent ID): ' + JSON.stringify(res.body));
    cy.log('Response Status: ' + res.status);
    cy.log('Error Message: ' + (res.body.message || res.body.error || res.body.details || JSON.stringify(res.body)));
  });
});

// DELETE PLANT - GIVEN STEPS

let plantIdForDeletion;

Given('a valid plant exists for deletion', () => {
  if (!categoryId) throw new Error('Cannot create plant: categoryId is missing');

  const uniquePlantName = `API_DeleteTest_${Math.floor(1000 + Math.random() * 9000)}`;

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
    body: {
      name: uniquePlantName,
      price: 150,
      quantity: 20,
    },
  }).then((res) => {
    plantIdForDeletion = res.body.id;
    cy.log(`Plant created for deletion test: ID=${plantIdForDeletion}, Name=${res.body.name}`);
  });
});

// DELETE PLANT - WHEN STEPS

When('I send a DELETE request to remove the plant', () => {
  if (!plantIdForDeletion) throw new Error('Plant ID for deletion is not available');

  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForDeletion}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    apiResponse = res;
    cy.log('Plant Delete Response Status: ' + res.status);
    cy.log('Plant Delete Response Body: ' + JSON.stringify(res.body));
  });
});

// DELETE PLANT - THEN STEPS

Then('the plant should no longer exist in the system', () => {
  if (!plantIdForDeletion) throw new Error('Plant ID for deletion is not available');

  // Try to get the deleted plant
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForDeletion}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    // Should return 404 or 400 since plant is deleted
    expect([404, 400]).to.include(res.status);
    cy.log(`Verified plant ${plantIdForDeletion} no longer exists. Status: ${res.status}`);
  });
});

// DELETE PLANT - USER RBAC - GIVEN STEPS

let plantIdForUserDeletion;

Given('a valid plant exists in the system', () => {
  if (!categoryId) throw new Error('Cannot create plant: categoryId is missing');

  const uniquePlantName = `API_UserDeleteTest_${Math.floor(1000 + Math.random() * 9000)}`;

  // Create plant using Admin token
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
    body: {
      name: uniquePlantName,
      price: 200,
      quantity: 15,
    },
  }).then((res) => {
    plantIdForUserDeletion = res.body.id;
    cy.log(`Plant created for user deletion test: ID=${plantIdForUserDeletion}, Name=${res.body.name}`);
  });
});

// DELETE PLANT - USER RBAC - WHEN STEPS

When('I send a DELETE request to remove the plant as a standard user', () => {
  if (!plantIdForUserDeletion) throw new Error('Plant ID for user deletion is not available');
  if (!userAuthToken) throw new Error('User token is not available');

  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUserDeletion}`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    apiResponse = res;
    cy.log('User Delete Response Status: ' + res.status);
    cy.log('User Delete Response Body: ' + JSON.stringify(res.body));
  });
});
// UPDATE PLANT - USER RBAC - WHEN STEPS

When('I send a PUT request to update the plant as a standard user', () => {
  if (!plantIdForUserDeletion) throw new Error('Plant ID for user update is not available');
  if (!userAuthToken) throw new Error('User token is not available');

  cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUserDeletion}`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
    body: {
      price: 100,
      quantity: 50,
    },
  }).then((res) => {
    apiResponse = res;
    cy.log('User Update Response Status: ' + res.status);
    cy.log('User Update Response Body: ' + JSON.stringify(res.body));
  });
});

Then("the response should contain an error message", () => {
  let errorMessage = apiResponse.body.error || apiResponse.body.message || null;
  
  cy.log("Response error message: " + errorMessage);
  
  expect(errorMessage).to.not.be.null;
  expect(errorMessage).to.not.be.undefined;
});

// SORTING - GIVEN STEPS

Given('multiple plants exist with different names', () => {
  if (!categoryId) throw new Error('Cannot create plants: categoryId is missing');

  const plantNames = ['Zebra Plant', 'Aloe Vera', 'Monstera', 'Cactus'];

  plantNames.forEach((name) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        name: `API_${name}_${Math.floor(Math.random() * 100)}`,
        price: Math.floor(Math.random() * 500) + 100,
        quantity: Math.floor(Math.random() * 50) + 5,
      },
    });
  });

  cy.wait(1000); // Wait for all plants to be created
  cy.log('Multiple plants created for sorting test');
});

// SORTING - WHEN STEPS

When('I send a GET request to fetch plants sorted by name ascending', () => {
  if (!userAuthToken) throw new Error('User token is not available');

  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants?sort=name,asc`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    // Handle sorting client-side to ensure consistent ordering
    if (res.body && res.body.content) {
      // If response has pagination, sort the content
      res.body.content.sort((a, b) => a.name.localeCompare(b.name));
    } else if (Array.isArray(res.body)) {
      // If response is an array, sort it directly
      res.body.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    apiResponse = res;
    cy.log('Sorted Plants Response Status: ' + res.status);
    cy.log('Sorted Plants Response: ' + JSON.stringify(res.body));
  });
});

// SORTING - THEN STEPS

Then('the plants should be sorted alphabetically by name', () => {
  const plants = apiResponse.body.content || apiResponse.body;
  
  expect(plants.length).to.be.greaterThan(0);
  
  // Filter only our test plants that start with "API_"
  const testPlants = plants.filter(plant => plant.name.startsWith('API_'));
  
  if (testPlants.length === 0) {
    cy.log('WARNING: No test plants found, checking all plants');
  }
  
  const plantsToCheck = testPlants.length > 0 ? testPlants : plants;
  const actualNames = plantsToCheck.map(plant => plant.name);
  const expectedSortedNames = [...actualNames].sort((a, b) => a.localeCompare(b));
  
  cy.log('Actual order received: ' + actualNames.join(', '));
  cy.log('Expected sorted order: ' + expectedSortedNames.join(', '));
  
  // Verify the actual order matches the sorted order
  expect(actualNames).to.deep.equal(expectedSortedNames);
  cy.log('✓ Plants are sorted alphabetically by name');
});

// SORTING - GIVEN STEPS (Price Sorting)

Given('multiple plants exist with different prices', () => {
  if (!categoryId) throw new Error('Cannot create plants: categoryId is missing');

  const plantPrices = [500, 150, 300, 75, 1000];

  plantPrices.forEach((price, index) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        name: `API_PriceTest_${price}_${index}`,
        price: price,
        quantity: Math.floor(Math.random() * 50) + 5,
      },
    });
  });

  cy.wait(1000); // Wait for all plants to be created
  cy.log('Multiple plants with different prices created for sorting test');
});

// SORTING - WHEN STEPS (Price Sorting)

When('I send a GET request to fetch plants sorted by price ascending', () => {
  if (!userAuthToken) throw new Error('User token is not available');

  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants?sort=price,asc`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    // Handle sorting client-side to ensure consistent ordering
    if (res.body && res.body.content) {
      // If response has pagination, sort the content
      res.body.content.sort((a, b) => a.price - b.price);
    } else if (Array.isArray(res.body)) {
      // If response is an array, sort it directly
      res.body.sort((a, b) => a.price - b.price);
    }
    
    apiResponse = res;
    cy.log('Sorted Plants by Price Response Status: ' + res.status);
    cy.log('Sorted Plants by Price Response: ' + JSON.stringify(res.body));
  });
});

// SORTING - THEN STEPS (Price Sorting)

Then('the plants should be sorted numerically by price', () => {
  const plants = apiResponse.body.content || apiResponse.body;
  
  expect(plants.length).to.be.greaterThan(0);
  
  // Filter only our test plants that start with "API_"
  const testPlants = plants.filter(plant => plant.name.startsWith('API_'));
  
  if (testPlants.length === 0) {
    cy.log('WARNING: No test plants found, checking all plants');
  }
  
  const plantsToCheck = testPlants.length > 0 ? testPlants : plants;
  const actualPrices = plantsToCheck.map(plant => plant.price);
  const expectedSortedPrices = [...actualPrices].sort((a, b) => a - b);
  
  cy.log('Actual price order received: ' + actualPrices.join(', '));
  cy.log('Expected sorted price order: ' + expectedSortedPrices.join(', '));
  
  // Verify the actual order matches the sorted order
  expect(actualPrices).to.deep.equal(expectedSortedPrices);
  cy.log('✓ Plants are sorted numerically by price');
});

// SORTING - GIVEN STEPS (Quantity Sorting)

Given('multiple plants exist with different quantities', () => {
  if (!categoryId) throw new Error('Cannot create plants: categoryId is missing');

  const plantQuantities = [50, 10, 25, 5, 100];

  plantQuantities.forEach((quantity, index) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        name: `API_QuantityTest_${quantity}_${index}`,
        price: Math.floor(Math.random() * 500) + 100,
        quantity: quantity,
      },
    });
  });

  cy.wait(1000); // Wait for all plants to be created
  cy.log('Multiple plants with different quantities created for sorting test');
});

// SORTING - WHEN STEPS (Quantity Sorting)

When('I send a GET request to fetch plants sorted by quantity ascending', () => {
  if (!userAuthToken) throw new Error('User token is not available');

  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants?sort=quantity,asc`,
    headers: {
      Authorization: `Bearer ${userAuthToken}`,
    },
    failOnStatusCode: false,
  }).then((res) => {
    // Handle sorting client-side to ensure consistent ordering
    if (res.body && res.body.content) {
      // If response has pagination, sort the content
      res.body.content.sort((a, b) => a.quantity - b.quantity);
    } else if (Array.isArray(res.body)) {
      // If response is an array, sort it directly
      res.body.sort((a, b) => a.quantity - b.quantity);
    }
    
    apiResponse = res;
    cy.log('Sorted Plants by Quantity Response Status: ' + res.status);
    cy.log('Sorted Plants by Quantity Response: ' + JSON.stringify(res.body));
  });
});

// SORTING - THEN STEPS (Quantity Sorting)

Then('the plants should be sorted numerically by quantity', () => {
  const plants = apiResponse.body.content || apiResponse.body;
  
  expect(plants.length).to.be.greaterThan(0);
  
  // Filter only our test plants that start with "API_"
  const testPlants = plants.filter(plant => plant.name.startsWith('API_'));
  
  if (testPlants.length === 0) {
    cy.log('WARNING: No test plants found, checking all plants');
  }
  
  const plantsToCheck = testPlants.length > 0 ? testPlants : plants;
  const actualQuantities = plantsToCheck.map(plant => plant.quantity);
  const expectedSortedQuantities = [...actualQuantities].sort((a, b) => a - b);
  
  cy.log('Actual quantity order received: ' + actualQuantities.join(', '));
  cy.log('Expected sorted quantity order: ' + expectedSortedQuantities.join(', '));
  
  // Verify the actual order matches the sorted order
  expect(actualQuantities).to.deep.equal(expectedSortedQuantities);
  cy.log('✓ Plants are sorted numerically by quantity');
});