@contract
Feature: Server Factory - Contract Tests

  The createServer factory output conforms to expected contracts.

  Scenario: Server has correct name and version
    When I create a server instance
    Then the server name should be "coffee-mate"
    And the server version should be "1.0.0"
