import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import NoSuchElementException

APPDATA = os.getenv("APPDATA")
TEST_EMAIL = "test@gmail.com"
TEST_USERNAME = "test_user"
TEST_PASSWORD = "test_password"


def WaitForElement(driver: webdriver.Chrome, byType: str, byValue: str) -> WebElement:
    """
    Wait for an element to appear on the page.

    :param driver: The Selenium WebDriver instance.
    :param byType: The type of selector to use (e.g., "ID", "NAME", "XPATH").
    :param byValue: The value of the selector.
    :return: The WebElement if found, otherwise None.
    """
    while True:
        try:
            element = driver.find_element(byType, byValue)
            break
        except NoSuchElementException:
            time.sleep(1)
    return element


def WaitAndClosePopUp(driver: webdriver.Chrome, message: str, buttonText: str):
    """
    Wait for a pop-up to appear and close it.

    :param driver: The Selenium WebDriver instance.
    :param message: The message text to identify the pop-up.
    :param buttonText: The text of the button to close the pop-up.
    """
    while True:
        try:
            driver.find_element(By.XPATH, f"//*[text()='{message}']")
            break
        except NoSuchElementException:
            time.sleep(1)

    # Close the pop-up
    ClosePopUp(driver, buttonText)


def ClosePopUp(driver: webdriver.Chrome, buttonText: str):
    """
    Close a pop-up if it appears.

    :param driver: The Selenium WebDriver instance.
    :param buttonText: The text of the button to close the pop-up.
    """
    try:
        okButton = driver.find_element(By.XPATH, f"//button[text()='{buttonText}']")
        okButton.click()
    except NoSuchElementException:
        pass
