class SellPlantPage {
    elements = {
        plantDropdown: () => cy.get("#plantId"),
        plantDropdownOptions: () => this.elements.plantDropdown().find("option"),
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
}

export default new SellPlantPage();
