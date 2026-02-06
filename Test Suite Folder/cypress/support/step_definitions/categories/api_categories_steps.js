import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";

let apiResponse;
let authToken;

// cleanup function to remove test data
const cleanUpApiData = () => {
    const prefix = "API_";

    cy.wait(2000);

    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') },
        failOnStatusCode: false
    }).then((loginRes) => {
        if (!loginRes.body.token) return;
        const cleanupToken = loginRes.body.token;

        cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=2000`,
            headers: { 'Authorization': `Bearer ${cleanupToken}` },
            failOnStatusCode: false
        }).then((listRes) => {
            if (listRes.body && listRes.body.content) {
                const junkItems = listRes.body.content.filter(c => {
                    const nameStr = String(c.name);
                    return nameStr.startsWith(prefix) || /^\d{5}$/.test(nameStr);
                });

                if (junkItems.length > 0) {
                    cy.log(`Found ${junkItems.length} bugged items. Deleting...`);
                    junkItems.forEach(item => {
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
};

// GLOBAL BEFORE: Clean up any leftovers from previous runs
Before(() => {
    cleanUpApiData();
});

// GLOBAL AFTER: Clean up what we just created
After(() => {
    cleanUpApiData();
});

// SEED DATA HOOK: Only for Pagination Test (@seed_data_for_pagination)
Before({ tags: "@seed_data_for_pagination" }, () => {
    cy.log("Seeding 5 dummy items for pagination test...");

    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') }
    }).then((loginRes) => {
        const seedToken = loginRes.body.token;

        // CHANGE 2: Create 5 items. 
        // "API_" (4) + "S0" (2) + "1" (1) = 7 chars total.
        for (let i = 1; i <= 5; i++) {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/categories`,
                headers: { 'Authorization': `Bearer ${seedToken}` },
                failOnStatusCode: false,
                body: { "name": `API_S0${i}`, "parent": null }
            });
        }
    });
});

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
When('I send a POST request to create a category with numeric name {int}', () => {
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
    const shortUniqueName = `API_G${Math.floor(1000 + Math.random() * 9000)}`;

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
    const uniqueName = `API_D${Math.floor(1000 + Math.random() * 9000)}`;

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
    const uniqueName = `API_S${Math.floor(1000 + Math.random() * 9000)}`;

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
        failOnStatusCode: false,
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

// API_TC_09 - Verify that the API rejects text strings in the Parent ID filter
When('I send a GET request to retrieve categories with parentId filter {string}', (filterValue) => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page`,
        failOnStatusCode: false,
        qs: {
            parentId: filterValue
        },
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Filter Validation Response: " + JSON.stringify(res.body));
    });
});

// API_TC_10 - Verify that the API rejects invalid Page Strings (e.g. "one")
When('I send a GET request to retrieve categories with invalid page {string} and size {int}', (pageStr, size) => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page`,
        failOnStatusCode: false,
        qs: {
            page: pageStr,
            size: size
        },
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Invalid Page String Response: " + JSON.stringify(res.body));
    });
});

// --- API_TC_34: Verify that deletion for a category is allowed ---
let deletableCategoryId;

Given('a category exists for deletion testing', () => {
    const uniqueName = `DEL${Math.floor(100 + Math.random() * 900)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: uniqueName,
            parent: null
        }
    }).then((res) => {
        expect(res.status).to.eq(201);
        deletableCategoryId = res.body.id;
    });
});

When('the Admin sends a DELETE request to the category deletion endpoint with a valid Admin Token', () => {
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/categories/${deletableCategoryId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'accept': 'application/json'
        }
    }).then((res) => {
        apiResponse = res;
    });
});

Then('the API should respond with a 204 No Content status', () => {
    expect(apiResponse.status).to.eq(204);
});

Then('the category should no longer exist', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${deletableCategoryId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        expect([404, 400]).to.include(res.status);
    });
});

// API_TC_35 - Verify that update for a category is allowed

When('the Admin sends a PUT request to the category update endpoint with a new name', () => {
    const newName = `UpdCName`;
    // Store for later verification
    Cypress.env('UpdatedCategoryName', newName);

    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/categories/${validCategoryId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: newName,
            parentId: null
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("API Response (Update Category): " + JSON.stringify(res.body));
    });
});

Then('the API should respond with a 200 OK status', () => {
    expect(apiResponse.status).to.eq(200);
});

Then('the category should have the updated name', () => {
    const updatedName = Cypress.env('UpdatedCategoryName');
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${validCategoryId}`,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.name).to.eq(updatedName);
    });
});

