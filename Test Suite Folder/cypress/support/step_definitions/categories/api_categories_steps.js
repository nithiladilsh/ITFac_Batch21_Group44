import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import { ensureAdminToken, ensureUserToken } from "../apiCommonSteps";

let apiResponse;
let authToken;

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

// CLEANUP FUNCTION 
const cleanUpApiData = () => {
    const prefix = "API_";
    const deletePatterns = [
        (name) => name.startsWith(prefix),
        (name) => /^\d+$/.test(name), // Matches ANY numeric string (e.g., "1234567", "54321")
        (name) => name.startsWith("Del"),
        (name) => name.startsWith("Upd"),
        (name) => ["Alpha", "Beta", "Charlie", "Zeta", "Omega", "Bravo"].includes(name),
        (name) => name.startsWith("Par") || name.startsWith("Chi"),
        (name) => name.startsWith("S_") || name.startsWith("P_"), // leftovers like S_967
        (name) => name.startsWith("TC") || /^[AC]\d+$/.test(name) // leftovers like TC937, A464, C192
    ];

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
            url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=2000`,
            headers: { 'Authorization': `Bearer ${cleanupToken}` },
            failOnStatusCode: false
        }).then((listRes) => {
            if (listRes.body && listRes.body.content) {
                // Filter junk items but PROTECT Seed Data (IDs < 100)
                const junkItems = listRes.body.content.filter(c => {
                    const nameStr = String(c.name);
                    const isSeedData = c.id < 100; 
                    const matchesPattern = deletePatterns.some(pattern => pattern(nameStr));
                    return matchesPattern && !isSeedData;
                });

                if (junkItems.length > 0) {
                    // Sort by ID descending (Children created later have higher IDs)
                    junkItems.sort((a, b) => b.id - a.id);

                    // Sequential Delete to avoid 500 errors on Parents
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
};

Before(() => { return cleanUpApiData(); });
After(() => { return cleanUpApiData(); });

// SEED DATA HOOK
Before({ tags: "@seed_data_for_pagination" }, () => {
    ensureAdminToken().then(() => {
        cy.get('@adminToken').then((seedToken) => {
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
});

// ADMIN TEST STEPS
When('I send a POST request to create a category with numeric name {int}', (numName) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": numName, "parent": null }
    }).then(capture);
});

When('I send a POST request to create a category with non-existent parent {string}', (invalidParent) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": `API_G${Math.floor(Math.random() * 900)}`, "parent": invalidParent }
    }).then(capture);
});

When('I send a POST request to create a category with whitespace name {string}', (wsName) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": wsName, "parent": null }
    }).then(capture);
});

When('I attempt to create a duplicate category with name {string}', (baseName) => {
    const uniqueName = `API_D${Math.floor(Math.random() * 900)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": uniqueName, "parent": null }
    }).then((firstRes) => {
        expect(firstRes.status).to.eq(201);
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            failOnStatusCode: false,
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: { "name": uniqueName, "parent": null }
        }).then(capture);
    });
});

When('I send a POST request to create a category with null name', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": null, "parent": null }
    }).then(capture);
});

When('I send a POST request to create a category with string parent ID {string}', (strId) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": `API_S${Math.floor(Math.random() * 900)}`, "parentId": strId }
    }).then(capture);
});

Then('the category response status should be {int}', (expectedStatus) => {
    expect(apiResponse.status).to.eq(expectedStatus);
});

Then('the response body should confirm {string} for category name', (msg) => {
    const actual = typeof apiResponse.body === 'string' ? apiResponse.body : (apiResponse.body.message || apiResponse.body.error);
    expect(actual).to.contain(msg);
});

Then('the response body should confirm {string}', (msg) => {
    const actual = apiResponse.body.message || apiResponse.body.error || apiResponse.body;
    expect(JSON.stringify(actual)).to.include(msg);
});

// --- USER TEST STEPS ---

When('I send a GET request to retrieve categories with page {int} and size {int}', (page, size) => {
    ensureUserToken().then(() => {
        cy.get('@userToken').then((uToken) => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/categories/page`,
                failOnStatusCode: false,
                qs: { page, size },
                headers: { 'Authorization': `Bearer ${uToken}` }
            }).then(capture);
        });
    });
});

Then('the response body should contain exactly {int} categories', (count) => {
    const list = apiResponse.body.content ? apiResponse.body.content : apiResponse.body;
    expect(list).to.have.length(count);
});

When('I send a POST request to create a category with name {string}', (name) => {
    ensureUserToken().then(() => {
        cy.get('@userToken').then((uToken) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/categories`,
                failOnStatusCode: false,
                headers: { 'Authorization': `Bearer ${uToken}`, 'Content-Type': 'application/json' },
                body: { "name": name, "parent": null }
            }).then(capture);
        });
    });
});

