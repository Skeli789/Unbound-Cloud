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
    """
    # Load the activation code from the user file
    accountFile = os.path.join(APPDATA, "unboundcloud", "accounts", f"user_{TEST_USERNAME}.json")
    with open(accountFile, "r") as f:
        accountData = json.load(f)
        activationCode = accountData["activationCode"]

    return activationCode


def ActivateAccount(driver: webdriver.Chrome, tester: TestCase):
    activationForm = driver.find_element(By.ID, "activation-form")
    activationCode = LoadActivationCode()
    activationCodeField = activationForm.find_element(By.NAME, "code")
    activationCodeField.send_keys(activationCode)
    activationCodeField.clear()

    # Resend the activation code
    resendButton = activationForm.find_element(By.ID, "resend-code-button")
    resendButton.click()

    # Wait for the pop-up
    WaitAndClosePopUp(driver, "Check your email for the new code!", "OK")

    # Click the resend button again
    resendButton.click()

    # Wait for the error message to appear
    WaitAndClosePopUp(driver, "Please wait 120 seconds before sending another code.", "Okay")

    # Load the new activation code from the user file
    newActivationCode = LoadActivationCode()

    # Copy to clipboard
    pyperclip.copy(newActivationCode)

    # Confirm the activation code is the same as before
    tester.assertEqual(activationCode, newActivationCode, "Activation code is not the same as before.")

    # Use the paste button
    if not APPDATA == "/":
        # For Windows, use the paste button
        pasteButton = activationForm.find_element(By.ID, "paste-button")
        pasteButton.click()

    # Confirm the activation code is pasted correctly
    tester.assertEqual(activationCodeField.get_attribute("value"), newActivationCode, "Activation code is not pasted correctly.")

    # Click the activate button
    try:
        activateButton = activationForm.find_element(By.ID, "submit-code-button")
        activateButton.click()
    except ElementClickInterceptedException:
        pass # Ignore this

    # Wait for the activation complete message to appear
    WaitAndClosePopUp(driver, "Account activated successfully!", "OK")
