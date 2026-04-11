@unit
Feature: Server Config - Unit Tests

  The server configuration module provides server name, version, and port.

  Scenario: Server name is defined
    Given the server config is loaded
    Then SERVER_NAME should be "coffee-mate"

  Scenario: Server version is defined
    Given the server config is loaded
    Then SERVER_VERSION should be "1.0.0"

  Scenario: Default port is 3001
    Given the server config is loaded
    Then DEFAULT_PORT should be 3001

  Scenario: getPort returns default when PORT env is not set
    Given the PORT environment variable is not set
    When I call getPort
    Then the port should be 3001

  Scenario: getPort reads PORT environment variable
    Given the PORT environment variable is set to "5000"
    When I call getPort
    Then the port should be 5000