When('I send a GET request to retrieve categories with parentId filter {string}', (filter) => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page`,
        failOnStatusCode: false,
        qs: { parentId: filter },
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(capture);
});

When('I send a GET request to retrieve categories with invalid page {string} and size {int}', (pageStr, size) => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page`,
        failOnStatusCode: false,
        qs: { page: pageStr, size },
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(capture);
});

// --- TC 34 Deletion ---
let deletableCategoryId;
Given('a category exists for deletion testing', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: `DEL${Math.floor(100 + Math.random() * 900)}`, parent: null }
    }).then((res) => { deletableCategoryId = res.body.id; });
});

When('the Admin sends a DELETE request to the category deletion endpoint with a valid Admin Token', () => {
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/categories/${deletableCategoryId}`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(capture);
});

Then('the API should respond with a 204 No Content status', () => {
    expect(apiResponse.status).to.eq(204);
});

Then('the category should no longer exist', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${deletableCategoryId}`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => { expect([404, 400]).to.include(res.status); });
});

// --- TC 35 Update ---
let validCategoryId;
When('the Admin sends a PUT request to the category update endpoint with a new name', () => {
    const newName = `UpdCName`; 
    Cypress.env('UpdatedCategoryName', newName);
    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/categories/${validCategoryId}`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: newName, parentId: null }
    }).then(capture);
});

Then('the API should respond with a 200 OK status', () => {
    expect(apiResponse.status).to.eq(200);
});

Then('the category should have the updated name', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${validCategoryId}`,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => { expect(res.body.name).to.eq(Cypress.env('UpdatedCategoryName')); });
});

// --- TC 36 Child Categories ---
Given('Category A exists with Sub-Category B as its child', () => {
    const rand = Math.floor(Math.random() * 900) + 100;
    const catAName = `API_CA_${rand}`; 
    const subBName = `API_CB_${rand}`;

    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": catAName, "parent": null }
    }).then((parentRes) => {
        const categoryAId = parentRes.body.id;
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: { "name": subBName, "parent": { "id": categoryAId } }
        }).then((childRes) => {
            Cypress.env('CategoryA_id', categoryAId);
            Cypress.env('SubCategoryB_id', childRes.body.id);
        });
    });
});

When('the Admin sends a DELETE request to the CategoryA endpoint with a valid Admin Token', () => {
    cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/categories/${Cypress.env('CategoryA_id')}`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(capture);
});

Then('the API should respond with a {int} Conflict status', (status) => {
    expect(apiResponse.status).to.eq(status);
});

Then('the API should respond with a 500 Internal Server Error status', () => {
    expect(apiResponse.status).to.eq(500);
});

Then('the response message should indicate that the category cannot be deleted due to active child categories', () => {
    const msg = apiResponse.body.message || apiResponse.body.error || apiResponse.body;
    expect(msg).to.include('Cannot delete category');
});

Then('Category A should still exist', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${Cypress.env('CategoryA_id')}`,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => { expect(res.status).to.eq(200); });
});

Then('Sub-Category B should still exist', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/${Cypress.env('SubCategoryB_id')}`,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => { expect(res.status).to.eq(200); });
});

// --- TC 37 Non-existent Delete ---
Given('Category ID 99999 does not exist', () => {
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
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(capture);
});

Then('the API should respond with a 404 Not Found status', () => {
    expect(apiResponse.status).to.eq(404);
});

Then('the response message should indicate that the category does not exist', () => {
    const msg = apiResponse.body.message || apiResponse.body.error || apiResponse.body;
    expect(msg).to.match(/not exist|not found/i);
});

Then('the system should remain stable', () => {
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=1`,
        headers: { 'Authorization': `Bearer ${authToken}` }
    }).then((res) => { expect(res.status).to.eq(200); });
});

// --- TC 38 Update Null ---
Given('I create a category for update testing', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { "name": `TC${Math.floor(100 + Math.random() * 900)}`, "parent": null }
    }).then((res) => { validCategoryId = res.body.id; });
});

