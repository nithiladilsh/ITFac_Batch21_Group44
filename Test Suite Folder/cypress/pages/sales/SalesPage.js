class SalesPage {
    elements = {
        sellPlantBtn: () => cy.contains("a", "Sell Plant"),
        salesTable: () => cy.get("table, .sales-list, [class*='table']"),
        salesRecords: () => this.elements.salesTable().find("tbody tr"),
        deleteButton: (index = 0) =>
            this.elements
                .salesRecords()
                .eq(index)
                .find("button.btn-outline-danger, button .bi-trash")
                .first(),
    };
    visit() {
        cy.visit("/sales");
    }
    clickSellPlant() {
        this.elements.sellPlantBtn().click();
    }

    verifySalesRecordsExist() {
        this.elements.salesRecords().should("have.length.greaterThan", 0);
    }

    selectFirstSalesRecord() {
        this.elements.salesRecords().first().should("be.visible");
    }

    verifyDeleteButtonVisible(index = 0) {
        this.elements.deleteButton(index).should("be.visible").and("be.enabled");
    }

    clickDeleteButton(index = 0) {
        this.elements.deleteButton(index).click();
    }

    getSalesRecordCount() {
        return this.elements.salesRecords().its("length");
    }
}

export default new SalesPage();
