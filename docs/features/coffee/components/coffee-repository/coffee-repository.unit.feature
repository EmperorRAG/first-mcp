@unit
Feature: Coffee Repository - Unit Tests

  The InMemoryCoffeeRepository provides data access for coffee items.

  Scenario: Retrieve all coffees
    Given the coffee repository is initialized
    When I request all coffees
    Then I should receive 4 coffee items

  Scenario: Find a coffee by exact name
    Given the coffee repository is initialized
    When I search for "Flat White"
    Then I should receive a coffee named "Flat White"
    And the coffee price should be 4.5

  Scenario: Search for a non-existent coffee
    Given the coffee repository is initialized
    When I search for "Mocha"
    Then I should receive no coffee
