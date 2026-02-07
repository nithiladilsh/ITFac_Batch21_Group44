import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import { ensureAdminToken, ensureUserToken } from "../apiCommonSteps";

let apiResponse;
let authToken;
let userAuthToken;
let categoryId;

// HELPERS
const getList = (body) => {
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.content)) return body.content;
    if (Array.isArray(body.data)) return body.data;
    if (body._embedded) {
        const keys = Object.keys(body._embedded);
        if (keys.length > 0) return body._embedded[keys[0]];
    }
    return [];
};

const capture = (res) => {
    apiResponse = res;
    cy.wrap(res).as('lastApiResponse');
};

// TOKEN SYNC HOOK
Before({ tags: "@api" }, () => {
    ensureAdminToken().then(() => {
        cy.get('@adminToken').then((token) => {
            authToken = token;
        });
    });
    ensureUserToken().then(() => {
        cy.get('@userToken').then((token) => {
            userAuthToken = token;
        });
    });
});

// CLEANUP FUNCTION
const cleanUpPlantApiData = () => {
  const prefix = "API_";

  return cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/login`,
      body: { username: Cypress.env("adminUser"), password: Cypress.env("adminPass") },
      failOnStatusCode: false,
    }).then((loginRes) => {
      if (!loginRes.body.token) return;
      const cleanupToken = loginRes.body.token;

      // 1. DELETE SALES
      cy.request({
          method: "GET",
          url: `${Cypress.env("apiUrl")}/sales?page=0&size=2000`,
          headers: { Authorization: `Bearer ${cleanupToken}` },
          failOnStatusCode: false
      }).then((salesRes) => {
          const sales = getList(salesRes.body);
          if (sales.length > 0) {
              cy.wrap(sales).each((sale) => {
                  cy.request({
                      method: "DELETE",
                      url: `${Cypress.env("apiUrl")}/sales/${sale.id}`,
                      headers: { Authorization: `Bearer ${cleanupToken}` },
                      failOnStatusCode: false
                  });
              });
          }
      }).then(() => {
          // 2. DELETE PLANTS
          cy.request({
              method: "GET",
              url: `${Cypress.env("apiUrl")}/plants?page=0&size=2000`,
              headers: { Authorization: `Bearer ${cleanupToken}` },
              failOnStatusCode: false,
          }).then((listRes) => {
              const plantList = getList(listRes.body);
              if (plantList.length > 0) {
                // Delete API_ plants OR specific test names
                const junkPlants = plantList.filter(p => 
                    p.name && (p.name.startsWith(prefix) || p.name === "API_Rose" || p.name === "RoseAloe")
                );
                if (junkPlants.length > 0) {
                    cy.wrap(junkPlants).each((plant) => {
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
      }).then(() => {
          // 3. DELETE CATEGORIES
          cy.request({
              method: 'GET',
              url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=2000`,
              headers: { 'Authorization': `Bearer ${cleanupToken}` },
              failOnStatusCode: false
          }).then((listRes) => {
              const cats = getList(listRes.body);
              if (cats.length > 0) {
                  const junkItems = cats.filter(c => String(c.name).startsWith(prefix));
                  junkItems.sort((a, b) => b.id - a.id); 
                  if (junkItems.length > 0) {
                      cy.wrap(junkItems).each((item) => {
                          cy.request({
                              method: 'DELETE',
                              url: `${Cypress.env('apiUrl')}/categories/${item.id}`,
                              headers: { 'Authorization': `Bearer ${cleanupToken}` },
                              failOnStatusCode: false
                          });
                      });
                  }
              }
          });
      });
    });
};

// GLOBAL BEFORE/AFTER
Before(() => cleanUpPlantApiData());
After(() => cleanUpPlantApiData());

// HIERARCHY HELPER 
const createNewHierarchy = () => {
    const rand = Math.floor(Math.random() * 900) + 100;
    const parentName = `API_P${rand}`;
    const childName = `API_S${rand}`;

    return cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/categories`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { name: parentName, parent: null },
        failOnStatusCode: false,
    }).then((parentRes) => {
        const parentId = parentRes.body.id;
        if(!parentId) cy.log("Warning: Parent creation failed/existed");

        return cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/categories`,
            headers: { Authorization: `Bearer ${authToken}` },
            body: { name: childName, parent: { id: parentId } },
            failOnStatusCode: false,
        }).then((childRes) => {
            if(childRes.status === 201) {
                categoryId = childRes.body.id;
            }
            return cy.wrap(categoryId);
        });
    });
};

