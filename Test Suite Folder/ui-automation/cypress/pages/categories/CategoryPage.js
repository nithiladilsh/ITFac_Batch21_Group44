class CategoryPage {
  elements = {
    // 1. "Add A Category" 
    addCategoryBtn: () => cy.contains('Add A Category'),

    // 2. Name Input
    nameInput: () => cy.get('input[name="name"]'), 

    // 3. Parent Dropdown 
    parentDropdown: () => cy.get('select[name="parentId"]'), 
    
    // 4. Save Button 
    saveBtn: () => cy.contains('button', 'Save'),
    
    // 5. Success Message
    successMessage: () => cy.get('.alert-success'), 
    
    // 6. Category List Table
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
}

export default new CategoryPage();