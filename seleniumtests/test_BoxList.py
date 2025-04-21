import pytest
from unittest import TestCase

from seleniumtests.BoxListUtils import TestFilteringAndJumpingBoxes, TestReversingAndRevertingBoxOrder, TestMultiDragBoxes
from seleniumtests.BoxViewUtils import SAVE_BOX_COUNT
from seleniumtests.TestUtils import *


@pytest.mark.incremental
class TestFunctionality(TestCase):
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

    def test_01_ConnectToSite(self):
        # Verify we connected successfully
        self.assertIn("Unbound", self.driver.title)
        WaitAndClosePopUp(self.driver, "I am not a Tester")

    def test_02_FilteringAndJumpingSaveBoxes(self):
        TestFilteringAndJumpingBoxes(self.driver, self, "save", "Box 5", 4)

    def test_03_FilteringAndJumpingHomeBoxes(self):
        ReloadPage(self.driver)
        TestFilteringAndJumpingBoxes(self.driver, self, "home", "Cloud 100", 99)

    def test_04_ReversingAndRevertingSaveBoxOrder(self):
        pytest.skip("Skipping remaining tests for Safari browser since they take too long to run.")
        ReloadPage(self.driver)
        TestReversingAndRevertingBoxOrder(self.driver, self, SAVE_BOX_COUNT)

    def test_05_MultiDragSaveBoxes1(self):
        # Move boxes 1-2 to the end of the list
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [1, 2], 0, SAVE_BOX_COUNT -1, "Box 1", SAVE_BOX_COUNT)

    def test_06_MultiDragSaveBoxes2(self):
        # Move square in the middle
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [7, 8, 9, 12, 13, 14, 17, 18, SAVE_BOX_COUNT], 12, SAVE_BOX_COUNT - 3, "Box 1", SAVE_BOX_COUNT)

    def test_07_MultiDragSaveBoxes3(self):
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [3, 15, 23], 22, 1, "Box 1", SAVE_BOX_COUNT)

    def test_08_MultiDragSaveBoxes4(self):
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [13, 5, 2, 17, 11], 16, 19, "Box 1", SAVE_BOX_COUNT)

    def test_09_MultiDragSaveBoxes5(self):
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [4, 6, 8, 16, 19, 23, 25], 7, 12, "Box 1", SAVE_BOX_COUNT)

    def test_10_MultiDragSaveBoxes6(self):
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [5, 6, 8, 9, 16, 20, 24, 25], 24, 22, "Box 1", SAVE_BOX_COUNT)

    def test_11_MultiDragSaveBoxes7(self):
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [1, 2, 4, 8, 10, 13, 15, 20, 21], 7, 10, "Box 1", SAVE_BOX_COUNT)

    def test_12_MultiDragSaveBoxes8(self):
        ReloadPage(self.driver)
        TestMultiDragBoxes(self.driver, self,
                           [1, 4, 5, 6, 10, 11, 14, 16, 17], 9, 14, "Box 1", SAVE_BOX_COUNT)


def ReloadPage(driver):
    """Reloads the page and closes the pop-up if it appears.
    
    :param driver: The Selenium WebDriver instance
    """
    driver.refresh()
    WaitAndClosePopUp(driver, "I am not a Tester")