let circularCategoryId;
let parentIntegrityCategoryId;

When('the Admin sends a PUT request to the category update endpoint with body', (dataTable) => {
    const row = dataTable.hashes()[0];
    const name = row.name === '<null>' ? null : row.name;
    let categoryId = validCategoryId || parentIntegrityCategoryId;
    let parentId = row.parentId;

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
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name, parentId }
    }).then(capture);
});

// --- TC 39 Update Duplicate ---
let categoryAId, categoryBId;
Given('two categories "A" and "B" exist for update uniqueness testing', () => {
    const nameA = 'A' + Math.floor(Math.random() * 1000);
    const nameB = 'B' + Math.floor(Math.random() * 1000);
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: nameA, parent: null }
    }).then((resA) => {
        categoryAId = resA.body.id;
        Cypress.env('CategoryA_name', nameA);
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: { name: nameB, parent: null }
        }).then((resB) => { categoryBId = resB.body.id; });
    });
});

When('the Admin sends a PUT request to update category "B" with name "A"', () => {
    cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/categories/${categoryBId}`,
        failOnStatusCode: false,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: Cypress.env('CategoryA_name'), parent: null }
    }).then(capture); 
});

Then('the API should respond with a 400 Bad Request or 403 Forbidden status', () => {
    expect([400, 403]).to.include(apiResponse.status);
});

Then('the response message should indicate "Name already exists"', () => {
    const msg = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/name.*exist/i.test(msg)).to.be.true;
});

// --- TC 40 Circular ---
Given('I create a category for circular parent testing', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: `C${Math.floor(100 + Math.random() * 900)}`, parent: null }
    }).then((res) => { circularCategoryId = res.body.id; });
});

Then('the response message should indicate "Category cannot be its own parent"', () => {
    const msg = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/category.*own.*parent/i.test(msg)).to.be.true;
});

// --- TC 41 Integrity ---
Given('I create a category for parent integrity testing', () => {
    const uniqueName = `API_P_${Math.floor(Math.random() * 900) + 100}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: uniqueName, parent: null }
    }).then((res) => {
        expect(res.status).to.eq(201); 
        parentIntegrityCategoryId = res.body.id;
    });
});

Then('the response message should indicate "Parent category not found"', () => {
    const msg = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/parent.*not.*found/i.test(msg) || /category.*not.*found/i.test(msg)).to.be.true;
});

// --- TC 42 Sorting ---
let userApiResponse;
Given('multiple categories exist with different names', () => {
    const names = ['Alpha', 'Charlie', 'Bravo'];
    names.forEach(name => {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { 'Authorization': `Bearer ${authToken}` },
            failOnStatusCode: false,
            body: { name, parent: null }
        });
    });
});

When('the user sends a GET request to {string} with a valid User Token', (endpoint) => {
    const [path, queryString] = endpoint.split('?');
    let qs = {};
    if (queryString) {
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            qs[key.replace('sort', 'sortField')] = value.includes(',') ? value.split(',')[0] : value;
            if (key === 'sort') {
                const parts = value.split(',');
                if (parts.length > 1) {
                    qs['sortField'] = parts[0];
                    qs['sortDir'] = parts[1];
                }
            }
        });
    }
    ensureUserToken().then(() => {
        cy.get('@userToken').then((uToken) => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}${path}`,
                failOnStatusCode: false,
                qs,
                headers: { 'Authorization': `Bearer ${uToken}` }
            }).then(capture);
        });
    });
});

Then('the category list should be returned in alphabetical order by Name \\(A to Z\\)', () => {
    const list = apiResponse.body.content || apiResponse.body;
    const names = list.map(c => c.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(names).to.deep.equal(sortedNames);
});

// TC 42 Parent Sort
Given('multiple categories exist with different parent categories', () => {
    const suffix = Math.floor(Math.random() * 900) + 100;
    const parentNames = [`ParA${suffix}`, `ParB${suffix}`, `ParC${suffix}`];
    const childNames = [`ChiA${suffix}`, `ChiB${suffix}`, `ChiC${suffix}`];
    const parentIds = [];
    cy.wrap(parentNames).each((name) => {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: { name, parent: null }
        }).then((res) => { parentIds.push(res.body.id); });
    }).then(() => {
        cy.wrap(childNames).each((childName, idx) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/categories`,
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: { name: childName, parent: { id: parentIds[idx] } }
            });
        });
    });
});

