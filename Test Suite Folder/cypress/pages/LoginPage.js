class LoginPage {
  visit() {
    cy.visit('/ui/login');
  }

  enterUsername(name) {
    // Correct Selector for your app
    cy.get('input[name="username"]').clear().type(name); 
  }

  enterPassword(pass) {
    // Correct Selector for your app
    cy.get('input[name="password"]').clear().type(pass);
  }

  clickLogin() {
    cy.get('button[type="submit"]').click();
  }

  // I added this missing function back!
  verifyDashboard() {
    cy.url().should('not.include', '/login');
  }
}

export default new LoginPage();