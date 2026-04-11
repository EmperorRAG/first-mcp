@contract
Feature: Server Config - Contract Tests

  The server configuration exports conform to their expected types and constraints.

  Scenario: SERVER_NAME is a non-empty string
    Given the server config is loaded
    Then SERVER_NAME should be a non-empty string

  Scenario: SERVER_VERSION follows semver format
    Given the server config is loaded
    Then SERVER_VERSION should match semver format

  Scenario: DEFAULT_PORT is a valid port number
    Given the server config is loaded
    Then DEFAULT_PORT should be a number between 1 and 65535

  Scenario: getPort always returns a number
    Given the PORT environment variable is set to "3000"
    When I call getPort
    Then the port should be a number
