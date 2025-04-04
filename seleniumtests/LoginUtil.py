from selenium import webdriver
from selenium.webdriver.common.by import By

from seleniumtests.SignUpUtil import WaitForSignUpPage
from seleniumtests.TestUtils import *


def WaitForLoginPage(driver: webdriver.Chrome):
    """
    Wait for the login page to load.

    :param driver: The Selenium WebDriver instance.
    """
    return WaitForElement(driver, By.ID, "login-form")


def LogOut(driver: webdriver.Chrome):
    """
    Log out of the account by clicking the logout button.

    :param driver: The Selenium WebDriver instance.
    """
    # Click the logout button
    logoutButton = driver.find_element(By.ID, "logout-button")
    logoutButton.click()


def HandleLogin(driver: webdriver.Chrome):
    """
    Handle the login process by filling in the login form and clicking the login button.

    :param driver: The Selenium WebDriver instance.
    """
    # Click the sign-up button
    loginForm = WaitForLoginPage(driver)
    signUpButton = loginForm.find_element(By.ID, "switch-to-sign-up-button")
    signUpButton.click()

    # Click the login button again
    signUpPage = WaitForSignUpPage(driver)
    loginButton = signUpPage.find_element(By.ID, "switch-to-login-button")
    loginButton.click()

    # Get the elements on the page
    loginForm = WaitForLoginPage(driver)
    usernameField = loginForm.find_element(By.NAME, "username")
    passwordField = loginForm.find_element(By.NAME, "password")
    loginButton = loginForm.find_element(By.ID, "login-button")

    # Fill in the login form incorrectly
    usernameField.send_keys(TEST_USERNAME)
    passwordField.send_keys("wrong_password")

    # Click the login button
    loginButton.click()

    # Wait for the "Incorrect password" message to appear
    WaitAndClosePopUp(driver, "Incorrect password!", "Okay")

    # Type backspace to clear the password field
    while passwordField.get_attribute("value"):
        passwordField.send_keys("\ue003")

    # Fill in the login form correctly
    passwordField.send_keys(TEST_PASSWORD)

    # Click the login button
    loginButton.click()
