class PlantPage {
    elements = {
        // Main plant table
        plantTable: () => cy.get('table'),

        tableRows: () => cy.get('tbody tr'),

        //Pagination controls
        paginationControls: () => cy.get('ul.pagination'),
        nextPageBtn: () => cy.get('ul.pagination').contains('Next').parent(),
        prevPageBtn: () => cy.get('ul.pagination').contains('Previous').parent(),

        firstPlantRow: () => cy.get('tbody tr').first(),

        searchInput: () => cy.get('input[placeholder="Search plant"]'),
        searchButton: () => cy.contains("button", "Search"),
    };

    visit() {
        cy.visit("/plants");
    }

    //Verify list or grid is displayed
    verifytableVisible() {
        this.elements.plantTable().should('be.visible');
    }

    // Verify limited number of plants per page
    verifyPlantsPerPage(maxPerPage=10) {
        this.elements.tableRows()
        .should('have.length.at.most', maxPerPage);
    }

    // Verify pagination controls are visible
    verifyPaginationVisible() {
        this.elements.paginationControls()
        .scrollIntoView()
        .should('be.visible');
    }

    // Pagination behavior
    captureFirstPlantName() {
        this.elements.firstPlantRow()
        .invoke('text')
        .then((text) => {
            this.firstPlantName = text.trim();
        });
    }

    clickNextPage() {
        this.elements.nextPageBtn().should('not.have.class', 'disabled').click();
    }

    verifyFirstPlantIsChanged() {
        this.elements.firstPlantRow()
        .invoke('text')
        .then((text) => {
            expect(text.trim()).not.to.equal(this.firstPlantName);
        });
    }

    // Click Previous page
    clickPreviousPage() {
    this.elements.prevPageBtn()
    .should("not.have.class", "disabled")
    .click();
    }

    // Verify pagination controls text
    verifyPaginationControlsVisible() {
    this.elements.paginationControls().should("be.visible");
    cy.contains("Next").should("be.visible");
    cy.contains("Previous").should("be.visible");
    }

    // Capture a plant name to search for
    capturePlantNameForSearch() {
    this.elements.firstPlantRow()
    .find("td")
    .first()
    .invoke("text")
    .then((text) => {
      cy.wrap(text.trim().substring(0, 3)).as("searchTerm");
    });
}


    // Enter search term
    searchPlant() {
    cy.get("@searchTerm").then((term) => {
    this.elements.searchInput().clear().type(term);
    this.elements.searchButton().click();
  });
}


    // Clear search
    clearSearch() {
    this.elements.searchInput().clear();
    this.elements.searchButton().click();
    }

    // Verify only matching plants are shown
    verifySearchResults() {
    cy.get("@searchTerm").then((term) => {
    this.elements.tableRows().each(($row) => {
      cy.wrap($row)
        .find("td")
        .first()
        .invoke("text")
        .should("contain", term);
    });
  });
}


}

export default new PlantPage();
