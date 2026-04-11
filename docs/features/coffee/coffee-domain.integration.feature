@integration
Feature: Coffee Domain - Integration Tests

  Domain-level integration verifying multi-tool registration and shared state.

  Scenario: Domain registers both tools
    Given the coffee domain is registered on a server
    When I list the registered tools
    Then the tool list should include "get-coffees"
    And the tool list should include "get-a-coffee"

  Scenario: Tools share the same repository data
    Given the coffee domain is registered on a server
    When I call "get-coffees" through the domain
    And I call "get-a-coffee" with name "Flat White" through the domain
    Then the coffee from "get-a-coffee" should appear in the "get-coffees" list
