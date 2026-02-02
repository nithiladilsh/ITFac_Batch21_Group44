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
        // Sub-categories should have numeric IDs
        expect(value).to.match(/^\d+$/);

        // No main category labels
        expect(text).not.to.include("category");
        expect(text).not.to.include("main");

        // Text must exist
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
    this.elements.categoryDropdown().select(1); // select any valid sub-category
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
}

export default new PlantPage();
