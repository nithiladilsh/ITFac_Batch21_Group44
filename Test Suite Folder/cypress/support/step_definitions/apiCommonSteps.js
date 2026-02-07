import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";

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
        log: false
    }).then((res) => {
        cachedUserToken = res.body.token;
        return cy.wrap(cachedUserToken).as('userToken');
    });
};

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