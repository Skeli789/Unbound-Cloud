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

from seleniumtests.ActivationUtil import ActivateAccount
from seleniumtests.LoginUtil import HandleLogin, LogOut
from seleniumtests.SignUpUtil import HandleSignUp, RemoveExistingAccounts
from seleniumtests.TestUtils import *

URL_SITE = "http://localhost:3000"


# @pytest.mark.incremental
class TestE2E(TestCase):
    @classmethod
    def setUpClass(cls):
        chromeOptions = webdriver.ChromeOptions()
        chromeOptions.add_experimental_option("prefs", {
            "profile.default_content_setting_values.clipboard": 1, # Allow clipboard access
        })
        chromeOptions.add_argument("--headless") # Make headless
        chromeOptions.add_argument("--disable-gpu") # Disable GPU hardware acceleration
        chromeOptions.add_argument("--disable-extensions") # Disable extensions
        chromeOptions.add_argument("--no-sandbox") # Disable sandboxing
        cls.driver = webdriver.Chrome(options=chromeOptions)
        cls.driver.get(URL_SITE)

    @classmethod
    def tearDownClass(cls):
        # Close the browser after tests are done
        cls.driver.quit()

    def test_1_ConnectToSite(self):
        # Verify we connected successfully
        self.assertIn("Unbound", self.driver.title)

    def test_2_ClickGetStarted(self):
        attempts = 0
        while attempts < 10:
            try:
                getStartedButton = self.driver.find_element(By.ID, "get-started-button")
                getStartedButton.click()
                return
            except:
                attempts += 1
                time.sleep(1)

        if attempts >= 10:
            self.driver.quit()
            self.fail("Failed to click 'Get Started' button after 10 attempts")

    def test_3_SignUp(self):
        # Skip if previous test failed
        if not self.driver:
            self.skipTest("Skipping sign-up test because connection test failed")

        RemoveExistingAccounts()
        HandleSignUp(self.driver, self)

    def test_4_ActivateAccount(self):
        # Skip if previous test failed
        if not self.driver:
            self.skipTest("Skipping activation test because sign-up test failed")

        ActivateAccount(self.driver, self)

    def test_5_Login(self):
        # Skip if previous test failed
        if not self.driver:
            self.skipTest("Skipping login test because activation test failed")

        LogOut(self.driver)
        HandleLogin(self.driver)
