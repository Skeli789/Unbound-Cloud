import json
import os
import pyperclip
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementClickInterceptedException
from unittest import TestCase

from seleniumtests.TestUtils import *


def LoadPasswordResetCode() -> str:
    """
    Load the password reset code from the account file.

    :return: The password reset code.
    """
    accountFile = os.path.join(APPDATA, "unboundcloud", "accounts", f"user_{TEST_USERNAME}.json")
    with open(accountFile, "r") as f:
        accountData = json.load(f)
        resetCode = accountData.get("passwordResetCode", "")
    
    return resetCode


def TestForgotPassword(driver: webdriver.Chrome, tester: TestCase, newPassword: str):
    """
    Test the forgot password functionality.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param newPassword: The new password to set after the reset.
    """
    # Click on "Forgot Password?" link on the login page
    forgotPasswordLink = WaitForElement(driver, By.ID, "forgot-password-button")
    ClickButton(forgotPasswordLink)

    # Wait for the forgot password form to appear
    forgotPasswordForm = WaitForElement(driver, By.ID, "forgot-password-form")

    # Fill in the email address
    emailField = forgotPasswordForm.find_element(By.NAME, "email")
    emailField.send_keys(TEST_EMAIL)

    # Click the send code button
    sendCodeButton = forgotPasswordForm.find_element(By.ID, "send-code-button")
    ClickButton(sendCodeButton)

    # Wait for the confirmation popup and close it
    WaitAndClosePopUp(driver, "Continue")

    # Now the page should be in the reset password state
    # Wait for the reset password form to appear
    resetPasswordForm = WaitForElement(driver, By.ID, "reset-password-form")
    emailField = resetPasswordForm.find_element(By.NAME, "email")
    codeField = resetPasswordForm.find_element(By.NAME, "one-time-code")
    newPasswordField = resetPasswordForm.find_element(By.NAME, "password")
    confirmPasswordField = resetPasswordForm.find_element(By.NAME, "confirmPassword")
    pasteButton = driver.find_element(By.ID, "paste-button")
    submitButton = resetPasswordForm.find_element(By.CLASS_NAME, "submit-form-button")

    # Confirm the email field is preset
    tester.assertEqual(emailField.get_attribute("value"), TEST_EMAIL, "Email field is not filled in correctly.")

    # Get the reset code
    resetCode = LoadPasswordResetCode()
    tester.assertNotEqual(resetCode, "", "Reset code should not be empty")
    pyperclip.copy(resetCode)

    # Fill in the code (prefer paste button if available)
    if BrowserSupportsPaste():
        ClickButton(pasteButton)
        time.sleep(0.5) # Give it a moment to paste
        tester.assertEqual(codeField.get_attribute("value"), resetCode, "Reset code is not pasted correctly.")
    else:
        # Send the keys because the paste button doesn't work in these browsers
        codeField.send_keys(resetCode)

    # Fill in the new passwords
    newPasswordField.send_keys(newPassword)
    confirmPasswordField.send_keys(newPassword)

    # Submit the form
    ClickButton(submitButton)

    # Wait for success message
    WaitAndClosePopUp(driver, "OK")
    
    # Verify we're back at the login page
    WaitForElement(driver, By.ID, "login-form")
