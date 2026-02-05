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
    resetBtn: () => cy.contains('a', 'Reset'),

    // Locates the "No Data" row in the table
    noResultsRow: () => cy.contains('td', 'No category found'),

    // Filter Dropdown (Usually near the search bar)
    // We assume it's the select inside the search form area
    filterParentDropdown: () => cy.get('form').find('select'),

    // Pagination Buttons
    nextPageBtn: () => cy.get('ul.pagination').contains('Next').parent(),
    prevPageBtn: () => cy.get('ul.pagination').contains('Previous').parent(),

    // First row in the table (to check if data changed)
    firstCategoryRow: () => cy.get('tbody tr').first().find('td').eq(1),

    // The red error alert banner at the top of the form
    errorBanner: () => cy.contains('.alert', 'already exists'),

    //215131E
    // "Delete" button in each category row (finds by title attribute)
    deleteButton: () => cy.get('button[title="Delete"]'),

    // Delete confirmation modal
    deleteModal: () => cy.get('#deleteModal'),

    // "Edit" button in each category row (anchor with title)
    editButton: () => cy.get('a[title="Edit"]'),

  };

  visit() {
    cy.visit("/categories");
  }

  clickAddCategory() {
    this.elements.addCategoryBtn().should('be.visible').click();
  }

  enterCategoryName(name) {
    this.elements.nameInput().should('be.visible').and('not.be.disabled').clear().type(name);
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

  // UI_TC_16 - Verify that pagination works correctly in the Category List
  firstItemName = "";

  captureFirstItemName() {
    this.elements.firstCategoryRow().invoke('text').then((text) => {
      this.firstItemName = text.trim();
    });
  }

  clickNextPage() {
    this.elements.nextPageBtn().click();
  }

  verifyFirstItemIsDifferent() {
    this.elements.firstCategoryRow().invoke('text').then((text) => {
      expect(text.trim()).not.to.equal(this.firstItemName);
    });
  }

  verifyPreviousButtonEnabled() {
    this.elements.prevPageBtn().should('not.have.class', 'disabled');
  }

  clickPreviousPage() {
    this.elements.prevPageBtn().click();
  }

  verifyFirstItemIsSame() {
    this.elements.firstCategoryRow().invoke('text').then((text) => {
      expect(text.trim()).to.equal(this.firstItemName);
    });
  }

  // UI_TC_17 - Verify that the "Add Category" button is not visible for a Standard User
  verifyAddCategoryButtonNotVisible() {
    this.elements.addCategoryBtn().should('not.exist');
  }

  // UI_TC_18 - Verify that search term persists after performing a search
  verifySearchInputValue(expectedValue) {
    this.elements.searchInput().should('have.value', expectedValue);
  }

  verifyAllRowsContain(term) {
    this.elements.categoryTable().find('tbody tr').each(($row) => {
      const rowText = $row.text().toLowerCase();
      expect(rowText).to.contain(term.toLowerCase());
    });
  }

  // UI_TC_66 - Verify that the system prevents duplicate categories
  verifyDuplicateError(message) {
    cy.contains(message).should('be.visible');
  }

  // UI_TC_67 - Verify that resetting the search clears the input field
  verifySearchInputEmpty() {
    this.elements.searchInput().should('have.value', '');
  }

  verifyMultipleItems() {
    this.elements.categoryTable().find('tbody tr').should('have.length.gt', 1);
  }

  //215131E
  // UI_TC_42 - Ensure at least one category exists, create "TemporyC" if not
  ensureAtLeastOneCategoryExists(tempCategoryName = "TemporyC") {
    // Check if the "No category found" row is visible
    cy.get('body').then(($body) => {
      if ($body.find('td:contains("No category found")').length > 0) {
        // No categories exist, so create one
        this.clickAddCategory();
        this.enterCategoryName(tempCategoryName);
        this.clickSave();
        // Optionally, wait for success message or table update
        this.elements.successMessage().should('be.visible');
      }
    });
  }

  // UI_TC_42 - Verify that the "Delete" button is visible for each Category row
  verifyDeleteButtonVisibleAndClickable() {
    this.elements.deleteButton()
      .should('be.visible')
      .and('not.be.disabled');
  }

  // UI_TC_43 - Click the "Delete" button for the first category
  clickDeleteButtonForFirstCategory() {
    this.elements.deleteButton().first().click();
  }

  // UI_TC_43 - Confirm deletion in the modal
  confirmDeleteInModal() {
    this.elements.deleteModal().should('be.visible');
    cy.get('#deleteModal').find('button[type="submit"]').contains('Delete').click();
  }

  // UI_TC_43 - Verify the success message after deletion
  verifyDeleteSuccessMessage(message) {
    this.elements.successMessage().find('span').should('contain', message);
  }

  // UI_TC_43 - Verify the deleted category is no longer in the list
  verifyCategoryNotInList(categoryName) {
    this.elements.categoryTable().should('not.contain', categoryName);
  }

  // UI_TC_44 - Verify that the "Edit" button is visible for each Category row
  verifyEditButtonVisibleAndClickable() {
    this.elements.editButton()
      .should('be.visible')
      .and('not.be.disabled');
  }

  // UI_TC_44 - Click the "Edit" button for the first category
  clickEditButtonForFirstCategory() {
    this.elements.editButton().first().click();
  }

  // UI_TC_44 - Verify navigation to Edit Category form
  verifyNavigatedToEditForm() {
    cy.url().should('match', /\/ui\/categories\/edit\/\d+/);
    cy.get('form').should('be.visible');
  }

  // UI_TC_47 - Capture the name of the category in the given row index (default: first row)
  captureCategoryNameAtRow(rowIndex = 0) {
    cy.get('tbody tr').eq(rowIndex).find('td').eq(1).invoke('text').then((text) => {
      this._originalCategoryName = text.trim();
    });
  }

  // UI_TC_47 - Click the "Cancel" button in the Edit Category form
  clickEditCancel() {
    cy.get('form').find('a.btn.btn-secondary').contains('Cancel').click();
  }

  // UI_TC_47 - Verify navigation back to the Category List after cancel
  verifyNavigatedBackToCategoryList() {
    cy.url().should('include', '/categories');
    cy.contains('Add A Category').should('be.visible');
  }

  // UI_TC_47 - Capture the current name of the first category row
  captureFirstCategoryName() {
    this.elements.firstCategoryRow().invoke('text').then((text) => {
      this._originalCategoryName = text.trim();
    });
  }

  // UI_TC_47 - Verify the first category name is unchanged
  verifyCategoryNameUnchangedAtRow(rowIndex = 0) {
    cy.get('tbody tr').eq(rowIndex).find('td').eq(1).invoke('text').then((text) => {
      expect(text.trim()).to.equal(this._originalCategoryName);
    });
  }

  loginAsStandardUser() {
    cy.visit('/login');
    cy.get('input[name="username"]').clear().type(Cypress.env('stdUser'));
    cy.get('input[name="password"]').clear().type(Cypress.env('stdPass'));
    cy.get('button[type="submit"]').click();
  }
  // UI_TC_48 - Verify that the "Edit" button is not visible or is disabled for each Category row (Non-Admin)
  verifyEditButtonNotVisibleOrDisabled() {
    this.elements.editButton().then(($btns) => {
      if ($btns.length) {
        cy.wrap($btns).each(($btn) => cy.wrap($btn).should('be.disabled'));
      } else {
        expect($btns.length).to.eq(0);
      }
    });
  }

  // UI_TC_50 - Click the Parent Category column header
  clickParentColumnHeader() {
    cy.contains('th', 'Parent').click();
  }

  getParentColumnValues() {
    return this.elements.categoryTable().find('tbody tr').then(($rows) => {
      const strings = $rows.map((index, row) => {
        return Cypress.$(row).find('td').eq(2).text().trim();
      }).get(); 
      
      return strings; 
    });
  }

  // Verify the column is sorted
  verifyParentColumnSorted(order = 'asc') {
    this.getParentColumnValues().then((values) => {
      const originalValues = [...values];
      const sortedValues = [...originalValues].sort((a, b) => {
        if (a === '' && b !== '') return -1;
        if (a !== '' && b === '') return 1;
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });

      if (order === 'desc') {
        sortedValues.reverse();
      }

      cy.log(`Checking ${order} order...`);
      cy.log(`UI Found: ${JSON.stringify(originalValues)}`);
      cy.log(`Expected: ${JSON.stringify(sortedValues)}`);
      
      expect(originalValues).to.deep.equal(sortedValues);
    });
  }  

  // UI_TC_51 - Click the Name column header
  clickNameColumnHeader() {
    // Finds the header containing "Name" (e.g., "Category Name")
    cy.get('thead th')
      .contains(/Name/i) 
      .click({ force: true });
  }

  // Helper to get all text values from the Name column (Index 1)
  getNameColumnValues() {
    return this.elements.categoryTable().find('tbody tr').then(($rows) => {
      return $rows.map((index, row) => {
        return Cypress.$(row).find('td').eq(1).text().trim();
      }).get();
    });
  }

  // Verify the Name column is sorted
  verifyNameColumnSorted(order = 'asc') {
    cy.wait(1000);

    this.getNameColumnValues().then((values) => {
      const originalValues = [...values];
      const sortedValues = [...originalValues].sort((a, b) => {
        return a.localeCompare(b); 
      });

      if (order === 'desc') {
        sortedValues.reverse();
      }

      const uiString = JSON.stringify(originalValues);
      const expectedString = JSON.stringify(sortedValues);
      
      cy.log(`UI: ${uiString}`);
      cy.log(`Exp: ${expectedString}`);

      expect(originalValues, `\nUI Found: ${uiString}\nExpected: ${expectedString}\n`).to.deep.equal(sortedValues);
    });
  }
}

export default new CategoryPage();