class PlantPage {
    elements = {
        // Main plant table
        plantTable: () => cy.get('table'),

        tableRows: () => cy.get('tbody tr'),

        //Pagination controls
        paginationControls: () => cy.get('ul.pagination'),
        nextPageBtn: () => cy.get('ul.pagination').contains('Next').parent(),
        prevPageBtn: () => cy.get('ul.pagination').contains('Previous').parent(),

        firstPlantRow: () => cy.get('tbody tr').first()
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

}

export default new PlantPage();
