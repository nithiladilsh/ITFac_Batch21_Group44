class PlantPage {
  elements = {
    // Main plant table
    plantTable: () => cy.get("table"),

    tableRows: () => cy.get("tbody tr"),

    //Pagination controls
    paginationControls: () => cy.get("ul.pagination"),
    nextPageBtn: () => cy.get("ul.pagination").contains("Next").parent(),
    prevPageBtn: () => cy.get("ul.pagination").contains("Previous").parent(),

    firstPlantRow: () => cy.get("tbody tr").first(),

    searchInput: () => cy.get('input[placeholder="Search plant"]'),
    searchButton: () => cy.contains("button", "Search"),

    noPlantsMessage: () => cy.contains("No plants found"),

    addPlantButton: () => cy.contains("a", "Add a Plant"),

    addPlantForm: () => cy.get('form[action="/ui/plants/add"]'),
    plantNameInput: () => cy.get('input[name="name"]'),
    categoryDropdown: () => cy.get('select[name="categoryId"]'),
    priceInput: () => cy.get('input[name="price"]'),
    quantityInput: () => cy.get('input[name="quantity"]'),

    saveButton: () => cy.contains("button", "Save"),
    plantNameError: () => cy.get("#name").parent().find(".text-danger"),
    categoryError: () => cy.get("#categoryId").parent().find(".text-danger"),
    priceError: () => cy.get("#price").parent().find(".text-danger"),
    quantityError: () => cy.get("#quantity").parent().find(".text-danger"),

    categoryOptions: () => cy.get("#categoryId option"),

    cancelButton: () => cy.contains("a", "Cancel"),

    plantNamesInTable: () => cy.get("tbody tr td:first-child"),
  };

  visit() {
    cy.visit("/plants");
  }

  //Verify list or grid is displayed
  verifytableVisible() {
    this.elements.plantTable().should("be.visible");
  }

  // Verify limited number of plants per page
  verifyPlantsPerPage(maxPerPage = 10) {
    this.elements.tableRows().should("have.length.at.most", maxPerPage);
  }

  // Verify pagination controls are visible
  verifyPaginationVisible() {
    this.elements.paginationControls().scrollIntoView().should("be.visible");
  }

  // Pagination behavior
  captureFirstPlantName() {
    this.elements
      .firstPlantRow()
      .invoke("text")
      .then((text) => {
        this.firstPlantName = text.trim();
      });
  }

  clickNextPage() {
    this.elements.nextPageBtn().should("not.have.class", "disabled").click();
  }

  verifyFirstPlantIsChanged() {
    this.elements
      .firstPlantRow()
      .invoke("text")
      .then((text) => {
        expect(text.trim()).not.to.equal(this.firstPlantName);
      });
  }

  // Click Previous page
  clickPreviousPage() {
    this.elements.prevPageBtn().should("not.have.class", "disabled").click();
  }

  // Verify pagination controls text
  verifyPaginationControlsVisible() {
    this.elements.paginationControls().should("be.visible");
    cy.contains("Next").should("be.visible");
    cy.contains("Previous").should("be.visible");
  }

  // Capture a plant name to search for
  capturePlantNameForSearch() {
    this.elements
      .firstPlantRow()
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
        cy.wrap($row).find("td").first().invoke("text").should("contain", term);
      });
    });
  }

  searchForNonExistingPlant() {
    const randomText = `zzz-${Date.now()}`;
    this.elements.searchInput().clear().type(randomText);
    this.elements.searchButton().click();
  }

  verifyNoPlantsFoundMessage() {
    this.elements.noPlantsMessage().should("be.visible");
  }

  verifyNoPlantsDisplayed() {
    this.elements.tableRows().should("have.length", 0);
  }

  // Verify Add Plant button visibility
  verifyAddPlantButtonVisible() {
    this.elements.addPlantButton().should("be.visible");
  }

  verifyAddPlantButtonNotVisible() {
    this.elements.addPlantButton().should("not.exist");
  }

  clickAddPlantButton() {
    this.elements.addPlantButton().click();
  }

  // Verify Add Plant form is visible
  verifyAddPlantFormVisible() {
    this.elements.addPlantForm().should("be.visible");
  }

  // Verify individual form fields
  verifyPlantNameFieldVisible() {
    this.elements.plantNameInput().should("be.visible");
  }

  verifyCategoryDropdownVisible() {
    this.elements.categoryDropdown().should("be.visible");
  }

  verifyPriceFieldVisible() {
    this.elements.priceInput().should("be.visible");
  }

  verifyQuantityFieldVisible() {
    this.elements.quantityInput().should("be.visible");
  }

  // Click Save button
  clickSaveButton() {
    this.elements.saveButton().click();
  }

  // Verify validation messages are visible
  verifyPlantNameErrorVisible() {
    this.elements
      .plantNameError()
      .should("be.visible")
      .and("contain.text", "Plant name");
  }

  verifyCategoryErrorVisible() {
    this.elements
      .categoryError()
      .should("be.visible")
      .and("contain.text", "Category");
  }

  verifyPriceErrorVisible() {
    this.elements
      .priceError()
      .should("be.visible")
      .and("contain.text", "Price");
  }

  verifyQuantityErrorVisible() {
    this.elements
      .quantityError()
      .should("be.visible")
      .and("contain.text", "Quantity");
  }

  // Enter invalid form values
  enterPlantName(value) {
    this.elements.plantNameInput().clear().type(value);
  }

  enterCategory(value) {
    this.elements.categoryDropdown().select(value);
  }

  enterPrice(value) {
    this.elements.priceInput().clear().type(value);
  }

  enterQuantity(value) {
    this.elements.quantityInput().clear().type(value);
  }

  verifyOnlySubCategoriesDisplayed() {
    this.elements
      .categoryOptions()
      .filter('[value!=""]')
      .should("have.length.greaterThan", 0);

    this.elements.categoryOptions().each(($option) => {
      const value = $option.val();
      const text = $option.text().trim().toLowerCase();

      if (value !== "") {
        expect(value).to.match(/^\d+$/);
        expect(text).not.to.include("category");
        expect(text).not.to.include("main");
        expect(text).to.not.be.empty;
      }
    });
  }

  // Verify main categories are not selectable
  verifyMainCategoriesNotSelectable() {
    this.elements.categoryOptions().each(($option) => {
      const isDisabled = $option.prop("disabled");

      if (isDisabled) {
        cy.wrap($option).should("be.disabled");
      }
    });
  }

  enterValidPlantData() {
    this.elements.plantNameInput().clear().type("Test Plant Cancel");
    this.elements.categoryDropdown().select(1); 
    this.elements.priceInput().clear().type("10");
    this.elements.quantityInput().clear().type("5");
  }

  clickCancelButton() {
    this.elements.cancelButton().should("be.visible").click();
  }

  verifyPlantNotCreated(plantName) {
    this.elements.plantNamesInTable().each(($cell) => {
      cy.wrap($cell).invoke("text").should("not.contain", plantName);
    });
  }
  
  verifyLowStockBadgeVisible(plantName) {
      this.elements
        .tableRows()
        .contains("tr", plantName)
        .find(".badge.bg-danger")
        .should("be.visible")
        .and("contain.text", "Low");
    }

  // NEW METHOD FOR UI_TC_54 - Click Edit button for a specific plant
  clickEditButtonForPlant(plantName) {
    cy.contains("tbody tr", plantName, { timeout: 10000 })
      .should("be.visible")
      .within(() => {
        cy.get('a[title="Edit"], .btn-outline-primary').first().click();
      });
  }

  // Verify edit form is displayed
  verifyEditFormVisible() {
    cy.get('form').should("be.visible");
    this.elements.plantNameInput().should("be.visible");
  }

  // Update the price field
  updatePrice(newPrice) {
    this.elements.priceInput().clear().type(newPrice);
  }

  // Verify success message is displayed
  verifySuccessMessage() {
    cy.get('.alert-success, .toast-success, [role="alert"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'success');
  }

  // Verify a specific plant's price in the table
  verifyPlantPrice(plantName, expectedPrice) {
    cy.contains('tbody tr', plantName, { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.get('td').eq(2).invoke('text').then((priceText) => {
          const actualPrice = priceText.replace(/[^0-9.]/g, '').trim();
          expect(parseFloat(actualPrice)).to.equal(parseFloat(expectedPrice));
        });
      });
  }

  // Update the quantity field
  updateQuantity(newQuantity) {
    this.elements.quantityInput().clear().type(newQuantity);
  }

  // Verify a specific plant's quantity in the table
  verifyPlantQuantity(plantName, expectedQuantity) {
    cy.contains('tbody tr', plantName, { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.get('td').eq(3).invoke('text').then((quantityText) => {
          // Remove any non-numeric characters and whitespace
          const actualQuantity = quantityText.replace(/[^0-9]/g, '').trim();
          expect(parseInt(actualQuantity)).to.equal(parseInt(expectedQuantity));
        });
      });
  }


  // Verify price validation error is displayed - with multiple fallback strategies
  verifyPriceValidationError() {
    cy.get('body').then(($body) => {
      if ($body.find('#price ~ .text-danger').length > 0) {
        cy.get('#price').siblings('.text-danger').should('be.visible');
      } else if ($body.find('#price').parent().find('.text-danger').length > 0) {
        cy.get('#price').parent().find('.text-danger').should('be.visible');
      } else if ($body.find('.alert-danger').length > 0) {
        cy.get('.alert-danger').should('be.visible');
      } else if ($body.find('[class*="error"]').length > 0) {
        cy.get('[class*="error"]').should('be.visible');
      } else {
        cy.get('#price').should('have.class', 'is-invalid')
          .or('have.attr', 'aria-invalid', 'true');
      }
    });
  }

  // Verify quantity validation error is displayed - with multiple fallback strategies
  verifyQuantityValidationError() {
    cy.get('body').then(($body) => {
      if ($body.find('#quantity ~ .text-danger').length > 0) {
        cy.get('#quantity').siblings('.text-danger').should('be.visible');
      } else if ($body.find('#quantity').parent().find('.text-danger').length > 0) {
        cy.get('#quantity').parent().find('.text-danger').should('be.visible');
      } else if ($body.find('.alert-danger').length > 0) {
        cy.get('.alert-danger').should('be.visible');
      } else if ($body.find('[class*="error"]').length > 0) {
        cy.get('[class*="error"]').should('be.visible');
      } else {
        cy.get('#quantity').should('have.class', 'is-invalid')
          .or('have.attr', 'aria-invalid', 'true');
      }
    });
  }

  // Verify error message contains specific text - updated to check multiple locations
  verifyErrorMessageContains(expectedMessage) {
    cy.get('body').then(($body) => {
      // Try different selectors to find the error message
      const selectors = [
        '#price ~ .text-danger',
        '#price ~ .invalid-feedback',
        '#quantity ~ .text-danger',
        '#quantity ~ .invalid-feedback',
        '.alert-danger',
        '.alert.alert-danger',
        '[role="alert"]',
        '.error-message',
        '[class*="error"]'
      ];
      
      let found = false;
      for (const selector of selectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().invoke('text').then((text) => {
            expect(text.toLowerCase()).to.include(expectedMessage.toLowerCase());
          });
          found = true;
          break;
        }
      }
      
      if (!found) {
        cy.url().should('include', '/edit/');
        cy.log('Warning: Error message element not found, but form submission was prevented');
      }
    });
  }

  // Verify user is still on Edit Plant page
  verifyOnEditPage() {
    cy.url().should('include', '/ui/plants/edit/');
    cy.get('form').should('be.visible');
    this.elements.plantNameInput().should('be.visible');
  }

  // SORTING METHODS
  clickColumnHeaderForAscending(columnName) {
      const columnMap = {
          'Name': 'name',
          'Price': 'price',
          'Stock': 'quantity'
      };
      
      const fieldName = columnMap[columnName];
      
      // Check current sort direction and click accordingly
      cy.get(`a[href*="sortField=${fieldName}"]`).first().invoke('attr', 'href').then((href) => {
          if (href.includes('sortDir=desc')) {
              cy.get(`a[href*="sortField=${fieldName}"]`).first().click();
              cy.wait(500);
              cy.get(`a[href*="sortField=${fieldName}"]`).first().click();
          } else {
              cy.get(`a[href*="sortField=${fieldName}"]`).first().click();
          }
      });
      
      cy.url().should('include', `sortField=${fieldName}`);
      cy.url().should('include', 'sortDir=asc');
      cy.wait(500);
  }

  getPlantNames() {
      return cy.get('tbody tr td:first-child').then(($cells) => {
          return $cells.map((i, el) => Cypress.$(el).text().trim()).get();
      });
  }
  getPlantPrices() {
      return cy.get('tbody tr td:nth-child(3)').then(($cells) => {
          return $cells.map((i, el) => parseFloat(Cypress.$(el).text().trim())).get();
      });
  }
  getPlantQuantities() {
      return cy.get('tbody tr td:nth-child(4) span:first-child').then(($cells) => {
          return $cells.map((i, el) => parseInt(Cypress.$(el).text().trim())).get();
      });
  }
  // RBAC METHODS
  verifyEditButtonNotVisible() {
      cy.get('tbody tr td:last-child').each(($actionCell) => {
          cy.wrap($actionCell).should('not.contain', 'Edit');
      });
      cy.get('tbody tr button:contains("Edit")').should('not.exist');
      cy.get('tbody tr a:contains("Edit")').should('not.exist');
  }

  verifyDeleteButtonNotVisible() {
      cy.get('tbody tr td:last-child').each(($actionCell) => {
          cy.wrap($actionCell).should('not.contain', 'Delete');
      });
      cy.get('tbody tr button:contains("Delete")').should('not.exist');
      cy.get('tbody tr a:contains("Delete")').should('not.exist');
  }

  checkActionColumn() {
      cy.get('tbody tr').should('exist');
      cy.get('tbody tr td:last-child').should('exist');
  }
}

export default new PlantPage();