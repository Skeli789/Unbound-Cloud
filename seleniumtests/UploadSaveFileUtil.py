import os
import pyautogui
import shutil
import time
from selenium import webdriver
from selenium.webdriver.common.by import By

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

    # Close the symbol tutorial pop-up
    WaitAndClosePopUp(driver, "OK")

    # Save a screenshot of the boxes
    driver.save_screenshot(f"{DEBUG_SCREENSHOT_DIR}/Boxes.png")


def ChooseSaveFileLinux(driver: webdriver.Chrome):
    """
    Choose the save file to edit using the Ubuntu (GTK) file picker.
    This tests the FileSystemHandle API, which is not supported in all browsers.

    :param driver: The Selenium WebDriver instance.
    """
    # Wait for the upload instructions to appear
    uploadInstructions = WaitForElement(driver, By.ID, "upload-instructions")

    # Click the upload button
    uploadButton = uploadInstructions.find_element(By.ID, "upload-save-button")
    uploadButton.click()

    # Wait for the OS file picker to appear
    time.sleep(1)

    # Focus the location bar
    pyautogui.hotkey("ctrl", "l")
    time.sleep(0.1)

    # Type the full path to the save file
    pyautogui.write(SAVE_FILE_TEST)

    # Select the file
    pyautogui.press("enter")

    # Close the symbol tutorial pop-up
    WaitAndClosePopUp(driver, "OK")

    # Save a screenshot of the boxes
    driver.save_screenshot(f"{DEBUG_SCREENSHOT_DIR}/Boxes.png")