// API_TC_36 - Prevent deletion of category with active child categories
Given('Category A exists with Sub-Category B as its child', () => {
    // Create Category A
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            "name": "CategoryA",
            "parent": null
        }
    }).then((parentRes) => {
        expect(parentRes.status).to.eq(201);
        const categoryAId = parentRes.body.id;

        // Create Sub-Category B with parent field referencing Category A
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                "name": "SubB",
                "parent": {
                    "id": categoryAId
                }
            }
        }).then((childRes) => {
            expect(childRes.status).to.eq(201);
            Cypress.env('CategoryA_id', categoryAId);
            Cypress.env('SubCategoryB_id', childRes.body.id);
        });
    });
});


When('the Admin sends a DELETE request to the CategoryA endpoint with a valid Admin Token', () => {
    const categoryAId = Cypress.env('CategoryA_id');
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/categories/${categoryAId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'accept': 'application/json'
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Delete CategoryA Response: " + JSON.stringify(res.body));
    });
});

Then('the API should respond with a {int} Conflict status', (expectedStatus) => {
    expect(apiResponse.status).to.eq(expectedStatus);
});

Then('the API should respond with a 500 Internal Server Error status', () => {
    expect(apiResponse.status).to.eq(500);
});

Then('the response message should indicate that the category cannot be deleted due to active child categories', () => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || apiResponse.body;
    expect(actualMessage).to.include('Cannot delete category');
    expect(actualMessage).to.include('sub-categories');
});

// Check that Category A still exists
Then('Category A should still exist', () => {
    const categoryAId = Cypress.env('CategoryA_id');
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${categoryAId}`,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('id', categoryAId);
    });
});

// Check that Sub-Category B still exists
Then('Sub-Category B should still exist', () => {
    const subCategoryBId = Cypress.env('SubCategoryB_id');
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${subCategoryBId}`,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('id', subCategoryBId);
    });
});

// API_TC_37 - Verify error on deleting non-existent Category ID

Given('Category ID 99999 does not exist', () => {
    // Attempt to delete if it exists, ignore errors
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/categories/99999`,
        headers: { 'Authorization': `Bearer ${authToken}` },
        failOnStatusCode: false
    });
});

When('the Admin sends a DELETE request to the {string} endpoint with a valid Admin Token', (endpoint) => {
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}${endpoint}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'accept': 'application/json'
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Delete Non-existent Category Response: " + JSON.stringify(res.body));
    });
});

Then('the API should respond with a 404 Not Found status', () => {
    expect(apiResponse.status).to.eq(404);
});

Then('the response message should indicate that the category does not exist', () => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || apiResponse.body;
    expect(actualMessage).to.match(/not exist|not found/i);
});

Then('the system should remain stable', () => {
    // Optionally, check that the API is still responsive
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=1`,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => {
        expect(res.status).to.eq(200);
    });
});

// API_TC_38 - Verify that the API prevents updating a category name to a Null value
let validCategoryId;

