import pytest
from unittest import TestCase

from seleniumtests.BoxViewUtils import *
from seleniumtests.TestUtils import *


@pytest.mark.incremental
class TestBoxView(TestCase):
    @classmethod
    def setUpClass(cls):
        # Remove the account system for these tests
        EnableDemoSite()

        # Instantiate the driver and navigate to the site
        cls.driver = SetUpDriver(BROWSER)
        cls.driver.get(URL_SITE)

    @classmethod
    def tearDownClass(cls):
        # Re-enable the account system after tests are done
        DisableDemoSite()

        # Close the browser after tests are done
        QuitDriver(cls.driver)

    def test_1_ConnectToSite(self):
        # Verify we connected successfully
        self.assertIn("Unbound", self.driver.title)
        WaitAndClosePopUp(self.driver, "I am not a Tester")

    def test_2_DragAndDrop(self):
        TestDragAndDrop(self.driver, self)

    def test_3_SingleSelectMove(self):
        TestSingleSelectMove(self.driver, self)

    def test_4_MultiSelectMove(self):
        ReloadPage(self.driver)
        GoToPreviousHomeBox(self.driver)
        TestMultiSelectMove(self.driver, self)


def ReloadPage(driver: webdriver.Chrome):
    """Reloads the page and closes the pop-up if it appears.
    
    :param driver: The Selenium WebDriver instance
    """
    driver.refresh()
    WaitAndClosePopUp(driver, "I am not a Tester")
