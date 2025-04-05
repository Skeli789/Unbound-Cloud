from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from unittest import TestCase

from seleniumtests.TestUtils import *


def RemoveExistingAccounts():
    # Remove all files and folders in the unboundcloud directory
    # Check if AppData exists
    if not os.path.exists(APPDATA):
        print(f"Directory {APPDATA} does not exist.")
        return

    # Check if unboundcloud directory exists
    unboundcloudDir = os.path.join(APPDATA, "unboundcloud")
    if not os.path.exists(unboundcloudDir):
        print(f"Directory {unboundcloudDir} does not exist.")
        return

    try:
        # Remove the unboundcloud directory and delete all files and folders inside it
        for root, dirs, files in os.walk(unboundcloudDir, topdown=False):
            # Delete all files
            for name in files:
                filePath = os.path.join(root, name)
                os.remove(filePath)
                print(f"Removed file: {filePath}")

            # Delete all directories
            for name in dirs:
                dirPath = os.path.join(root, name)
                os.rmdir(dirPath)
                print(f"Removed directory: {dirPath}")

        # Remove the main directory after its contents are deleted
        os.rmdir(unboundcloudDir)
        print(f"Removed directory: {unboundcloudDir}")
    except OSError as e:
        print(f"Error removing files or directories in {unboundcloudDir}: {e}")


def WaitForSignUpPage(driver: webdriver.Chrome):
    """
    Wait for the sign-up page to load by checking for the presence of the sign-up form.
    """
    return WaitForElement(driver, By.ID, "sign-up-form")


def HandleSignUp(driver: webdriver.Chrome, tester: TestCase):
    """
    Handle the sign-up process by filling in the registration form and clicking the sign-up button.
    """
    # Wait for the sign-up page to load
    signUpForm = WaitForSignUpPage(driver)

    # Fill in the registration form
    FillInSignUpForm(signUpForm, TEST_USERNAME, TEST_EMAIL, TEST_PASSWORD)

    # Confirm the password toggle works
    ConfirmPasswordViewToggleWorks(signUpForm, tester)

    # Click the sign up button and wait for the registration to complete
    driver.save_screenshot(f"Debug_SignUp.png")
    SubmitSignUpForm(driver, signUpForm, tester)


def FillInSignUpForm(signUpForm: WebElement, username: str, email: str, password: str):
    """
    Fill in the sign-up form with the provided username, email, and password.

    :param signUpForm: The sign-up form element.
    :param username: The username to fill in.
    :param email: The email to fill in.
    :param password: The password to fill in.
    """
    # Get elements on the page
    userNameField = signUpForm.find_element(By.NAME, "username")
    emailField = signUpForm.find_element(By.NAME, "email")
    passwordField = signUpForm.find_element(By.NAME, "password")
    confirmPasswordField = signUpForm.find_element(By.NAME, "confirmPassword")

    # Fill in the registration form
    userNameField.send_keys(username)
    emailField.send_keys(email)
    passwordField.send_keys(password)
    confirmPasswordField.send_keys(password)


def ConfirmPasswordViewToggleWorks(signUpForm: WebElement, tester: TestCase):
    """
    Confirm that the password view toggle works by checking the password field is visible and hidden when clicked.
    
    :param signUpForm: The sign-up form element.
    :param tester: The TestCase instance.
    """
    # Get elements on the page
    passwordField = signUpForm.find_element(By.NAME, "password")
    confirmPasswordField = signUpForm.find_element(By.NAME, "confirmPassword")
    viewPasswordButton = signUpForm.find_element(By.ID, "show-password-button")

    # Confirm the password is hidden by default
    tester.assertEqual(passwordField.get_attribute("type"), "password", "Password field is not hidden.")
    tester.assertEqual(confirmPasswordField.get_attribute("type"), "password", "Confirm password field is not hidden.")

    # Show the password
    viewPasswordButton.click()
    tester.assertEqual(passwordField.get_attribute("type"), "text", "Password field is not visible.")
    tester.assertEqual(confirmPasswordField.get_attribute("type"), "text", "Confirm password field is not visible.")

    # Hide the password again
    viewPasswordButton.click()
    tester.assertEqual(passwordField.get_attribute("type"), "password", "Password field is not hidden.")
    tester.assertEqual(confirmPasswordField.get_attribute("type"), "password", "Confirm password field is not hidden.")


def SubmitSignUpForm(driver: webdriver.Chrome, signUpForm: WebElement, tester: TestCase):
    """
    Submit the sign-up form by clicking the sign-up button.

    :param driver: The WebDriver instance.
    :param signUpForm: The sign-up form element.
    :param tester: The TestCase instance.
    """
    # Click the sign up button
    try:
        signUpButton = signUpForm.find_element(By.ID, "sign-up-button")
        signUpButton.click()
    except Exception as e:
        print(f"Error clicking sign up button: {e}")

        # Find the only button and click it
        try:
            button = signUpForm.find_element(By.TAG_NAME, "button")
            button.click()
        except Exception as e:
            # Remove the driver and fail the test
            driver.quit()
            tester.driver = None
            tester.fail(f"Error clicking sign up button: {e}")

    # Wait for the registration complete
    WaitAndClosePopUp(driver, "Registration complete!", "OK")