Given('I create a category for update testing', () => {
    const shortName = `TC${Math.floor(100 + Math.random() * 900)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            "name": shortName,
            "parent": null
        }
    }).then((res) => {
        expect(res.status).to.eq(201);
        validCategoryId = res.body.id;
        cy.log(`Created category for update test: ${validCategoryId}`);
    });
});

// Step: When the Admin sends a PUT request to the "/categories/{id}" endpoint with body:
When('the Admin sends a PUT request to the category update endpoint with body', (dataTable) => {
    const row = dataTable.hashes()[0];
    const name = row.name === '<null>' ? null : row.name;

    // Determine which category ID to use
    let categoryId = validCategoryId || parentIntegrityCategoryId;
    let parentId = row.parentId;

    // If <self> is used, this is for the circular reference test
    if (parentId === '<self>') {
        categoryId = circularCategoryId;
        parentId = circularCategoryId;
    } else if (parentId === '<null>') {
        parentId = null;
    }

    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/categories/${categoryId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: name,
            parentId: parentId
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("PUT Null Name/Circular Parent Response: " + JSON.stringify(res.body));
    });
});


Then('the API should respond with a {int} Bad Request status', (expectedStatus) => {
    expect(apiResponse.status).to.eq(expectedStatus);
});

// API_TC_39 - Verify that the API prevents updating a category name to one that already exists

let categoryAId;
let categoryBId;

Given('two categories "A" and "B" exist for update uniqueness testing', () => {
    const nameA = 'A' + Math.floor(Math.random() * 1000);
    const nameB = 'B' + Math.floor(Math.random() * 1000);

    // Create category "A"
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: nameA,
            parent: null
        }
    }).then((resA) => {
        expect(resA.status).to.eq(201);
        categoryAId = resA.body.id;

        // Create category "B"
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                name: nameB,
                parent: null
            }
        }).then((resB) => {
            expect(resB.status).to.eq(201);
            categoryBId = resB.body.id;
            Cypress.env('CategoryA_name', nameA);
        });
    });
});

When('the Admin sends a PUT request to update category "B" with name "A"', () => {
    const nameA = Cypress.env('CategoryA_name');
    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/categories/${categoryBId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: nameA,
            parent: null
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("PUT Duplicate Name Response: " + JSON.stringify(res.body));
    });
});

Then('the API should respond with a 400 Bad Request or 403 Forbidden status', () => {
    expect([400, 403]).to.include(apiResponse.status);
});

Then('the response message should indicate "Name already exists"', () => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/name.*exist/i.test(actualMessage)).to.be.true;
});


// API_TC_40 - Prevent category from becoming its own parent (Circular Reference)
let circularCategoryId;
Given('I create a category for circular parent testing', () => {
    const uniqueName = `C${Math.floor(100 + Math.random() * 900)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: uniqueName,
            parent: null
        }
    }).then((res) => {
        expect(res.status).to.eq(201);
        circularCategoryId = res.body.id;
    });
});

// API_TC_40 - Prevent category from becoming its own parent (Circular Reference)

Then('the response message should indicate "Category cannot be its own parent"', () => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/category.*own.*parent/i.test(actualMessage)).to.be.true;
});

// API_TC_41 - Verify that the API rejects updating a category's parent to a non-existent ID

let parentIntegrityCategoryId;

Given('I create a category for parent integrity testing', () => {
    const uniqueName = `P${Math.floor(100 + Math.random() * 900)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: uniqueName,
            parent: null
        }
    }).then((res) => {
        expect(res.status).to.eq(201);
        parentIntegrityCategoryId = res.body.id;
        cy.log(`Created category for parent integrity test: ${parentIntegrityCategoryId}`);
    });
});

Then('the API should respond with a 400 Bad Request status or 404 Not Found status', () => {
    expect([400, 404]).to.include(apiResponse.status);
});


Then('the response message should indicate "Parent category not found"', () => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(
        /parent.*not.*found/i.test(actualMessage) ||
        /category.*not.*found/i.test(actualMessage)
    ).to.be.true;
});


// API_TC_42 Verify that the API correctly sorts the category list by Name in Ascending order


let userApiResponse;

// Step: Given multiple categories exist with different names
Given('multiple categories exist with different names', () => {
    const names = ['Alpha', 'Charlie', 'Bravo'];
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') }
    }).then((loginRes) => {
        const adminToken = loginRes.body.token;
        names.forEach(name => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/categories`,
                headers: { 'Authorization': `Bearer ${adminToken}` },
                failOnStatusCode: false,
                body: { name, parent: null }
            });
        });
    });
});

