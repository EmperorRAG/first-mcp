@integration
Feature: Coffee Repository - Integration Tests

  Cross-method consistency and data integrity of the InMemoryCoffeeRepository.

  Scenario: Every coffee from findAll is findable by name
    Given the coffee repository is initialized
    When I request all coffees
    Then every coffee should be findable by its name

  Scenario: All coffees have valid prices
    Given the coffee repository is initialized
    When I request all coffees
    Then every coffee should have a positive price

  Scenario: All coffees have valid caffeine values
    Given the coffee repository is initialized
    When I request all coffees
    Then every coffee should have a non-negative caffeine value