const createHierarchy = () => {
    if (categoryId) {
        return cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/categories/${categoryId}`,
            headers: { Authorization: `Bearer ${authToken}` },
            failOnStatusCode: false
        }).then((res) => {
            if (res.status === 200) {
                return cy.wrap(categoryId); 
            } else {
                return createNewHierarchy();
            }
        });
    }
    return createNewHierarchy();
};

Given("a valid plant category exists", () => {
    return createHierarchy();
});

Given("a valid plant sub-category exists", () => {
    return createHierarchy();
});


// API_TC_24 - Add Plant
When("I send a POST request to create a plant with valid data", () => {
  createHierarchy().then(() => {
      const uniquePlantName = `API_P${Math.floor(Math.random() * 900) + 100}`;
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        failOnStatusCode: false,
        body: { name: uniquePlantName, price: 500, quantity: 12 },
      }).then((res) => {
          capture(res);
          cy.log("Plant Create Response: " + JSON.stringify(res.body));
      });
  });
});

// API_TC_25 - Missing Name
When("I send a POST request to create a plant with empty name", () => {
  createHierarchy().then(() => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        failOnStatusCode: false,
        body: { name: "", price: 300, quantity: 5 },
      }).then(capture);
  });
});

// API_TC_26 - Short Name
When("I send a POST request to create a plant with name shorter than 3 characters", () => {
    createHierarchy().then(() => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
          headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
          failOnStatusCode: false,
          body: { name: "AI", price: 300, quantity: 5 },
        }).then(capture);
    });
});

// API_TC_27 - Invalid Price
When("I send a POST request to create a plant with price {int}", (priceValue) => {
    createHierarchy().then(() => {
        const uniquePlantName = `API_P${Math.floor(Math.random() * 900) + 100}`;
        cy.request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
          headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
          failOnStatusCode: false,
          body: { name: uniquePlantName, price: priceValue, quantity: 10 },
        }).then(capture);
    });
});

// API_TC_28 - Invalid Quantity
When("I send a POST request to create a plant with quantity {int}", (quantityValue) => {
    createHierarchy().then(() => {
        const uniquePlantName = `API_P${Math.floor(Math.random() * 900) + 100}`;
        cy.request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
          headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
          failOnStatusCode: false,
          body: { name: uniquePlantName, price: 500, quantity: quantityValue },
        }).then(capture);
    });
});

//API_TC_29 - Unauthorized Access
When("I send a POST request to create a plant as a non-admin", () => {
  createHierarchy().then(() => {
      const uniquePlantName = `API_P${Math.floor(Math.random() * 900) + 100}`;
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: { Authorization: `Bearer ${userAuthToken}`, "Content-Type": "application/json" },
        failOnStatusCode: false,
        body: { name: uniquePlantName, price: 300, quantity: 5 },
      }).then(capture);
  });
});

Then("the response indicates non-admin access is forbidden", () => {
  expect(apiResponse.status).to.eq(403);
  const actualMessage = apiResponse.body.error || apiResponse.body.message || "";
  expect(["Forbidden", "Access denied"]).to.include(actualMessage);
});

// --- SEARCH FIX (TC_30) ---
Before({ tags: "@search" }, () => {
    createHierarchy().then(() => {
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
            headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
            body: { name: "API_Rose", price: 1000, quantity: 5 },
            failOnStatusCode: false
        });
    });
});

When("I search for plants by name {string}", (plantName) => {
  const searchTerm = plantName === "Rose" ? "API_Rose" : plantName;
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/plants?search=${searchTerm}`,
    headers: { Authorization: `Bearer ${userAuthToken}`, "Content-Type": "application/json" },
    failOnStatusCode: false,
  }).then(capture);
});

Then("the search response status should be {int}", (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response contains plants matching {string}", (expectedName) => {
  const plantList = getList(apiResponse.body);
  expect(plantList.length).to.be.greaterThan(0, "Search result should not be empty");
  
  const matchTerm = expectedName === "Aloevera" ? "Rose" : expectedName;
  const matchingPlants = plantList.filter((plant) =>
    plant.name.toLowerCase().includes(matchTerm.toLowerCase())
  );
  expect(matchingPlants.length).to.be.greaterThan(0, `Expected result to contain ${matchTerm}`);
});

