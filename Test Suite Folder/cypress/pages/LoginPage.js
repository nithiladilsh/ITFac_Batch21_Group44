class LoginPage {

elements = {
    usernameInput: () => cy.get('input[name="username"]'),
    passwordInput: () => cy.get('input[name="password"]'),
    loginBtn: () => cy.get('button[type="submit"]'),

    // For empty field errors
    inputError: () => cy.get('.invalid-feedback'),

    // For server errors like "Invalid username or password."
    globalError: () => cy.get('.alert.alert-danger'), 
  };

  visit() {
    cy.visit("/login");
  }

  submitLogin(username, password) {
    this.elements.usernameInput().clear().type(username);
    this.elements.passwordInput().clear().type(password);
    this.elements.loginBtn().click();
  }
}

export default new LoginPage();