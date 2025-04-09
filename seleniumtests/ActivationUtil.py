import json
import os
import pyperclip
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementClickInterceptedException
from unittest import TestCase

from seleniumtests.TestUtils import *


def LoadActivationCode() -> str:
    """
    Load the activation code from the account file.

    :return: The activation code.
    """
    accountFile = os.path.join(APPDATA, "unboundcloud", "accounts", f"user_{TEST_USERNAME}.json")
    with open(accountFile, "r") as f:
        accountData = json.load(f)
        activationCode = accountData.get("activationCode", "")

    return activationCode


def ActivateAccount(driver: webdriver.Chrome, tester: TestCase):
    """
    Test the account activation functionality.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    """
    # Get elements
    activationForm = driver.find_element(By.ID, "activation-form")
    activationCodeField = activationForm.find_element(By.NAME, "one-time-code")
    pasteButton = activationForm.find_element(By.ID, "paste-button")
    resendButton = activationForm.find_element(By.ID, "resend-code-button")
    activateButton = activationForm.find_element(By.ID, "submit-code-button")
    activationCode = LoadActivationCode()

    # Send the activation code
    ClickButton(resendButton)

    # Wait for the pop-up
    WaitAndClosePopUp(driver, "OK")

    # Click the resend button again
    ClickButton(resendButton)

    # Wait for the error message to appear
    WaitAndClosePopUp(driver, "OK")

    # Copy the new activation code to the clipboard
    newActivationCode = LoadActivationCode()
    tester.assertNotEqual(newActivationCode, "", "New activation code should not be empty")
    pyperclip.copy(newActivationCode)

    # Confirm the activation code is the same as before
    tester.assertEqual(activationCode, newActivationCode, "Activation code is not the same as before.")

    # Fill in the code (prefer paste button if available)
    if BrowserSupportsPaste():
        ClickButton(pasteButton)
        time.sleep(0.5) # Give it a moment to paste
        tester.assertEqual(activationCodeField.get_attribute("value"), newActivationCode, "Activation code is not pasted correctly.")
    else:
        # Send the keys because the paste button doesn't work in these browsers
        activationCodeField.send_keys(newActivationCode)

    # Click the activate button
    try:
        ClickButton(activateButton)
    except ElementClickInterceptedException:
        pass # Ignore this

    # Wait for the activation complete message to appear
    WaitAndClosePopUp(driver, "OK")