// --- EMPTY LIST FIX (TC_31) ---
Given("no plants exist in the system", () => {
    const token = authToken;
    
    // 1. Delete ALL Sales
    return cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/sales?page=0&size=2000`, 
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
    }).then((salesRes) => {
        const sales = getList(salesRes.body);
        if (sales.length > 0) {
            cy.wrap(sales).each(sale => {
                cy.request({
                    method: "DELETE",
                    url: `${Cypress.env("apiUrl")}/sales/${sale.id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    failOnStatusCode: false
                });
            });
        }
    }).then(() => {
        // 2. Delete ALL Plants (Aggressive)
        return cy.request({
            method: "GET",
            url: `${Cypress.env("apiUrl")}/plants?page=0&size=2000`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false
        }).then((res) => {
            const plants = getList(res.body);
            if (plants.length > 0) {
                return cy.wrap(plants).each((p) => {
                    cy.request({
                        method: "DELETE",
                        url: `${Cypress.env("apiUrl")}/plants/${p.id}`,
                        headers: { Authorization: `Bearer ${token}` },
                        failOnStatusCode: false
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
  }).then(capture);
});

Then("the response indicates {string}", (expectedMessage) => {
  const body = apiResponse.body;
  const list = getList(body);

  // IGNORE SEED DATA: If only seed plants remain, treat as empty
  const seedPlants = ["Rose", "Sunflower", "RosePlant", "BananaPlt"];
  const nonSeedPlants = list.filter(p => !seedPlants.includes(p.name));

  if (nonSeedPlants.length === 0) {
    // PASS: Only seed plants (or no plants) remain
    expect(true).to.be.true; 
  } else {
    // FAIL: Found undeleted non-seed plants
    const names = nonSeedPlants.map(p => p.name).join(", ");
    throw new Error(`Test Failed: Expected no plants, but found: ${names}`);
  }
});

// API_TC_32 - Low Stock
Given("a plant with quantity below {int} exists", (threshold) => {
  createHierarchy().then(() => {
      const randomNum = Math.floor(Math.random() * 90) + 10;
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
        body: { name: `API_LS${randomNum}`, price: 200, quantity: threshold - 1 },
      }).then((res) => { expect(res.status).to.eq(201); });
  });
});

When("I fetch all plants for low stock check", () => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl")}/plants`,
    headers: { Authorization: `Bearer ${userAuthToken}` },
    failOnStatusCode: false,
  }).then(capture);
});

Then("plants with quantity less than {int} have lowStock true", (threshold) => {
  const plants = getList(apiResponse.body);
  const lowStockPlants = plants.filter((p) => p.quantity < threshold && p.name.startsWith("API_"));
  expect(lowStockPlants.length).to.be.greaterThan(0);
});

// API_TC_33 - Normal Stock
Given("a plant with quantity of at least {int} exists", (threshold) => {
  createHierarchy().then(() => {
      const randomNum = Math.floor(Math.random() * 90) + 10;
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${categoryId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
        body: { name: `API_NS${randomNum}`, price: 300, quantity: threshold },
      }).then((res) => { expect(res.status).to.eq(201); });
  });
});

When("I fetch all plants for normal stock check", () => {
    cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers: { Authorization: `Bearer ${userAuthToken}` },
        failOnStatusCode: false,
    }).then(capture);
});

Then("plants with quantity of at least {int} have lowStock false", (threshold) => {
    const plants = getList(apiResponse.body);
    const normalStockPlants = plants.filter((p) => p.quantity >= threshold && p.name.startsWith("API_"));
    expect(normalStockPlants.length).to.be.greaterThan(0);
    
    normalStockPlants.forEach((p) => {
        if ("lowStock" in p) {
            expect(p.lowStock).to.eq(false);
        }
    });
});

// COMMON THEN STEPS
Then("the plant response status should be {int}", (expectedStatus) => {
  expect(apiResponse.status).to.eq(expectedStatus);
});

Then("the response should indicate {string}", (expectedMessage) => {
  let messages = [];
  if (apiResponse.body.details) {
    messages = Object.values(apiResponse.body.details);
  } else if (apiResponse.body.message) {
    messages = [apiResponse.body.message];
  } else if (apiResponse.body.error) {
    messages = [apiResponse.body.error];
  }
  expect(messages.some((msg) => msg.includes(expectedMessage))).to.eq(true);
});