When('the user sends a GET request to {string} with a valid User Token', (endpoint) => {
    // Parse query params if present in the endpoint string
    const [path, queryString] = endpoint.split('?');
    let qs = {};
    if (queryString) {
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            qs[key.replace('sort', 'sortField')] = value.includes(',') ? value.split(',')[0] : value;
            if (key === 'sort') {
                // Handle sortDir if present
                const parts = value.split(',');
                if (parts.length > 1) {
                    qs['sortField'] = parts[0];
                    qs['sortDir'] = parts[1];
                }
            }
        });
    }
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}${path}`,
        failOnStatusCode: false,
        qs,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Sorted Categories Response: " + JSON.stringify(res.body));
    });
});

Then('the response status should be 200', () => {
    expect(apiResponse.status).to.eq(200);
});

Then('the category list should be returned in alphabetical order by Name \\(A to Z\\)', () => {
    const response = typeof apiResponse !== 'undefined' ? apiResponse : userApiResponse;
    const dataList = response.body.content ? response.body.content : response.body;
    const names = dataList.map(c => c.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(names, `Expected: ${JSON.stringify(sortedNames)}, Got: ${JSON.stringify(names)}`).to.deep.equal(sortedNames);
});

//API_TC_42 Verify that the API correctly sorts the category list by Parent Category

Given('multiple categories exist with different parent categories', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') }
    }).then((loginRes) => {
        const adminToken = loginRes.body.token;
        const parentNames = ['ParentA', 'ParentB', 'ParentC'];
        const childNames = ['ChildA', 'ChildB', 'ChildC'];
        const parentIds = [];

        // Create parent categories sequentially and collect their IDs
        cy.wrap(parentNames).each((name, idx, $list) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/categories`,
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                failOnStatusCode: false,
                body: { name, parent: null }
            }).then((res) => {
                expect(res.status).to.be.oneOf([200, 201]);
                parentIds.push(res.body.id);
            });
        }).then(() => {
            // Now that all parent IDs are collected, create children with correct parent
            cy.wrap(childNames).each((childName, idx) => {
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('apiUrl')}/categories`,
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    },
                    failOnStatusCode: false,
                    body: { name: childName, parent: { id: parentIds[idx] } }
                }).then((res) => {
                    expect(res.status).to.be.oneOf([200, 201]);
                });
            });
        });
    });
});

Then('the category list should be returned in ascending order by Parent Category \\(A to Z\\)', () => {
    const response = typeof apiResponse !== 'undefined' ? apiResponse : userApiResponse;
    const dataList = response.body.content ? response.body.content : response.body;

    // Use parentName field, treat "-" or null as empty string for sorting
    const parentNames = dataList.map(c => (c.parentName && c.parentName !== '-' ? c.parentName : ''));

    // Create a sorted copy for comparison
    const sortedParentNames = [...parentNames].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    expect(parentNames, `Expected: ${JSON.stringify(sortedParentNames)}, Got: ${JSON.stringify(parentNames)}`).to.deep.equal(sortedParentNames);
});

// API_TC_43 Verify that the API rejects requests containing invalid sort fields

Then('the response should contain the error message {string}', (expectedMessage) => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(actualMessage).to.include(expectedMessage);
});

// --- API_TC_44: Verify that the API correctly handles multiple sort parameters ---

Given('multiple categories exist with different parent categories and names', () => {
    // Create two parents and children with different names for complex sorting
    const uniqueSuffix = Date.now();
    const parentNames = [`ParA${uniqueSuffix}`, `ParB${uniqueSuffix}`];
    const childNames = [['Zeta', 'Alpha'], ['Omega', 'Beta']];
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') }
    }).then((loginRes) => {
        const adminToken = loginRes.body.token;
        let parentIds = [];
        cy.wrap(parentNames).each((parentName, idx) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/categories`,
                headers: { 'Authorization': `Bearer ${adminToken}` },
                failOnStatusCode: false,
                body: { name: parentName, parent: null }
            }).then((parentRes) => {
                parentIds[idx] = parentRes.body.id;
                // Create children for each parent
                childNames[idx].forEach(childName => {
                    cy.request({
                        method: 'POST',
                        url: `${Cypress.env('apiUrl')}/categories`,
                        headers: { 'Authorization': `Bearer ${adminToken}` },
                        failOnStatusCode: false,
                        body: { name: childName, parent: { id: parentRes.body.id } }
                    });
                });
            });
        });
    });
});

