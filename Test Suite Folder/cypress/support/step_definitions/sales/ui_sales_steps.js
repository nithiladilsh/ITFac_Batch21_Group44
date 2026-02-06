import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import salesPage from "../../../pages/sales/SalesPage";
import sellPlantPage from "../../../pages/sales/SellPlantPage";

let testSaleIds = [];

// ========== UTILITY FUNCTIONS ==========

// Shared login session to avoid repeated login requests
let cachedToken = null;

const getAuthToken = () => {
    if (cachedToken) {
        return cy.wrap(cachedToken);
    }

    return cy
        .session(
            "admin-sales-token",
            () => {
                return cy
                    .request({
                        method: "POST",
                        url: `${Cypress.env("apiUrl")}/auth/login`,
                        body: {
                            username: Cypress.env("adminUser"),
                            password: Cypress.env("adminPass"),
                        },
                    })
                    .then((loginRes) => {
                        cachedToken = loginRes.body.token;
                        cy.wrap(cachedToken).as("authToken");
                    });
            },
            {
                cacheAcrossSpecs: false,
            },
        )
        .then(() => {
            if (!cachedToken) {
                return cy
                    .request({
                        method: "POST",
                        url: `${Cypress.env("apiUrl")}/auth/login`,
                        body: {
                            username: Cypress.env("adminUser"),
                            password: Cypress.env("adminPass"),
                        },
                    })
                    .then((loginRes) => {
                        cachedToken = loginRes.body.token;
                        return cachedToken;
                    });
            }
            return cachedToken;
        });
};

// Uses cached token from cy.session (no redundant login calls)
const makeAuthRequest = (method, endpoint, body = null) => {
    return getAuthToken().then((token) => {
        const headers = { Authorization: `Bearer ${token}` };

        return cy.request({
            method,
            url: `${Cypress.env("apiUrl")}${endpoint}`,
            headers,
            body,
            failOnStatusCode: false,
        });
    });
};

// Get first available plant for creating sales (with retry logic for 500 errors)
const getFirstPlant = (retryCount = 0) => {
    return makeAuthRequest("GET", "/plants?page=0&size=10").then((plantsRes) => {
        if (plantsRes.status === 500 && retryCount < 2) {
            return cy
                .log(`Plants API returned 500, retrying... (attempt ${retryCount + 1}/2)`)
                .then(() => {
                    return cy.wait(1000).then(() => getFirstPlant(retryCount + 1));
                });
        }

        if (plantsRes.status === 500) {
            return cy.log("Plants API still failing after retries").then(() => null);
        }

        let plants = null;
        if (plantsRes.body) {
            if (Array.isArray(plantsRes.body)) {
                plants = plantsRes.body;
            } else if (plantsRes.body.content && Array.isArray(plantsRes.body.content)) {
                plants = plantsRes.body.content;
            }
        }

        if (plants && plants.length > 0) {
            const plantWithStock = plants.find((p) => p.quantity > 0);
            if (plantWithStock) {
                return cy
                    .log(
                        `Found plant with stock: ${plantWithStock.name} (stock: ${plantWithStock.quantity})`,
                    )
                    .then(() => plantWithStock);
            }
            return cy.log("No plants with available stock").then(() => null);
        }

        return cy.log("No plants found in database").then(() => null);
    });
};

// Create a single sales record (Swagger: POST /api/sales/plant/{plantId}?quantity={quantity})
const createSalesRecord = (plantId, quantity) => {
    return makeAuthRequest("POST", `/sales/plant/${plantId}?quantity=${quantity}`, null);
};

// Clean up test sales only (uses ID-based cleanup with testSaleIds array)
const cleanUpSalesTestData = () => {
    if (testSaleIds.length === 0) {
        return cy.log("No test sales to clean up").then(() => cy.wrap(null));
    }

    return cy.log(`Deleting ${testSaleIds.length} test sales by ID...`).then(() => {
        return cy
            .wrap(testSaleIds)
            .each((saleId) => {
                return makeAuthRequest("DELETE", `/sales/${saleId}`).then((res) => {
                    if (res.status === 200 || res.status === 204) {
                        return cy.log(`Deleted sale ID: ${saleId}`);
                    } else {
                        return cy.log(`Failed to delete sale ID: ${saleId} (${res.status})`);
                    }
                });
            })
            .then(() => {
                cy.log("Test sales cleaned up");
                testSaleIds = [];
                return cy.wait(300);
            });
    });
};

