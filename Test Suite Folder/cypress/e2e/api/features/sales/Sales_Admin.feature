Feature: Sales API - Admin Scenarios

    Background:
        Given the API Service is running
        And an Admin Auth Token is available

    Scenario: API TC 13 - Verify quantity greater than available stock results in no sale recorded
        When I send a POST request to sell a plant with quantity exceeding stock
        Then the sales response status should be 400
        And the response body should confirm "available in stock" or "Insufficient stock"

    Scenario: API TC 14 - Verify sell plant response when quantity is provided as a String
        When I send a POST request to sell a plant with string quantity "five"
        Then the sales response status should be 400
        And the response body should confirm "Failed to convert" or "type mismatch"

    Scenario: API TC 15 - Verify response when mandatory fields are not provided in "Sell Plant"
        When I send a POST request to sell a plant without quantity parameter
        Then the sales response status should be 400
        And the response body should confirm "quantity" or "Required parameter"

    Scenario: API TC 16 - Verify quantity data type enforcement (Float vs Integer)
        When I send a POST request to sell a plant with float quantity "2.5"
        Then the sales response status should be 400
        And the response body should confirm "Failed to convert" or "Invalid"
    
    Scenario: API TC 17 -  Verify behavior when using a non existent PlantID
        When I send a POST request to sell a plant with non-existent plant ID 99999
        Then the sales response status should be 404
        And the response body should confirm "not found" or "does not exist"

    Scenario: API TC 18 -  Verify Invalid Sales record delete execution
        When I send a DELETE request for non-existent sales record ID 99999
        Then the sales response status should be 404
        And the response body should confirm "not found" or "does not exist"

