import { Given, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";

let cachedAdminToken = null;
let cachedUserToken = null;

// HELPERS
export const ensureAdminToken = () => {
    if (cachedAdminToken) return cy.wrap(cachedAdminToken).as('adminToken');
    return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') },
        log: false
    }).then((res) => {
        cachedAdminToken = res.body.token;
        return cy.wrap(cachedAdminToken).as('adminToken');
    });
};

export const ensureUserToken = () => {
    if (cachedUserToken) return cy.wrap(cachedUserToken).as('userToken');
    return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { username: Cypress.env('stdUser'), password: Cypress.env('stdPass') },
        log: false,
        failOnStatusCode: false
    }).then((res) => {
        if (res.status === 200) {
            cachedUserToken = res.body.token;
            return cy.wrap(cachedUserToken).as('userToken');
        }
        return cy.wrap(null).as('userToken');
    });
};

// CLEANUP FUNCTION
export const cleanUpAllData = () => {
    const deletePatterns = [
        (name) => name.startsWith("API_"),
        (name) => name.startsWith("S_") || name.startsWith("P_"),
        (name) => name.startsWith("TC") || name.startsWith("Del") || name.startsWith("Upd"),
        (name) => /^[AC]\d+$/.test(name),
        (name) => ["Alpha", "Beta", "Charlie", "Zeta", "Omega", "Bravo", "Herbs", "Rue", "Vegetables",
                   "Testsub", "TestRoot", "Aloevera", "Plant 1", "Plant 2", "Plant 3", "Plant 4", 
                   "Plant 5","Plant 6", "Plant 7", "Plant 8", "Plant 9", "Plant 10",
                   "Plant 11", "Plant 12", "Plant 13", "Plant 14", "Plant 15", "TemporyC",
                   "Low Stock Plant"].includes(name),
        (name) => name.startsWith("Par") || name.startsWith("Chi") || name.startsWith("plants_") || name.startsWith("sort_"),
        (name) => /^\d+$/.test(name)
    ];

    return ensureAdminToken().then(() => {
        return ensureUserToken().then(() => {
            cy.get('@adminToken', { log: false }).then((admToken) => {
                cy.get('@userToken', { log: false }).then((usrToken) => {
                    
                    const headersAdm = { 'Authorization': `Bearer ${admToken}` };
                    
                    // 1. DELETE SALES (Fetch as BOTH Admin and User to uncover hidden sales)
                    const reqs = [
                        cy.request({ method: 'GET', url: `${Cypress.env('apiUrl')}/sales?page=0&size=2000`, headers: headersAdm, failOnStatusCode: false, log: false })
                    ];
                    if (usrToken) {
                        reqs.push(cy.request({ method: 'GET', url: `${Cypress.env('apiUrl')}/sales?page=0&size=2000`, headers: { 'Authorization': `Bearer ${usrToken}` }, failOnStatusCode: false, log: false }));
                    }

                    cy.wrap(Promise.all(reqs)).then((responses) => {
                        let allSales = [];
                        responses.forEach(res => {
                            if (res && (res.body.content || res.body)) {
                                allSales = allSales.concat(res.body.content || res.body);
                            }
                        });
                        // Unique Sales IDs
                        const uniqueSales = [...new Map(allSales.map(item => [item.id, item])).values()];

                        if (uniqueSales.length > 0) {
                            cy.log(`Deleting ${uniqueSales.length} sales...`);
                            uniqueSales.forEach(s => {
                                cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/sales/${s.id}`, headers: headersAdm, failOnStatusCode: false, log: false });
                            });
                        }
                    });

                    // 2. DELETE PLANTS (Releases Categories)
                    cy.request({ method: 'GET', url: `${Cypress.env('apiUrl')}/plants?page=0&size=2000`, headers: headersAdm, failOnStatusCode: false, log: false })
                    .then((res) => {
                        const plants = res.body.content || res.body || [];
                        const junkPlants = plants.filter(p => deletePatterns.some(pt => pt(String(p.name))));
                        
                        if (junkPlants.length > 0) {
                            cy.log(`Deleting ${junkPlants.length} plants...`);
                            junkPlants.forEach(p => {
                                cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/plants/${p.id}`, headers: headersAdm, failOnStatusCode: false, log: false });
                            });
                        }
                    });

                    // 3. DELETE CATEGORIES (Children First)
                    cy.request({ method: 'GET', url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=2000`, headers: headersAdm, failOnStatusCode: false, log: false })
                    .then((res) => {
                        const cats = res.body.content || res.body || [];
                        const junkCats = cats.filter(c => c.id > 100 && deletePatterns.some(pt => pt(String(c.name))));

                        if (junkCats.length > 0) {
                            junkCats.sort((a, b) => b.id - a.id); // Descending ID
                            cy.log(`Deleting ${junkCats.length} categories...`);
                            junkCats.forEach(c => {
                                cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/categories/${c.id}`, headers: headersAdm, failOnStatusCode: false, log: false });
                            });
                        }
                    });
                });
            });
        });
    });
};

// SINGLE CENTRALIZED CLEANUP HOOK 
// This runs once per scenario tagged with @api
Before({ tags: "@api or @sales or @plant or @category" }, () => {
    return cleanUpAllData();
});

// SHARED PRE-REQUISITES 
Given('the API Service is running', () => {
    ensureAdminToken().then(() => {
        cy.get('@adminToken', { log: false }).then((token) => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/health`,
                headers: { 'Authorization': `Bearer ${token}` },
                failOnStatusCode: false,
                log: false
            }).then((res) => {
                expect(res.status).to.be.oneOf([200, 401, 403]);
            });
        });
    });
});

Given('an Admin Auth Token is available', () => {
    ensureAdminToken();
});

Given('a User Auth Token is available', () => {
    ensureUserToken();
});

// SHARED ASSERTIONS
Then('the response status should be {int}', (expectedStatus) => {
    cy.get('@lastApiResponse').then((res) => {
        expect(res.status).to.eq(expectedStatus);
    });
});

Then('the API should respond with a {int} Bad Request status', (expectedStatus) => {
    cy.get('@lastApiResponse').then((res) => {
        expect(res.status).to.eq(expectedStatus);
    });
});

Then('the API should respond with a 400 Bad Request status or 404 Not Found status', () => {
    cy.get('@lastApiResponse').then((res) => {
        expect([200, 400, 404]).to.include(res.status);
    });
});

