class SellPlantPage {
    elements = {
        plantDropdown: () => cy.get("#plantId"),
        plantDropdownOptions: () => this.elements.plantDropdown().find("option"),
        quantityField: () => cy.get("#quantity"),
        submitButton: () => cy.contains("button", "Sell"),
        cancelButton: () => cy.contains("a", "Cancel"),
        validationError: () =>
            cy.get(".error-message, .alert-danger, [class*='error'], [role='alert']"),
    };

    visit() {
        cy.visit("/sales/new");
    }

    clickPlantDropdown() {
        this.elements.plantDropdown().should("be.visible").focus();
    }

    verifyDropdownEnabled() {
        this.elements.plantDropdown().should("be.enabled");
    }

    verifyPlantsDisplayed() {
        this.elements.plantDropdownOptions().should("have.length.greaterThan", 1);
    }

    verifyPlantHasStockInfo(plantName) {
        this.elements.plantDropdownOptions().each(($option) => {
            const text = $option.text();
            if (text && !text.includes("Select") && text.trim() !== "") {
                expect(text).to.match(/\d+/);
            }
        });
    }

    enterQuantity(quantity) {
        this.elements.quantityField().clear().type(quantity);
    }

    submitForm() {
        this.elements.submitButton().click();
    }

    clickCancel() {
        this.elements.cancelButton().click();
    }

    verifyValidationError() {
        this.elements.quantityField().then(($input) => {
            const validationMessage = $input[0].validationMessage;
            if (validationMessage) {
                expect(validationMessage).to.not.be.empty;
            } else {
                cy.get("body").then(($body) => {
                    const hasError =
                        $body.find(
                            ".error-message, .alert-danger, .invalid-feedback, [class*='error'], [role='alert']",
                        ).length > 0;
                    const isButtonDisabled = this.elements.submitButton().should("be.disabled");
                    expect(hasError || isButtonDisabled).to.be.true;
                });
            }
        });
    }
}

export default new SellPlantPage();
