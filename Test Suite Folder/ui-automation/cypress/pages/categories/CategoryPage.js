class CategoryPage {
  elements = {
    // 1. "Add A Category" Link (Verified from previous step)
    addCategoryBtn: () => cy.contains('Add A Category'),

    // 2. Name Input (Verified in your screenshot)
    // It is just 'input[name="name"]' on the new page
    nameInput: () => cy.get('input[name="name"]'), 

    // 3. Parent Dropdown (FIXED based on your screenshot!)
    // Changed from 'parent' to 'parentId'
    parentDropdown: () => cy.get('select[name="parentId"]'), 
    
    // 4. Save Button (Verified in your screenshot as type="submit")
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
      // Selects the first option (which is usually "Main Category" or blank)
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