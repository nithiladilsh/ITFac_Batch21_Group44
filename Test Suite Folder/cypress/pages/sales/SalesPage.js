class SalesPage {
    elements = {
        sellPlantBtn: () => cy.contains("a", "Sell Plant"),
        salesTable: () => cy.get("table.sales-list, table.table").filter(':visible'), 
        salesRecords: () => this.elements.salesTable().find("tbody tr"), 
        deleteButton: (index = 0) =>
            this.elements.salesRecords().eq(index).find("button.btn-outline-danger") 
    };

    visit() {
        cy.visit("/sales");
        // Ensure table is visible before continuing
        this.elements.salesTable().should('be.visible'); 
    }

    clickSellPlant() {
        this.elements.sellPlantBtn().click();
    }

    verifySalesRecordsExist() {
        // Confirm data is present and not the "No sales found" message
        this.elements.salesRecords()
            .should("have.length.at.least", 1)
            .and("not.contain", "No sales found");
    }

    selectFirstSalesRecord() {
        this.elements.salesRecords().first().should("be.visible");
    }

    verifyDeleteButtonVisible(index = 0) {
        // Use first() to grab the specific button in the row
        this.elements.deleteButton(index).first().should("be.visible").and("be.enabled"); 
    }

    clickDeleteButton(index = 0) {
        // click({ force: true }) helps bypass the inner <i> icon
        this.elements.deleteButton(index).first().click({ force: true }); 
    }

    getSalesRecordCount() {
        return this.elements.salesRecords().its("length");
    }
}

export default new SalesPage();