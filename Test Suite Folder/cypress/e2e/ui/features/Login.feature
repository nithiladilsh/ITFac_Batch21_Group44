Feature: Login Functionality

  Scenario: Successful Login as Admin
    Given I am on the login page
    When I enter valid admin credentials
    Then I should be redirected to the Dashboard

  Scenario: Failed Login with Invalid Credentials
    Given I am on the login page
    When I enter "admin_user" and "WRONG_PASSWORD"
    Then I should see an error message "Invalid username or password."

  Scenario: Successful Login as Standard User
    Given I am on the login page
    When I enter "testuser" and "test123" 
    Then I should be redirected to the Dashboard