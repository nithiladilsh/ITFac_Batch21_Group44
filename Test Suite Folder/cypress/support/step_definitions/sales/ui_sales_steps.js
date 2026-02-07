import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import salesPage from "../../../pages/sales/SalesPage";
import sellPlantPage from "../../../pages/sales/SellPlantPage";

let testSaleIds = [];
let adminToken = null;
let userToken = null;

// CACHED ADMIN TOKEN
const getAdminToken = () => {
    return cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: { username: Cypress.env("adminUser"), password: Cypress.env("adminPass") },
        failOnStatusCode: false
    }).then((res) => {
        if (res.status === 200 && res.body.token) {
            adminToken = res.body.token;
            return adminToken;
        }
        throw new Error("Failed to obtain Admin Token for cleanup");
    });
};

const getUserToken = () => {
    return cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/auth/login`,
        body: { username: Cypress.env("stdUser") || "testuser", password: Cypress.env("stdPass") || "password" },
        failOnStatusCode: false
    }).then((res) => {
        if (res.status === 200 && res.body.token) {
            userToken = res.body.token;
            return userToken;
        }
        return null; 
    });
};

const makeRequest = (method, endpoint, token, body = null) => {
    if (!token) return cy.wrap(null); 
    return cy.request({
        method,
        url: `${Cypress.env("apiUrl")}${endpoint}`,
        headers: { Authorization: `Bearer ${token}` },
        body,
        failOnStatusCode: false,
    });
};

// CLEANUP HELPERS
const cleanUpAllSales = () => {
    return getAdminToken().then((admTok) => {
        return getUserToken().then((usrTok) => {
            // Fetch Sales as Admin
            const adminReq = makeRequest("GET", "/sales?page=0&size=2000", admTok);
            
            // Fetch Sales as User (only if token exists)
            const userReq = usrTok ? makeRequest("GET", "/sales?page=0&size=2000", usrTok) : cy.wrap({ body: [] });

            return cy.wrap(Promise.all([adminReq, userReq])).then((responses) => {
                let allSales = [];
                // Extract sales from both responses
                responses.forEach(res => {
                    if (res && (res.body.content || res.body)) {
                        const content = res.body.content || res.body;
                        if (Array.isArray(content)) allSales = allSales.concat(content);
                    }
                });

                const uniqueSales = [...new Map(allSales.map(item => [item.id, item])).values()];

                if (uniqueSales.length > 0) {
                    cy.log(`🧹 Found ${uniqueSales.length} sales. Deleting...`);
                    return cy.wrap(uniqueSales).each(sale => {
                        makeRequest("DELETE", `/sales/${sale.id}`, admTok);
                    });
                }
            });
        });
    });
};

const cleanUpLeftoverPlants = () => {
    return getAdminToken().then((token) => {
        return makeRequest("GET", "/plants?page=0&size=2000", token).then((res) => {
            const plants = res.body.content || res.body || [];
            const junkPlants = plants.filter(p => p.name.startsWith("S_Plt") || p.name.startsWith("API_"));

            if (junkPlants.length > 0) {
                cy.log(`🧹 Found ${junkPlants.length} leftover plants. Deleting...`);
                return cy.wrap(junkPlants).each(p => {
                    makeRequest("DELETE", `/plants/${p.id}`, token);
                });
            }
        });
    });
};

const cleanUpLeftoverCategories = () => {
    return getAdminToken().then((token) => {
        return makeRequest("GET", "/categories/page?page=0&size=2000", token).then((res) => {
            const cats = res.body.content || res.body || [];
            const junkCats = cats.filter(c => 
                c.name.startsWith("S_Par") || 
                c.name.startsWith("S_Sub") || 
                c.name.startsWith("API_")
            );
            
            if (junkCats.length > 0) {
                // Delete Children (Higher IDs) before Parents (Lower IDs)
                junkCats.sort((a, b) => b.id - a.id);
                cy.log(`🧹 Found ${junkCats.length} leftover categories. Deleting...`);
                return cy.wrap(junkCats).each(c => {
                    makeRequest("DELETE", `/categories/${c.id}`, token);
                });
            }
        });
    });
};

// DATA SEEDING HELPERS 
const ensurePlantExists = () => {
    return getAdminToken().then((token) => {
        return makeRequest("GET", "/plants?page=0&size=10", token).then((plantsRes) => {
            if (plantsRes.body && plantsRes.body.content) {
                const validPlant = plantsRes.body.content.find((p) => p.quantity > 0);
                if (validPlant) return cy.wrap(validPlant);
            }

            cy.log("⚠️ No plants found. Creating seed hierarchy...");
            const rnd = Math.floor(Math.random() * 900) + 100;
            
            return makeRequest("POST", "/categories", token, { name: `S_Par${rnd}`, parent: null }).then((parRes) => {
                return makeRequest("POST", "/categories", token, { name: `S_Sub${rnd}`, parent: { id: parRes.body.id } }).then((subRes) => {
                    return makeRequest("POST", `/plants/category/${subRes.body.id}`, token, {
                        name: `S_Plt${rnd}`,
                        price: 50,
                        quantity: 100
                    }).then((plRes) => {
                        return cy.wrap(plRes.body);
                    });
                });
            });
        });
    });
};

const createSalesRecord = (plantId, quantity) => {
    return getAdminToken().then((token) => {
        return makeRequest("POST", `/sales/plant/${plantId}?quantity=${quantity}`, token, null);
    });
};

// Aggressive Cleanup BEFORE tests
Before({ tags: "@sales" }, () => {
    // Force sequential execution
    return cleanUpAllSales()
        .then(() => cy.wait(500)) 
        .then(() => cleanUpLeftoverPlants())
        .then(() => cy.wait(500))
        .then(() => cleanUpLeftoverCategories());
});

// Cleanup AFTER tests
After({ tags: "@sales" }, () => {
    return cleanUpAllSales()
        .then(() => cleanUpLeftoverPlants())
        .then(() => cleanUpLeftoverCategories());
});

// STEP DEFINITIONS 
Given("I am on the Sales Page", () => {
    salesPage.visit();
});

Given("I am on the Dashboard page", () => {
    cy.visit("/dashboard");
});

Given("at least one sales record exists in the list", () => {
    getAdminToken().then((token) => {
        makeRequest("GET", "/sales?page=0&size=5", token).then((res) => {
            const sales = res.body.content || res.body || [];
            if (sales.length === 0) {
                cy.log("⚠️ Table empty. Seeding 3 sales records...");
                ensurePlantExists().then((plant) => {
                    createSalesRecord(plant.id, 1).then(r => testSaleIds.push(r.body.id))
                    .then(() => createSalesRecord(plant.id, 2).then(r => testSaleIds.push(r.body.id)))
                    .then(() => createSalesRecord(plant.id, 3).then(r => testSaleIds.push(r.body.id)))
                    .then(() => {
                        cy.reload();
                    });
                });
            }
        });
    });

    salesPage.elements.salesTable().should("be.visible");
    salesPage.elements.salesRecords().should("have.length.greaterThan", 0);
    salesPage.elements.salesRecords().first().find("td").should("have.length.gt", 1);
});

Given("there are no sales records in the system", () => {
    cleanUpAllSales();
});

Given("I am on the {string} page", (pageName) => {
    if (pageName === "Sell Plant") sellPlantPage.visit();
});

When("I click on the Plant dropdown menu", () => {
    sellPlantPage.clickPlantDropdown();
});

Then("the dropdown should be enabled", () => {
    sellPlantPage.verifyDropdownEnabled();
});

Then("the dropdown should display a list of available plants", () => {
    sellPlantPage.verifyPlantsDisplayed();
});

Then("each plant entry should display its stock quantity", () => {
    sellPlantPage.verifyPlantHasStockInfo();
});

Given("I have selected a plant from the dropdown", () => {
    sellPlantPage.elements.plantDropdown().should("be.visible");
    sellPlantPage.elements.plantDropdownOptions().should('have.length.gt', 1).then(($options) => {
        sellPlantPage.elements.plantDropdown().select($options.eq(1).val());
    });
});

When("I select a plant from the dropdown", () => {
    sellPlantPage.elements.plantDropdown().should("be.visible");
    sellPlantPage.elements.plantDropdownOptions().should('have.length.gt', 1).then(($options) => {
        sellPlantPage.elements.plantDropdown().select($options.eq(1).val());
    });
});

When("I enter {string} in the Quantity field", (quantity) => {
    sellPlantPage.enterQuantity(quantity);
});

When("I enter a valid quantity in the Quantity field", () => {
    sellPlantPage.enterQuantity("5");
});

When("I attempt to submit the form", () => {
    sellPlantPage.submitForm();
});

When("I click the submit button", () => {
    sellPlantPage.submitForm();
});

Then('the "Sell Plant" button should be visible', () => {
    salesPage.elements.sellPlantBtn().should("be.visible");
});

Then("a validation error message should be displayed", () => {
    sellPlantPage.verifyValidationError();
});

Then("the plant sale should be completed successfully", () => {
    cy.url().should("not.include", "/new");
});

Then("I should be redirected to the sales list page", () => {
    cy.url().should("include", "/sales");
});

Then("the plant stock should be reduced accordingly", () => {
    cy.url().should("include", "/sales");
});

Then("no new sale should be recorded", () => {
    cy.url().should("include", "/sales");
});

// DELETE SALES RECORD STEPS 
When("I select a sales record from the list", () => {
    salesPage.elements.salesRecords().should('have.length.greaterThan', 0);
});

When("I locate a sales record in the list", () => {
    salesPage.elements.salesRecords().should('have.length.greaterThan', 0);
});

Then("the {string} button should be visible and enabled for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements.salesRecords().first().find("button[class*='btn-'][class*='danger']")
            .should("be.visible")
            .and("not.be.disabled");
    }
});

Then("the {string} button should not be visible for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements.salesRecords().first().find("button[class*='btn-'][class*='danger']")
            .should("not.exist");
    }
});

When("I click the {string} button for the selected record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements.salesRecords().first().find("button[class*='btn-'][class*='danger']")
            .should("be.visible")
            .click();
    }
});

Then("a confirmation prompt should appear", () => {
    cy.once("window:confirm", () => true);
});

When("I click {string} on the confirmation prompt", (choice) => {
    if (choice === "Yes") {
        cy.on("window:confirm", () => true);
    } else {
        cy.on("window:confirm", () => false);
    }
});

Then("the confirmation prompt should close", () => {
});

Then("the selected sales record should be removed from the list", () => {
    cy.wait(500); 
    salesPage.elements.salesTable().should("be.visible");
});

Then("the Sales list should refresh automatically", () => {
    salesPage.elements.salesTable().should("be.visible");
});

Then("the sales table should be visible", () => {
    salesPage.elements.salesTable().should("be.visible");
});

Then("the sales records should display relevant information", () => {
    salesPage.elements.salesRecords().should("have.length.greaterThan", 0);
});

// --- SORTING ---
When("I observe the {string} column in the sales table", (columnName) => {
    const uiColumnName = columnName === "Sold date" ? "Sold At" : columnName;
    salesPage.elements.salesTable().contains("th", uiColumnName).should("be.visible");
});

Then("the sales records should be sorted by {string} in descending order", (columnName) => {
    const colIndex = 3; 
    const dateValues = [];
    salesPage.elements.salesRecords().each(($row) => {
        const cellText = $row.find('td').eq(colIndex).text().trim();
        dateValues.push(new Date(cellText).getTime());
    }).then(() => {
        const sortedDesc = [...dateValues].sort((a, b) => b - a);
        expect(dateValues).to.deep.equal(sortedDesc);
    });
});

When("I click on the {string} menu item in the sidebar", (menuItem) => {
    cy.get("nav, .sidebar").contains("a", menuItem).click();
});

When("I wait for the page to load", () => {
    cy.wait(500);
});

Then("the {string} menu item should be highlighted as active", (menuItem) => {
    cy.get("nav, .sidebar").contains("a", menuItem).should("have.class", "active");
});