@api
Feature: Category API Validation (Admin)

  Background:
    Given the API Service is running
    And an Admin Auth Token is available

  Scenario: API_TC_01 - Verify that the API rejects non-string data types for Category Name
    When I send a POST request to create a category with numeric name 1234567
    Then the category response status should be 400
    And the response body should confirm "Validation failed" for category name

  Scenario: API_TC_02 - Verify that the API rejects creation with a non-existent Parent ID
    When I send a POST request to create a category with non-existent parent "99999"
    Then the category response status should be 400
    And the response body should confirm "Validation failed"

  Scenario: API_TC_03 - Verify that the API rejects whitespace-only Category Names
    When I send a POST request to create a category with whitespace name "   "
    Then the category response status should be 400
    And the response body should confirm "Validation failed"

  Scenario: API_TC_04 - Verify that the API prevents creating duplicate Category Names
    When I attempt to create a duplicate category with name "UniqueTest"
    Then the category response status should be 400
    And the response body should confirm "already exists"

  Scenario: API_TC_05 - Verify that the API rejects Null values for Category Name
    When I send a POST request to create a category with null name
    Then the category response status should be 400
    And the response body should confirm "Validation failed"

  Scenario: API_TC_06 - Verify that the API rejects String values for Parent ID
    When I send a POST request to create a category with string parent ID "10"
    Then the category response status should be 400
    And the response body should confirm "Validation failed"