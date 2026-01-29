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
    categoryList: () => cy.get('table')
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
}

export default new CategoryPage();