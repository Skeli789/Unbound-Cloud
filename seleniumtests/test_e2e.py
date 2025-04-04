import json
import os
import pyperclip
import pyautogui
import pytest
import shutil
import time
from unittest import TestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import NoSuchElementException, ElementNotInteractableException, ElementClickInterceptedException

from seleniumtests.TestUtils import *

URL_SITE = "http://localhost:3000"

# @pytest.mark.incremental
class TestE2E(TestCase):
    def setUp(self):
        chromeOptions = webdriver.ChromeOptions()
        chromeOptions.add_experimental_option("prefs", {
            "profile.default_content_setting_values.clipboard": 1, # Allow clipboard access
        })
        chromeOptions.add_argument("--headless") # Make headless
        chromeOptions.add_argument("--disable-gpu") # Disable GPU hardware acceleration
        chromeOptions.add_argument("--disable-extensions") # Disable extensions
        chromeOptions.add_argument("--no-sandbox") # Disable sandboxing
        self.driver = webdriver.Chrome(options=chromeOptions)
        self.driver.get(URL_SITE)

    def tearDown(self):
        if self.driver:
            self.driver.quit()

    def test_ConnectToSite(self):
        # Verify we connected successfully
        self.assertIn("Unbound", self.driver.title)

    def test_ClickGetStarted(self):
        attempts = 0
        while attempts < 10:
            try:
                getStartedButton = self.driver.find_element(By.ID, "get-started-button")
                getStartedButton.click()
                return
            except:
                attempts += 1
                time.sleep(1)

        self.assertLess(attempts, 10, "Failed to click 'Get Started' button after 10 attempts")