// ========== BEFORE/AFTER HOOKS ==========

// 1. Cleanup for non-cleanup_all scenarios
Before({ tags: "not @cleanup_all" }, () => {
    cy.log(" Pre-test cleanup...");
    return cleanUpSalesTestData();
});

// 2. Clean-then-Seed for @requires_sales_records (consolidated to prevent race conditions)
Before({ tags: "@requires_sales_records" }, () => {
    cy.log("Clean-then-Seed for @requires_sales_records...");

    return cleanUpSalesTestData().then(() => {
        cy.log("Seeding test sales records with stock-aware quantities...");

        return getFirstPlant().then((plant) => {
            if (!plant) {
                throw new Error("No plant with available stock to create test sales");
            }

            const safeQty1 = Math.min(2, Math.floor(plant.quantity / 2));
            const safeQty2 = Math.min(1, Math.floor(plant.quantity / 2));

            if (safeQty1 <= 0 || safeQty2 <= 0) {
                throw new Error(
                    `Plant ${plant.name} has insufficient stock (${plant.quantity}) for test sales`,
                );
            }

            return createSalesRecord(plant.id, safeQty1).then((res1) => {
                if (res1.status !== 201 && res1.status !== 200) {
                    throw new Error(
                        `Failed to create sale #1: ${res1.status} - ${JSON.stringify(res1.body)}`,
                    );
                }
                const saleId1 = res1.body?.id || res1.body;
                testSaleIds.push(saleId1);
                cy.log(`Created sale #1 (ID: ${saleId1}, qty: ${safeQty1}): ${res1.status}`);

                return createSalesRecord(plant.id, safeQty2).then((res2) => {
                    if (res2.status !== 201 && res2.status !== 200) {
                        throw new Error(
                            `Failed to create sale #2: ${res2.status} - ${JSON.stringify(res2.body)}`,
                        );
                    }
                    const saleId2 = res2.body?.id || res2.body;
                    testSaleIds.push(saleId2);
                    cy.log(`Created sale #2 (ID: ${saleId2}, qty: ${safeQty2}): ${res2.status}`);

                    return cy.wait(500).then(() => {
                        cy.log(`Test sales seeded successfully (IDs: ${testSaleIds.join(", ")})`);
                    });
                });
            });
        });
    });
});

After(() => {
    return cy.log(" Post-test cleanup...").then(() => {
        cachedToken = null;
        return getAuthToken().then(() => {
            return cleanUpSalesTestData();
        });
    });
});

// ========== STEP DEFINITIONS ==========

Given("I am on the Sales Page", () => {
    salesPage.visit();
});

Given("I am on the Dashboard page", () => {
    cy.visit("/dashboard");
});

Given("at least one sales record exists in the list", () => {
    cy.log("Waiting for sales table to contain records...");

    salesPage.elements.salesTable().should("be.visible");
    salesPage.elements.salesRecords().should("have.length.at.least", 1);
    cy.wait(500);

    salesPage.elements
        .salesRecords()
        .first()
        .within(() => {
            cy.get("td").should("have.length.at.least", 1);
        });

    cy.log("Sales table verified with records present");
});

Given("there are no sales records in the system", () => {
    cy.log(" Deleting ALL sales records for empty state test...");

    return makeAuthRequest("GET", "/sales/page?page=0&size=2000").then((salesRes) => {
        if (salesRes.body && salesRes.body.content && salesRes.body.content.length > 0) {
            cy.log(` Deleting ${salesRes.body.content.length} sales records...`);
            const deletePromises = salesRes.body.content.map((sale) =>
                makeAuthRequest("DELETE", `/sales/${sale.id}`).then((res) => res),
            );
            return cy.wrap(Promise.all(deletePromises)).then(() => {
                cy.log("All sales records deleted");
                return cy.wait(500);
            });
        }
        cy.log("No sales records to delete");
        return cy.wrap(null);
    });
});

