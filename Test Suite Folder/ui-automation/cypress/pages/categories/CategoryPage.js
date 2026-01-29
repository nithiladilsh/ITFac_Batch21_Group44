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

  clickSave() {
    this.elements.saveBtn().click();
  }

  clickCancel() {
    this.elements.cancelBtn().click();
  }
}

export default new CategoryPage();