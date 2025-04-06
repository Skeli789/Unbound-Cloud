import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException, ElementClickInterceptedException, ElementNotInteractableException

APPDATA = os.getenv("APPDATA")
BROWSER = os.getenv('BROWSER', 'chrome').lower()
DEBUG_SCREENSHOT_DIR = f"debug_screenshots_{BROWSER}"
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
    # Wait for the element to be present in the DOM 
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((byType, byValue)))

    # Return the first element that's visible if multiple are found
    element = None
    elements = driver.find_elements(byType, byValue)
    for e in elements:
        try:
            if e.is_displayed():
                element = e
                break
        except StaleElementReferenceException:
            continue  # Ignore stale elements

    # If no visible element is found, raise an exception
    if not element:
        raise NoSuchElementException(f"Element with {byType}='{byValue}' not found or not displayed.")

    return element


def ClickButton(button: WebElement):
    """
    Click a button element.

    :param button: The button WebElement to click.
    """
    button.click()


def WaitAndClosePopUp(driver: webdriver.Chrome, buttonText: str):
    """
    Wait for a pop-up to appear and close it.

    :param driver: The Selenium WebDriver instance.
    :param buttonText: The text of the button to close the pop-up.
    """
    # Wait for the button on the pop-up to appear then click it
    attempts = 0
    while attempts < 10:
        try:
            popUp = WaitForElement(driver, By.CLASS_NAME, "swal2-popup")
            button = WaitForElement(popUp, By.XPATH, f"//button[text()='{buttonText}']")
            ClickButton(button)
            WebDriverWait(driver, 10).until(EC.staleness_of(popUp)) # Wait for the pop-up to disappear
            return
        except (ElementClickInterceptedException, ElementNotInteractableException, StaleElementReferenceException, NoSuchElementException) as e:
            # If the element is not clickable, wait and try again
            print(f"Button not clickable: {e}.")
        
    raise Exception(f"Failed to find the button with text '{buttonText}' on the pop-up.")