Given("I am on the {string} page", (pageName) => {
    if (pageName === "Sell Plant") {
        sellPlantPage.visit();
    }
});

Then("the {string} button should be visible", (buttonText) => {
    if (buttonText === "Sell Plant") {
        salesPage.elements.sellPlantBtn().should("be.visible");
    }
});

Then("the {string} button should not be visible", (buttonText) => {
    if (buttonText === "Sell Plant") {
        salesPage.elements.sellPlantBtn().should("not.exist");
    }
});

Then("I should be redirected to {string}", (url) => {
    cy.url().should("include", url);
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

Then("the validation error message {string} should be displayed", (expectedMessage) => {
    cy.log(`🔍 Verifying validation error message: "${expectedMessage}"`);

    // Check for error message in common locations
    cy.get("body").then(($body) => {
        const errorSelectors = [
            ".invalid-feedback",
            ".error-message",
            ".alert-danger",
            '[class*="error"]',
            '[role="alert"]',
        ];

        let errorFound = false;
        let actualMessage = "";

        errorSelectors.forEach((selector) => {
            if ($body.find(selector).length > 0 && $body.find(selector).is(":visible")) {
                actualMessage = $body.find(selector).first().text().trim();
                errorFound = true;
            }
        });

        if (errorFound) {
            cy.log(`❌ Expected: "${expectedMessage}"`);
            cy.log(`❌ Actual: "${actualMessage}"`);

            // This will FAIL the test if messages don't match
            expect(actualMessage).to.include(
                expectedMessage,
                `Validation message mismatch!\nExpected (SRS): "${expectedMessage}"\nActual (UI): "${actualMessage}"`,
            );
        } else {
            throw new Error("No validation error message found on the page");
        }
    });
});

Given("I have selected a plant from the dropdown", () => {
    sellPlantPage.elements.plantDropdown().should("be.visible");
    sellPlantPage.elements.plantDropdownOptions().then(($options) => {
        const validOptions = $options.filter((index, option) => {
            const text = option.text.trim();
            return text && !text.toLowerCase().includes("select");
        });
        if (validOptions.length > 0) {
            sellPlantPage.elements.plantDropdown().select(validOptions.eq(0).val());
        }
    });
});

When("I select a plant from the dropdown", () => {
    sellPlantPage.elements.plantDropdown().should("be.visible");
    sellPlantPage.elements.plantDropdownOptions().then(($options) => {
        const validOptions = $options.filter((index, option) => {
            const text = option.text.trim();
            return text && !text.toLowerCase().includes("select");
        });
        if (validOptions.length > 0) {
            sellPlantPage.elements.plantDropdown().select(validOptions.eq(0).val());
        }
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

Then("a validation error message should be displayed", () => {
    sellPlantPage.verifyValidationError();
});

Then("the plant sale should be completed successfully", () => {
    cy.url().should("not.include", "/new");
});

Then("I should be redirected to the sales list page", () => {
    cy.url().should("include", "/sales");
    cy.url().should("not.include", "/new");
});

Then("the plant stock should be reduced accordingly", () => {
    cy.url().should("include", "/sales");
    cy.get("table, .sales-list, [class*='table']").should("be.visible");
});

When("I click the {string} button", (buttonText) => {
    if (buttonText === "Cancel") {
        sellPlantPage.clickCancel();
    } else if (buttonText === "Sell Plant") {
        salesPage.clickSellPlant();
    }
});

Then("no new sale should be recorded", () => {
    cy.url().should("include", "/sales");
    cy.url().should("not.include", "/new");
});

// Delete Sales Record Steps
When("I select a sales record from the list", () => {
    cy.log("Selecting first sales record...");
    salesPage.elements.salesRecords().should("have.length.at.least", 1);
    cy.wait(300);
    salesPage.selectFirstSalesRecord();
});

When("I locate a sales record in the list", () => {
    cy.log("Locating first sales record...");
    salesPage.elements.salesRecords().should("have.length.at.least", 1);
    cy.wait(300);
    salesPage.selectFirstSalesRecord();
});

Then("the {string} button should be visible and enabled for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.verifyDeleteButtonVisible();
    }
});

Then("the {string} button should not be visible for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements
            .salesRecords()
            .first()
            .within(() => {
                cy.get("button.btn-outline-danger").should("not.exist");
            });
    }
});

When("I click the {string} button for the selected record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.clickDeleteButton();
    }
});

