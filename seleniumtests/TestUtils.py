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
URL_SITE = "http://localhost:3000"
DEBUG_SCREENSHOT_DIR = f"debug_screenshots_{BROWSER}"
TEST_EMAIL = "test@gmail.com"
TEST_USERNAME = "test_user"
TEST_PASSWORD = "test_password"


def SetUpDriver(browser: str) -> webdriver.Chrome:
    """
    Set up the Selenium WebDriver with specific options per the browser.

    :param browser: The browser to use (e.g., "chrome", "firefox", "edge", "safari").
    :return: A configured instance of the Selenium WebDriver.
    """
    if browser == "firefox":
        driverClass = webdriver.Firefox
        opts = webdriver.FirefoxOptions()
        opts.set_preference("dom.webnotifications.enabled", False)
    elif browser == "edge":
        driverClass = webdriver.Edge
        opts = webdriver.EdgeOptions()
    elif browser == "safari":
        driverClass = webdriver.Safari
        opts = webdriver.SafariOptions()
    else:  # Default to Chrome
        driverClass = webdriver.Chrome
        opts = webdriver.ChromeOptions()
        opts.add_experimental_option("prefs", {
            "profile.default_content_setting_values.clipboard": 1,  # Allow clipboard access
        })
        opts.add_argument('--disable-extensions')

    # Common flags
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('--start-maximized')  # Optional, but useful
    opts.add_argument("--window-size=1920,1080")  # Set window size to 1920x1080 so buttons are always clickable

    # Instantiate & navigate
    driver = driverClass(options=opts)

    # Maximize the window
    driver.maximize_window()
    return driver


def QuitDriver(driver: webdriver.Chrome):
    """
    Quit the Selenium WebDriver instance.

    :param driver: The Selenium WebDriver instance to quit.
    """
    driver.close()
    driver.quit()


def ToggleDemoSite():
    """
    Either enable or disable the demo site by modifying the MainPage.js file and forcing a rerender.
    """

    filePath = os.path.join(os.getcwd(), "src", "MainPage.js")
    with open(filePath, "r+", encoding="utf-8") as file:
        lines = file.readlines()
        for i, line in enumerate(lines):
            if line.startswith("const DEMO_SITE = true;"):
                print("Toggled demo site off")
                lines[i] = lines[i].replace("const DEMO_SITE = true;", "const DEMO_SITE = false;")
                break
            elif line.startswith("const DEMO_SITE = false;"):
                print("Toggled demo site on")
                lines[i] = lines[i].replace("const DEMO_SITE = false;", "const DEMO_SITE = true;")
                break
        file.seek(0)
        file.writelines(lines)
        file.truncate()



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
