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
    accountFile = os.path.join(APPDATA, "unboundcloud", "accounts", f"user_{TEST_USERNAME}.json")
    with open(accountFile, "r") as f:
        accountData = json.load(f)
        activationCode = accountData["activationCode"]

    return activationCode


def ActivateAccount(driver: webdriver.Chrome, tester: TestCase):
    # Get elements
    activationForm = driver.find_element(By.ID, "activation-form")
    activationCodeField = activationForm.find_element(By.NAME, "one-time-code")

    # Fill in and clear the activation code
    activationCode = LoadActivationCode()
    activationCodeField.send_keys(activationCode)
    activationCodeField.clear()

    # Resend the activation code
    resendButton = activationForm.find_element(By.ID, "resend-code-button")
    ClickButton(resendButton)

    # Wait for the pop-up
    WaitAndClosePopUp(driver, "OK")

    # Click the resend button again
    ClickButton(resendButton)

    # Wait for the error message to appear
    WaitAndClosePopUp(driver, "OK")

    # Copy the new activation code to the clipboard
    newActivationCode = LoadActivationCode()
    pyperclip.copy(newActivationCode)

    # Confirm the activation code is the same as before
    tester.assertEqual(activationCode, newActivationCode, "Activation code is not the same as before.")

    # Use the paste button
    if BROWSER != "firefox" and BROWSER != "safari":
        pasteButton = activationForm.find_element(By.ID, "paste-button")
        ClickButton(pasteButton)
    else:
        # Send the keys because the paste button doesn't work in these browsers
        activationCodeField.send_keys(newActivationCode)

    # Confirm the activation code is pasted correctly
    tester.assertEqual(activationCodeField.get_attribute("value"), newActivationCode, "Activation code is not pasted correctly.")

    # Click the activate button
    try:
        activateButton = activationForm.find_element(By.ID, "submit-code-button")
        ClickButton(activateButton)
    except ElementClickInterceptedException:
        pass # Ignore this

    # Wait for the activation complete message to appear
    WaitAndClosePopUp(driver, "OK")
