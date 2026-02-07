@api
Feature: Plant API Modification Restrictions (Standard User)

Background:
    Given the API Service is running
    And a User Auth Token is available

Scenario: API_TC_51 - Verify that Standard Users are forbidden from deleting plants
    Given a valid plant exists in the system
    When I send a DELETE request to remove the plant as a standard user
    Then the plant response status should be 403
    And the response indicates non-admin access is forbidden

  # UPDATE PLANT - RBAC
Scenario: API_TC_52 - Verify that Standard Users are forbidden from updating plants
    Given a valid plant exists in the system
    When I send a PUT request to update the plant as a standard user
    Then the plant response status should be 400
    And the response should contain an error message

Scenario: API_TC_53 - Verify API sorts plants by Name
    Given multiple plants exist with different names
    When I send a GET request to fetch plants sorted by name ascending
    Then the plant response status should be 200
    And the plants should be sorted alphabetically by name

Scenario: API_TC_54 - Verify API sorts plants by Price
    Given multiple plants exist with different prices
    When I send a GET request to fetch plants sorted by price ascending
    Then the plant response status should be 200
    And the plants should be sorted numerically by price

Scenario: API_TC_55 - Verify API sorts plants by Quantity
    Given multiple plants exist with different quantities
    When I send a GET request to fetch plants sorted by quantity ascending
    Then the plant response status should be 200
    And the plants should be sorted numerically by quantity