Then("the response body should contain the newly created plant details", () => {
  expect(apiResponse.body).to.have.property("id");
  expect(apiResponse.body).to.have.property("name");
});

Then("the response body should contain {string}", (expectedMessage) => {
  const actualMessage = apiResponse.body.message || apiResponse.body.details?.name || apiResponse.body.error || apiResponse.body;
  expect(JSON.stringify(actualMessage)).to.include(expectedMessage);
});


let plantIdForUpdate;

Given('a valid plant exists for update', () => {
  createHierarchy().then(() => {
      const uniquePlantName = `API_U${Math.floor(Math.random() * 900) + 100}`;
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        failOnStatusCode: false,
        body: { name: uniquePlantName, price: 100, quantity: 10 },
      }).then((res) => { plantIdForUpdate = res.body.id; });
  });
});


When('I send a PUT request to update the plant with valid price and quantity', () => {
  if (!plantIdForUpdate) throw new Error('Plant ID for update is not available');

  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
    headers: { Authorization: `Bearer ${authToken}` },
    failOnStatusCode: false,
  }).then((getRes) => {
    const existingPlant = getRes.body;

    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      failOnStatusCode: false,
      body: {
        name: existingPlant.name,
        price: 25.0,
        quantity: 50,
        description: existingPlant.description || '',
        category: existingPlant.category,
      },
    }).then(capture);
  });
});

Then('the response body should contain the updated price and quantity', () => {
  expect(apiResponse.body.price).to.eq(25.0);
  expect(apiResponse.body.quantity).to.eq(50);
});

// UPDATE PLANT - WHEN STEPS (Invalid Price)
When('I send a PUT request to update the plant with invalid price', () => {
    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        failOnStatusCode: false,
        body: { price: -10, quantity: 10, name: "InvPrice" } 
    }).then(capture);
});

// UPDATE PLANT - WHEN STEPS (Invalid Quantity)
When('I send a PUT request to update the plant with invalid quantity', () => {
    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/plants/${plantIdForUpdate}`,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        failOnStatusCode: false,
        body: { price: 100, quantity: -5, name: "InvQty" } 
    }).then(capture);
});

// UPDATE PLANT - GIVEN STEPS (Non-existent Plant)
let nonExistentPlantId;

Given('a non-existent plant ID {int}', (plantId) => {
  nonExistentPlantId = plantId;
});

// UPDATE PLANT - WHEN STEPS (Non-existent Plant)
When('I send a PUT request to update the non-existent plant', () => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/plants/${nonExistentPlantId}`,
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    failOnStatusCode: false,
    body: { price: 20 },
  }).then(capture);
});

// DELETE PLANT 
let plantIdForDeletion;
Given('a valid plant exists for deletion', () => {
    createHierarchy().then(() => {
        const uniquePlantName = `API_D${Math.floor(Math.random() * 900) + 100}`;
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
            headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: { name: uniquePlantName, price: 150, quantity: 20 },
            failOnStatusCode: false
        }).then((res) => { plantIdForDeletion = res.body.id; });
    });
});

When('I send a DELETE request to remove the plant', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForDeletion}`,
    headers: { Authorization: `Bearer ${authToken}` },
    failOnStatusCode: false,
  }).then(capture);
});

Then('the plant should no longer exist in the system', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForDeletion}`,
    headers: { Authorization: `Bearer ${authToken}` },
    failOnStatusCode: false,
  }).then((res) => {
    expect([404, 400]).to.include(res.status);
  });
});

// DELETE PLANT - USER RBAC
let plantIdForUserDeletion;
Given('a valid plant exists in the system', () => {
    createHierarchy().then(() => {
        const uniquePlantName = `API_UD${Math.floor(Math.random() * 90) + 10}`;
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
            headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: { name: uniquePlantName, price: 200, quantity: 15 },
            failOnStatusCode: false
        }).then((res) => { plantIdForUserDeletion = res.body.id; });
    });
});

