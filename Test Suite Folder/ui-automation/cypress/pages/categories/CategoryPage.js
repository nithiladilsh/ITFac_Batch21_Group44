class CategoryPage {
  elements = {
    // "Add A Category" 
    addCategoryBtn: () => cy.contains('Add A Category'),

    // Name Input
    nameInput: () => cy.get('input[name="name"]'), 

    // Parent Dropdown 
    parentDropdown: () => cy.get('select[name="parentId"]'), 
    
    // Save Button 
    saveBtn: () => cy.contains('button', 'Save'),

    // Cancel Button
    cancelBtn: () => cy.contains('Cancel'),
    
    // Success Message
    successMessage: () => cy.get('.alert-success'), 
    
    // Category List Table
    categoryList: () => cy.get('table'),

    // The main table
    categoryTable: () => cy.get('table'), 

    // The column headers
    tableHeaders: () => cy.get('thead th'), 

    // The page numbers at bottom
    paginationControls: () => cy.get('ul.pagination'),

    // Search Inputs
    searchInput: () => cy.get('input[placeholder="Search sub category"]'),
    searchBtn: () => cy.contains('button', 'Search'),
    resetBtn: () => cy.contains('button', 'Reset'),

    // Locates the "No Data" row in the table
    noResultsRow: () => cy.contains('td', 'No category found'),

    // Filter Dropdown (Usually near the search bar)
    // We assume it's the select inside the search form area
    filterParentDropdown: () => cy.get('form').find('select')
  };

  visit() {
    cy.visit("/categories");
  }

  clickAddCategory() {
    this.elements.addCategoryBtn().should('be.visible').click();
  }

  enterCategoryName(name) {
    this.elements.nameInput().should('be.visible').clear().type(name);
  }

  selectParent(parentName) {
    if (parentName === "empty") {
      this.elements.parentDropdown().select(0); 
    } else {
      this.elements.parentDropdown().select(parentName);
    }
  }

  // UI_TC_01 and UI_TC_02: Save the new category
  clickSave() {
    this.elements.saveBtn().click();
  }

  // UI_TC_03 - Verify that the Cancel button functionality closes the form without saving
  clickCancel() {
    this.elements.cancelBtn().click();
  }

  // UI_TC_04 - Verify that the "Add Category" button is visible for an Admin User
  verifyAddCategoryButtonVisible() {
    this.elements.addCategoryBtn()
      .should('be.visible')
      .and('not.be.disabled'); 
  }

  // UI_TC_05 - Verify that the "Parent Category" dropdown updates dynamically after adding a new Category
  verifyParentDropdownContains(optionName) {
    this.elements.parentDropdown()
      .should('be.visible')
      .find('option')         
      .contains(optionName)    
      .should('exist');         
  }

  // UI_TC_06 - Clear the Name field and verify validation error
  clearNameField() {
    this.elements.nameInput().clear();
  }

  verifyValidationError(errorMessage) {
    cy.contains(errorMessage).should('be.visible');
  }

  // UI_TC_11 - Verify that the Category List displays correctly with pagination
  verifyTableVisible() {
    this.elements.categoryTable().should('be.visible');
  }

  verifyTableColumns(col1, col2) {
    // Checks if the headers contain the exact text
    this.elements.tableHeaders().contains(col1).should('be.visible');
    this.elements.tableHeaders().contains(col2).should('be.visible');
  }

  verifyPaginationVisible() {
    this.elements.paginationControls().scrollIntoView().should('be.visible');
  }

  // UI_TC_12 - Verify that a User can successfully search for a category by full name
  enterSearchTerm(term) {
    this.elements.searchInput().should('be.visible').clear().type(term);
  }

  clickSearch() {
    this.elements.searchBtn().click();
  }

  clickReset() {
    this.elements.resetBtn().click();
  }

  // UI_TC_14 - Verify that searching for a non-existent category shows "No Results Found"
  verifyNoResultsMessage(message) {
    this.elements.noResultsRow().should('be.visible').and('contain', message);
  }

  // UI_TC_15 - Verify that filtering by Parent Category works correctly
  selectFilterParent(parentName) {
    this.elements.filterParentDropdown().should('be.visible').select(parentName);
  }
}

export default new CategoryPage();