import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

// GENERIC STEPS
// 1. Generic Button Click (Optimized - No Wait)
When("I click the {string} button", (btnText) => {
  // Mapper to handle specific text mismatches
  const buttonMapper = {
    "Add Category": "Add A Category",
    "Add Plant": "Add a Plant",
    "Sell Plant": "Sell Plant"
  };

  const actualText = buttonMapper[btnText] || btnText;

  cy.get("body").then(($body) => {
    // Priority A: Button tag
    if ($body.find(`button:contains("${actualText}")`).length > 0) {
      cy.contains("button", actualText).click({ force: true });
    } 
    // Priority B: Link acting as button
    else if ($body.find(`a:contains("${actualText}")`).length > 0) {
      cy.contains("a", actualText).click({ force: true });
    } 
    // Priority C: Generic text match
    else {
      cy.contains(actualText).click({ force: true });
    }
  });
});

// 2. Generic "No Quotes" Steps
When("I click the Save button", () => {
  cy.contains("button", "Save").click({ force: true });
});

When("I click the Cancel button", () => {
  cy.contains("button", "Cancel").click({ force: true });
});

// 3. Generic Visibility Checks
Then("I should see the message {string}", (message) => {
  cy.contains(message).should("be.visible");
});

Then("I should be redirected to {string}", (urlPart) => {
  cy.url().should("include", urlPart);
});

// 4. Universal "Not Visible" Check (Handles both Plants and Sales buttons)
Then('the {string} button should not be visible', (btnText) => {
  cy.get("body").then(($body) => {
    if ($body.find(`button:contains("${btnText}")`).length > 0) {
       cy.contains("button", btnText).should("not.be.visible");
    } 
    else if ($body.find(`a:contains("${btnText}")`).length > 0) {
       cy.contains("a", btnText).should("not.be.visible");
    }
    else {
       cy.contains(btnText).should("not.exist");
    }
  });
});