Feature: Category Validation and Retrieval (Standard User)

  Background:
    Given the API Service is running
    And a User Auth Token is available

  Scenario: API_TC_07Verify that the API pagination returns the correct item count
    When I send a GET request to retrieve categories with page 0 and size 5
    Then the category response status should be 200
    And the response body should contain exactly 5 categories

  Scenario: API_TC_08 - Verify that Standard Users are forbidden from creating categories
    When I send a POST request to create a category with name "Hack"
    Then the category response status should be 403