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

    # Wait for the Save changes message to appear
    time.sleep(0.5)

    # Accept the changes
    if BROWSER == "edge":
        # Press the left arrow key to focus the "Save" button
        time.sleep(1.5)  # A little more time for Edge 
        pyautogui.press("left")
    else:
        # Press the tab key to focus the "Save" button
        pyautogui.press("tab")
    pyautogui.press("enter")

    # Close the symbol tutorial pop-up
    WaitAndClosePopUp(driver, "OK")

    # Save a screenshot of the boxes
    driver.save_screenshot(f"{DEBUG_SCREENSHOT_DIR}/Boxes.png")


def ChooseSaveFileMac(driver: webdriver.Chrome):
    """
    Choose the save file to edit using the Mac file picker.

    :param driver: The Selenium WebDriver instance.
    """
    # Wait for the upload instructions to appear
    uploadInstructions = WaitForElement(driver, By.ID, "upload-instructions")

    # Click the upload button
    uploadButton = uploadInstructions.find_element(By.ID, "upload-save-button-label")
    uploadButton.click()

    # After clicking the upload button, wait for the OS file picker to appear
    time.sleep(1)

    # Open the "Go to the folder" dialog
    pyautogui.hotkey("shift", "command", "g")
    time.sleep(0.1)  # Wait for the dialog to open

    # Type the directory path
    pyautogui.write(SAVE_FILE_TEST)

    # Select the file
    pyautogui.press("enter")

    # Close the symbol tutorial pop-up
    WaitAndClosePopUp(driver, "OK")

    # Save a screenshot of the boxes
    driver.save_screenshot(f"{DEBUG_SCREENSHOT_DIR}/Boxes.png")


def ChooseSaveFileWindows(driver: webdriver.Chrome):
    """
    Choose the save file to edit using the Windows file picker.

    :param driver: The Selenium WebDriver instance.
    """
    # Wait for the upload instructions to appear
    uploadInstructions = WaitForElement(driver, By.ID, "upload-instructions")

    # Click the upload button
    uploadButton = uploadInstructions.find_element(By.ID, "upload-save-button")
    uploadButton.click()

    # After clicking the upload button, wait for the OS file picker to appear
    time.sleep(1)

    # Open the address bar (Windows file picker shortcut)
    pyautogui.hotkey("ctrl", "l")
    time.sleep(0.1)  # Wait for the address bar to be active

    # Type the directory path and press Enter
    saveFileDir = os.path.dirname(SAVE_FILE_TEST)
    pyautogui.write(saveFileDir)
    pyautogui.press("enter")

    # Wait for the directory to load
    time.sleep(0.5)

    # Hit tab 7 times to focus on the file name field
    for _ in range(7):
        pyautogui.press("tab")
        time.sleep(0.1)  # Wait for the focus to change

    # Type the file name
    pyautogui.write(os.path.basename(SAVE_FILE_TEST))

    # Press Enter to open the file
    pyautogui.press("enter")

    # Wait for the Save changes message to appear
    time.sleep(0.5)

    # Accept the changes
    pyautogui.press("tab")
    pyautogui.press("enter")

    # Close the symbol tutorial pop-up
    WaitAndClosePopUp(driver, "OK")

    # Save a screenshot of the boxes
    driver.save_screenshot(f"{DEBUG_SCREENSHOT_DIR}/Boxes.png")
