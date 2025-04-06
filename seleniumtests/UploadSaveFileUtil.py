import json
import os
import pyperclip
import pytest
import shutil
import time
from unittest import TestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import NoSuchElementException, ElementNotInteractableException, ElementClickInterceptedException

from seleniumtests.TestUtils import *

SAVE_FILE = os.path.join(os.getcwd(), "server", "pytests", "data", "saves", "all_pokemon.sav")
SAVE_FILE_TEST = os.path.join(os.getcwd(), "server", "temp", "selenium.sav")


def CopyTestSaveFile():
    """
    Copies the save file used for testing to a new location.
    """
    shutil.copy(SAVE_FILE, SAVE_FILE_TEST)


def UploadSaveFile(driver: webdriver.Chrome):
    """
    Upload the save file to edit.

    :param driver: The Selenium WebDriver instance.
    """
    # Wait for the upload instructions to appear
    uploadInstructions = WaitForElement(driver, By.ID, "upload-instructions")

    # Send the file path to the file input element
    uploadInput = uploadInstructions.find_element(By.ID, "upload-save-button")
    uploadInput.send_keys(SAVE_FILE_TEST)

    # Wait for the upload to complete
    WaitForElement(driver, By.ID, "symbol-tutorial")

    # Close pop-up
    WaitAndClosePopUp(driver, "OK")


def ChooseSaveFile(driver: webdriver.Chrome):
    """
    Choose the save file to edit.
    This tests the FileSystemHandle API, which is not supported in all browsers.

    :param driver: The Selenium WebDriver instance.
    """
    # Wait for the upload instructions to appear
    uploadInstructions = WaitForElement(driver, By.ID, "upload-instructions")

    # Click the upload button
    uploadButton = uploadInstructions.find_element(By.ID, "upload-save-button")
    uploadButton.click()

    # After clicking the upload button, wait for the OS file picker to appear
    time.sleep(5)

    # TODO