When('the user sends a GET request to "/categories/page?sort=parent,asc&sort=name,desc" with a valid User Token', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page`,
        failOnStatusCode: false,
        qs: {
            'sort': ['parent,asc', 'name,desc']
        },
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("Multi-sort Categories Response: " + JSON.stringify(res.body));
    });
});

Then('the category list should be sorted first by Parent Category in ascending order, then by Name in descending order', () => {
    const response = typeof apiResponse !== 'undefined' ? apiResponse : userApiResponse;
    const dataList = response.body.content ? response.body.content : response.body;

    // Group by parentName, then sort each group by name descending
    const grouped = {};
    dataList.forEach(c => {
        const parent = c.parentName || '';
        if (!grouped[parent]) grouped[parent] = [];
        grouped[parent].push(c.name);
    });

    // Get sorted parent names
    const sortedParentNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // For each parent, check names are sorted descending
    let lastParent = '';
    sortedParentNames.forEach(parent => {
        const names = grouped[parent];
        const sortedNames = [...names].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
        expect(names, `Names for parent "${parent}" should be sorted descending`).to.deep.equal(sortedNames);
        expect(parent >= lastParent, `Parent "${parent}" should be >= last parent "${lastParent}"`).to.be.true;
        lastParent = parent;
    });
});

// --- API_TC_45: Verify that Standard Users are forbidden from deleting categories ---

Given('a category exists to be deleted', () => {
    // Create a category as admin for deletion attempt
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') }
    }).then((loginRes) => {
        const adminToken = loginRes.body.token;
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                name: `DelCat`,
                parent: null
            }
        }).then((res) => {
            expect(res.status).to.eq(201);
            Cypress.env('UserDeleteCategoryId', res.body.id);
        });
    });
});

When('the user sends a DELETE request to the category endpoint with a valid User Token', () => {
    const categoryId = Cypress.env('UserDeleteCategoryId');
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/categories/${categoryId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'accept': 'application/json'
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("User Delete Attempt Response: " + JSON.stringify(res.body));
    });
});

Then('the API should respond with a 403 Forbidden status or 401 Unauthorized status', () => {
    expect([403, 401]).to.include(apiResponse.status);
});

Then('the response message should indicate that the request is denied', () => {
    const actualMessage = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/denied|forbidden|not allowed|unauthorized/i.test(actualMessage)).to.be.true;
});

// --- API_TC_45: Verify that Standard Users are forbidden from updating categories ---

Given('a category exists to be updated', () => {
    // Create a category as admin for update attempt
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') }
    }).then((loginRes) => {
        const adminToken = loginRes.body.token;
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                name: `UpdCat`,
                parent: null
            }
        }).then((res) => {
            expect(res.status).to.eq(201);
            Cypress.env('UserUpdateCategoryId', res.body.id);
        });
    });
});

When('the user sends a PUT request to the category endpoint with a valid User Token', () => {
    const categoryId = Cypress.env('UserUpdateCategoryId');
    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/categories/${categoryId}`,
        failOnStatusCode: false,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: {
            name: `UpdatedName_${Date.now()}`,
            parent: null
        }
    }).then((res) => {
        apiResponse = res;
        cy.log("User Update Category Response: " + JSON.stringify(res.body));
    });
});
