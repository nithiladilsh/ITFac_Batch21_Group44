class SalesPage {
    elements = {
        sellPlantBtn: () => cy.contains("a", "Sell Plant"),
    };
    visit() {
        cy.visit("/sales");
    }
    clickSellPlant() {
        this.elements.sellPlantBtn().click();
    }
}

export default new SalesPage();
