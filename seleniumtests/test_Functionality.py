import pytest
from unittest import TestCase

from seleniumtests.MovementUtil import *
from seleniumtests.TestUtils import *


@pytest.mark.incremental
class TestFunctionality(TestCase):
    @classmethod
    def setUpClass(cls):
        # Remove the account system for these tests
        ToggleDemoSite()

        # Instantiate the driver and navigate to the site
        cls.driver = SetUpDriver(BROWSER)
        cls.driver.get(URL_SITE)

    @classmethod
    def tearDownClass(cls):
        # Re-enable the account system after tests are done
        ToggleDemoSite()

        # Close the browser after tests are done
        cls.driver.quit()

    def test_1_ConnectToSite(self):
        # Verify we connected successfully
        self.assertIn("Unbound", self.driver.title)
        WaitAndClosePopUp(self.driver, "I am not a Tester")

    def test_2_DragAndDrop(self):
        TestDragAndDrop(self.driver, self)

    def test_3_SingleSelectMove(self):
        TestSingleSelectMove(self.driver, self)

    def test_4_MultiSelectMove(self):
        GoToPreviousHomeBox(self.driver)
        TestMultiSelectMove(self.driver, self)

    def test_5_BoxListView(self):
        TestBoxListView(self.driver, self)