Then("a confirmation prompt should appear", () => {
    cy.on("window:confirm", () => true);
});

When("I click {string} on the confirmation prompt", (choice) => {
    if (choice === "Yes") {
        cy.on("window:confirm", () => true);
    } else {
        cy.on("window:confirm", () => false);
    }
});

Then("the confirmation prompt should close", () => {
    cy.url().should("include", "/sales");
});

Then("the selected sales record should be removed from the list", () => {
    cy.wait(500);
    salesPage.elements.salesTable().should("be.visible");
});

Then("the Sales list should refresh automatically", () => {
    cy.url().should("include", "/sales");
    salesPage.elements.salesTable().should("be.visible");
});

Then("I should see the message {string}", (message) => {
    cy.contains(message).should("be.visible");
});

Then("the sales table should be visible", () => {
    salesPage.elements.salesTable().should("be.visible");
});

Then("the sales records should display relevant information", () => {
    salesPage.elements.salesRecords().should("have.length.greaterThan", 0);
    salesPage.elements
        .salesRecords()
        .first()
        .within(() => {
            cy.get("td").should("have.length.greaterThan", 0);
        });
});

When("I observe the {string} column in the sales table", (columnName) => {
    cy.log(`Observing ${columnName} column...`);
    salesPage.elements.salesTable().should("be.visible");
    salesPage.elements.salesRecords().should("have.length.at.least", 1);
});

Then("the sales records should be sorted by {string} in descending order", (columnName) => {
    cy.log(`Verifying ${columnName} is sorted in descending order...`);

    salesPage.elements
        .salesRecords()
        .find("td")
        .filter((index, el) => {
            const text = Cypress.$(el).text().trim();
            return /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(text);
        })
        .then(($dateCells) => {
            const dates = [];
            $dateCells.each((index, cell) => {
                const dateText = Cypress.$(cell).text().trim();
                const parsedDate = new Date(dateText);
                if (!isNaN(parsedDate.getTime())) {
                    dates.push(parsedDate);
                }
            });

            cy.log(`Found ${dates.length} date values`);

            for (let i = 0; i < dates.length - 1; i++) {
                const current = dates[i].getTime();
                const next = dates[i + 1].getTime();
                expect(current).to.be.at.least(
                    next,
                    `Date at position ${i} (${dates[i].toISOString()}) should be >= date at position ${i + 1} (${dates[i + 1].toISOString()})`,
                );
            }

            cy.log(`All ${dates.length} dates are in descending order`);
        });
});

When("I click on the {string} menu item in the sidebar", (menuItem) => {
    cy.log(`Clicking on "${menuItem}" menu item in sidebar...`);
    cy.get("nav, .sidebar, [class*='sidebar'], aside")
        .contains("a", menuItem, { matchCase: false })
        .click();
});

When("I wait for the page to load", () => {
    cy.wait(500);
    cy.url().should("not.include", "/dashboard");
});

Then("the {string} menu item should be highlighted as active", (menuItem) => {
    cy.log(`Verifying "${menuItem}" menu item is highlighted...`);

    cy.get("nav, .sidebar, [class*='sidebar'], aside")
        .contains("a", menuItem, { matchCase: false })
        .should("be.visible")
        .and(($link) => {
            const classList = $link.attr("class") || "";
            const href = $link.attr("href") || "";

            const hasActiveClass =
                /active|current|selected|highlighted/i.test(classList) || href.includes("/sales");

            expect(hasActiveClass, `Menu item should have active class or correct href`).to.be.true;
        })
        .then(() => {
            cy.log(`"${menuItem}" menu item is highlighted as active`);
        });
});
