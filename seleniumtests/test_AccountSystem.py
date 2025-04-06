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
from seleniumtests.UploadSaveFileUtil import *

URL_SITE = "http://localhost:3000"
USE_UPLOAD_DOWNLOAD = os.getenv("REACT_APP_USE_ORIGINAL_UPLOAD_DOWNLOAD", "false").lower() == "true"


@pytest.mark.incremental
class TestE2E(TestCase):
    @classmethod
    def setUpClass(cls):
        if BROWSER == "firefox":
            driverClass = webdriver.Firefox
            opts = webdriver.FirefoxOptions()
            opts.set_preference("dom.webnotifications.enabled", False)
        elif BROWSER == "edge":
            driverClass = webdriver.Edge
            opts = webdriver.EdgeOptions()
        elif BROWSER == "safari":
            driverClass = webdriver.Safari
            opts = webdriver.SafariOptions()
        else:  # Default to Chrome
            driverClass = webdriver.Chrome
            opts = webdriver.ChromeOptions()
            opts.add_experimental_option("prefs", {
                "profile.default_content_setting_values.clipboard": 1, # Allow clipboard access
            })
            opts.add_argument('--disable-extensions')

        # Common flags
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--start-maximized')  # Optional, but useful
        opts.add_argument("--window-size=1920,1080")  # Set window size to 1920x1080 so buttons are always clickable

        # Instantiate & navigate
        cls.driver = driverClass(options=opts)
        cls.driver.get(URL_SITE)

    @classmethod
    def tearDownClass(cls):
        # Close the browser after tests are done
        cls.driver.quit()

    def test_1_ConnectToSite(self):
        # Verify we connected successfully
        self.assertIn("Unbound", self.driver.title)

    def test_2_ClickGetStarted(self):
        getStartedButton = WaitForElement(self.driver, By.ID, "get-started-button")
        ClickButton(getStartedButton)

    def test_3_SignUp(self):
        RemoveExistingAccounts()
        HandleSignUp(self.driver, self)

    def test_4_ActivateAccount(self):
        ActivateAccount(self.driver, self)

    def test_5_Login(self):
        LogOut(self.driver)
        HandleLogin(self.driver)

    def test_6_UploadSaveFile(self):
        CopyTestSaveFile()
        if USE_UPLOAD_DOWNLOAD:  # Use the browser's original upload/download functionality
            UploadSaveFile(self.driver)
        else:  # Use the FileSystemHandle API
            if os.name == 'nt':  # Locally on Windows
                ChooseSaveFileWindows(self.driver)
            else:
                ChooseSaveFileLinux(self.driver)