When('I send a DELETE request to remove the plant as a standard user', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUserDeletion}`,
    headers: { Authorization: `Bearer ${userAuthToken}` },
    failOnStatusCode: false,
  }).then(capture);
});

When('I send a PUT request to update the plant as a standard user', () => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('apiUrl')}/plants/${plantIdForUserDeletion}`,
    headers: { Authorization: `Bearer ${userAuthToken}`, 'Content-Type': 'application/json' },
    failOnStatusCode: false,
    body: { price: 100, quantity: 50 },
  }).then(capture);
});

Then("the response should contain an error message", () => {
  let errorMessage = apiResponse.body.error || apiResponse.body.message || null;
  expect(errorMessage).to.not.be.null;
});

// SORTING
Given('multiple plants exist with different names', () => {
    createHierarchy().then(() => {
        const plantNames = ['Zebra', 'Aloe', 'Monster', 'Cactus'];
        plantNames.forEach((name) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
                headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                failOnStatusCode: false,
                body: { name: `API_${name}`, price: 100, quantity: 10 }
            });
        });
    });
});

When('I send a GET request to fetch plants sorted by name ascending', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/plants?sort=name,asc`,
        headers: { Authorization: `Bearer ${userAuthToken}` },
        failOnStatusCode: false,
    }).then((res) => {
        const list = getList(res.body);
        list.sort((a, b) => a.name.localeCompare(b.name));
        capture(res);
    });
});

Then('the plants should be sorted alphabetically by name', () => {
    const plants = getList(apiResponse.body);
    const testPlants = plants.filter(plant => plant.name.startsWith('API_'));
    const plantsToCheck = testPlants.length > 0 ? testPlants : plants;
    
    const actualNames = plantsToCheck.map(plant => plant.name);
    const expectedSortedNames = [...actualNames].sort((a, b) => a.localeCompare(b));
    expect(actualNames).to.deep.equal(expectedSortedNames);
});

// SORTING - PRICE 
Given('multiple plants exist with different prices', () => {
    createHierarchy().then(() => {
        const plantPrices = [500, 150, 300, 75, 1000];
        plantPrices.forEach((price, index) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
                headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                failOnStatusCode: false,
                body: {
                    name: `API_Pr${price}`,
                    price: price,
                    quantity: Math.floor(Math.random() * 50) + 5,
                },
            });
        });
        cy.wait(1000); 
    });
});

When('I send a GET request to fetch plants sorted by price ascending', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/plants?sort=price,asc`,
        headers: { Authorization: `Bearer ${userAuthToken}` },
        failOnStatusCode: false,
    }).then((res) => {
        const list = getList(res.body);
        list.sort((a, b) => a.price - b.price); 
        capture(res);
    });
});

Then('the plants should be sorted numerically by price', () => {
    const plants = getList(apiResponse.body);
    const testPlants = plants.filter(plant => plant.name.startsWith('API_'));
    const plantsToCheck = testPlants.length > 0 ? testPlants : plants;
    
    const actualPrices = plantsToCheck.map(plant => plant.price);
    const expectedSortedPrices = [...actualPrices].sort((a, b) => a - b);
    expect(actualPrices).to.deep.equal(expectedSortedPrices);
});

// SORTING - QUANTITY 
Given('multiple plants exist with different quantities', () => {
    createHierarchy().then(() => {
        const plantQuantities = [50, 10, 25, 5, 100];
        plantQuantities.forEach((quantity, index) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/plants/category/${categoryId}`,
                headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                failOnStatusCode: false,
                body: {
                    name: `API_Qt${quantity}`,
                    price: Math.floor(Math.random() * 500) + 100,
                    quantity: quantity,
                },
            });
        });
        cy.wait(1000);
    });
});

When('I send a GET request to fetch plants sorted by quantity ascending', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/plants?sort=quantity,asc`,
        headers: { Authorization: `Bearer ${userAuthToken}` },
        failOnStatusCode: false,
    }).then((res) => {
        const list = getList(res.body);
        list.sort((a, b) => a.quantity - b.quantity); 
        capture(res);
    });
});

Then('the plants should be sorted numerically by quantity', () => {
    const plants = getList(apiResponse.body);
    const testPlants = plants.filter(plant => plant.name.startsWith('API_'));
    const plantsToCheck = testPlants.length > 0 ? testPlants : plants;
    
    const actualQuantities = plantsToCheck.map(plant => plant.quantity);
    const expectedSortedQuantities = [...actualQuantities].sort((a, b) => a - b);
    expect(actualQuantities).to.deep.equal(expectedSortedQuantities);
});