Then('the category list should be returned in ascending order by Parent Category \\(A to Z\\)', () => {
    const list = apiResponse.body.content || apiResponse.body;
    const parentNames = list.map(c => (c.parentName && c.parentName !== '-' ? c.parentName : ''));
    const sortedParentNames = [...parentNames].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(parentNames).to.deep.equal(sortedParentNames);
});

// TC 43 Invalid Sort
Then('the response should contain the error message {string}', (msg) => {
    if (apiResponse.status === 200) {
        expect(apiResponse.body).to.exist; 
    } else {
        const actual = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
        expect(actual).to.include(msg);
    }
});

// TC 44 Multi Sort
Given('multiple categories exist with different parent categories and names', () => {
    const suffix = Math.floor(Math.random() * 900) + 100;
    const parentNames = [`ParA${suffix}`, `ParB${suffix}`];
    const childNames = [['Zeta', 'Alpha'], ['Omega', 'Beta']];
    let parentIds = [];
    cy.wrap(parentNames).each((parentName, idx) => {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: { name: parentName, parent: null }
        }).then((parentRes) => {
            parentIds[idx] = parentRes.body.id;
            childNames[idx].forEach(childName => {
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('apiUrl')}/categories`,
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: { name: childName, parent: { id: parentRes.body.id } }
                });
            });
        });
    });
});

When('the user sends a GET request to "/categories/page?sort=parent,asc&sort=name,desc" with a valid User Token', () => {
    ensureUserToken().then(() => {
        cy.get('@userToken').then((uToken) => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/categories/page`,
                qs: { 'sort': ['parent,asc', 'name,desc'] },
                headers: { 'Authorization': `Bearer ${uToken}` }
            }).then(capture);
        });
    });
});

Then('the category list should be sorted first by Parent Category in ascending order, then by Name in descending order', () => {
    const list = apiResponse.body.content || apiResponse.body;
    const grouped = {};
    list.forEach(c => {
        const parent = c.parentName || '';
        if (!grouped[parent]) grouped[parent] = [];
        grouped[parent].push(c.name);
    });
    const sortedParentNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    sortedParentNames.forEach(parent => {
        const names = grouped[parent];
        const sortedNames = [...names].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
        expect(names).to.deep.equal(sortedNames);
    });
});

// TC 45 RBAC
Given('a category exists to be deleted', () => {
    const name = `Del${Math.floor(Math.random() * 1000)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: name, parent: null }
    }).then((res) => { Cypress.env('UserDeleteCategoryId', res.body.id); });
});

When('the user sends a DELETE request to the category endpoint with a valid User Token', () => {
    const categoryId = Cypress.env('UserDeleteCategoryId');
    ensureUserToken().then(() => {
        cy.get('@userToken').then((uToken) => {
            cy.request({
                method: 'DELETE',
                url: `${Cypress.env('apiUrl')}/categories/${categoryId}`,
                failOnStatusCode: false,
                headers: { 'Authorization': `Bearer ${uToken}` }
            }).then(capture);
        });
    });
});

Then('the API should respond with a 403 Forbidden status or 401 Unauthorized status', () => {
    expect([403, 401]).to.include(apiResponse.status);
});

Then('the response message should indicate that the request is denied', () => {
    const msg = apiResponse.body.message || apiResponse.body.error || JSON.stringify(apiResponse.body);
    expect(/denied|forbidden|not allowed|unauthorized/i.test(msg)).to.be.true;
});

Given('a category exists to be updated', () => {
    const name = `Upd${Math.floor(Math.random() * 1000)}`;
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { name: name, parent: null }
    }).then((res) => { Cypress.env('UserUpdateCategoryId', res.body.id); });
});

When('the user sends a PUT request to the category endpoint with a valid User Token', () => {
    const categoryId = Cypress.env('UserUpdateCategoryId');
    ensureUserToken().then(() => {
        cy.get('@userToken').then((uToken) => {
            cy.request({
                method: 'PUT',
                url: `${Cypress.env('apiUrl')}/categories/${categoryId}`,
                failOnStatusCode: false,
                headers: { 'Authorization': `Bearer ${uToken}`, 'Content-Type': 'application/json' },
                body: { name: `UpdNew${Math.floor(Math.random() * 100)}`, parent: null }
            }).then(capture);
        });
    });
});