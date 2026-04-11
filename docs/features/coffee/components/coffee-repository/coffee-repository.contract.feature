@contract
Feature: Coffee Repository - Contract Tests

  Each coffee object conforms to the Coffee interface contract.

  Scenario: Coffee objects have all required properties
    Given the coffee repository is initialized
    When I request all coffees
    Then each coffee should have an "id" property of type "number"
    And each coffee should have a "name" property of type "string"
    And each coffee should have a "size" property of type "string"
    And each coffee should have a "price" property of type "number"
    And each coffee should have an "iced" property of type "boolean"
    And each coffee should have a "caffeineMg" property of type "number"

  Scenario: Coffee objects have no extra properties
    Given the coffee repository is initialized
    When I request all coffees
    Then each coffee should have exactly 6 properties
