import os
import pytest
import time
from unittest import TestCase
from selenium.webdriver.common.by import By

from seleniumtests.ActivationUtil import ActivateAccount
from seleniumtests.ForgotPasswordUtil import TestForgotPassword
from seleniumtests.LoginUtil import HandleLogin, LogOut
from seleniumtests.SignUpUtil import HandleSignUp, RemoveExistingAccounts
from seleniumtests.TestUtils import *
from seleniumtests.UploadSaveFileUtil import *

USE_UPLOAD_DOWNLOAD = os.getenv("REACT_APP_USE_ORIGINAL_UPLOAD_DOWNLOAD", "false").lower() == "true"


@pytest.mark.incremental
class TestAccountSystem(TestCase):
    @classmethod
    def setUpClass(cls):
        # Instantiate the driver and navigate to the site
        cls.driver = SetUpDriver(BROWSER)

        # Try to connect 10 times to the site
        attempts = 0
        while attempts < 10:
            try:
                cls.driver.get(URL_SITE)
            except Exception as e:
                print(f"Failed to connect to {URL_SITE}: {e}")
                attempts += 1
                time.sleep(1)

    @classmethod
    def tearDownClass(cls):
        # Close the browser after tests are done
        QuitDriver(cls.driver)

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

    def test_5_ForgotPassword(self):
        LogOut(self.driver)
        TestForgotPassword(self.driver, self, TEST_NEW_PASSWORD)

    def test_6_Login(self):
        HandleLogin(self.driver, password=TEST_NEW_PASSWORD) # Use the new password

    def test_7_UploadSaveFile(self):
        if BROWSER == "safari":
            # Safari is a pain to automate for file uploads
            self.skipTest("Skipping upload test for Safari due to automation limitations.")

        CopyTestSaveFile()
        if USE_UPLOAD_DOWNLOAD:  # Use the browser's original upload/download functionality
            UploadSaveFile(self.driver)
        else:  # Use the FileSystemHandle API
            if os.name == 'nt':  # Locally on Windows
                ChooseSaveFileWindows(self.driver)
            else:
                ChooseSaveFileLinux(self.driver)
