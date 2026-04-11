@integration
Feature: Get A Coffee Service - Integration Tests

  Full stack integration through Tool → Controller → Service → Repository.

  Scenario: Retrieve an existing coffee by name
    Given the get-a-coffee module is registered
    When I call the "get-a-coffee" tool with name "Flat White"
    Then the response text should contain "Flat White"
    And the response text should contain a price of 4.5

  Scenario: Retrieve a non-existent coffee
    Given the get-a-coffee module is registered
    When I call the "get-a-coffee" tool with name "Nonexistent"
    Then the response text should be "Coffee not found"
