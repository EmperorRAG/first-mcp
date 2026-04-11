@integration
Feature: Get Coffees Service - Integration Tests

  Full stack integration through Tool → Controller → Service → Repository.

  Scenario: Retrieve all coffees through the full stack
    Given the get-coffees module is registered
    When I call the "get-coffees" tool
    Then the response should contain 4 coffees

  Scenario: Response contains expected coffee names
    Given the get-coffees module is registered
    When I call the "get-coffees" tool
    Then the response should include a coffee named "Flat White"
    And the response should include a coffee named "Cappuccino"
    And the response should include a coffee named "Latte"
    And the response should include a coffee named "Espresso"
