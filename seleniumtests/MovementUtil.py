import time
from unittest import TestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException

from seleniumtests.TestUtils import *


def TestDragAndDrop(driver: webdriver.Chrome, tester: TestCase):
    """
    Test dragging and dropping a Pokémon.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    """
    # Wait for the boxes to load
    saveBox = WaitForElement(driver, By.ID, "save-box")
    homeBox = WaitForElement(driver, By.ID, "home-box")

    # Drag and drop a Pokémon from the save box to the home box
    monToDragFrom = saveBox.find_element(By.ID, "save-box-icon-14") # Ninetales
    monToDragTo = homeBox.find_element(By.ID, "home-box-icon-2")
    dragAndDrop = webdriver.ActionChains(driver)
    dragAndDrop.drag_and_drop(monToDragFrom, monToDragTo).perform()

    # Confirm the original Pokémon is no longer in the save box
    # Check by making sure the original element has no sub-elements
    try:
        monToDragFrom.find_element(By.XPATH, ".//*")
        tester.fail("Original Pokémon is still in the save box.")
    except NoSuchElementException:
        # Good: Original Pokémon is no longer in the save box
        pass

    # Confirm the new Pokémon is in the home box
    try:
        monToDragTo.find_element(By.XPATH, ".//*")
        # Good: New Pokémon is in the home box
    except NoSuchElementException:
        tester.fail("New Pokémon is not in the home box.")

    # Drag back but to a different slot
    monToDragFrom = homeBox.find_element(By.ID, "home-box-icon-2")
    monToDragTo = saveBox.find_element(By.ID, "save-box-icon-15") # Wigglytuff
    monToDragFromImg = monToDragFrom.find_element(By.TAG_NAME, "img")
    monToDragToImg = monToDragTo.find_element(By.TAG_NAME, "img")
    monToDragFromAriaLabel = monToDragFromImg.get_attribute("aria-label")
    monToDragToAriaLabel = monToDragToImg.get_attribute("aria-label")
    print(f"Currently in Home box: {monToDragFromAriaLabel}")
    print(f"Currently in Save box: {monToDragToAriaLabel}")
    dragAndDrop.drag_and_drop(monToDragFrom, monToDragTo).perform()

    # Confirm the original Pokémon is back in the save box at the new slot
    monToDragToImg = monToDragTo.find_element(By.TAG_NAME, "img")
    newSaveBoxMonAriaLabel = monToDragToImg.get_attribute("aria-label")
    print(f"Moved mon to Save box: {newSaveBoxMonAriaLabel}")
    tester.assertEqual(monToDragFromAriaLabel, newSaveBoxMonAriaLabel, "Original Pokémon is not back in the save box.")

    # Confirm the new Pokémon is in the home box
    monToDragFromImg = monToDragFrom.find_element(By.TAG_NAME, "img")
    newHomeBoxMonAriaLabel = monToDragFromImg.get_attribute("aria-label")
    print(f"Moved mon to Home box: {newHomeBoxMonAriaLabel}")
    tester.assertEqual(monToDragToAriaLabel, newHomeBoxMonAriaLabel, "New Pokémon is not in the home box.")


def TestSingleSelectMove(driver: webdriver.Chrome, tester: TestCase):
    """
    Test moving a Pokemon by clicking on it and then clicking on the destination box.
    This is exactly the same as dragging but with clicking.

    :param driver: The Selenium WebDriver instance.
    """
    # Wait for the boxes to load
    saveBox = WaitForElement(driver, By.ID, "save-box")
    homeBox = WaitForElement(driver, By.ID, "home-box")

    # Click the Pokemon to move
    monToMoveFrom = saveBox.find_element(By.ID, "save-box-icon-23") # Arcanine
    monToMoveFrom.click()

    # Click the destination box
    monToMoveTo = homeBox.find_element(By.ID, "home-box-icon-29")
    monToMoveTo.click()

    # Confirm the original Pokemon is no longer in the save box
    try:
        monToMoveFrom.find_element(By.XPATH, ".//*")
        tester.fail("Original Pokemon is still in the save box.")
    except NoSuchElementException:
        # Good: Original Pokemon is no longer in the save box
        pass

    # Confirm the new Pokemon is in the home box
    try:
        monToMoveTo.find_element(By.XPATH, ".//*")
        # Good: New Pokemon is in the home box
    except NoSuchElementException:
        tester.fail("New Pokemon is not in the home box.")
    
    # Move back but to a different slot
    monToMoveFrom = homeBox.find_element(By.ID, "home-box-icon-29")
    monToMoveTo = saveBox.find_element(By.ID, "save-box-icon-24") # Poliwrath
    monToMoveFromImg = monToMoveFrom.find_element(By.TAG_NAME, "img")
    monToMoveToImg = monToMoveTo.find_element(By.TAG_NAME, "img")
    monToMoveFromAriaLabel = monToMoveFromImg.get_attribute("aria-label")
    monToMoveToAriaLabel = monToMoveToImg.get_attribute("aria-label")
    print(f"Currently in Home box: {monToMoveFromAriaLabel}")
    print(f"Currently in Save box: {monToMoveToAriaLabel}")
    monToMoveFrom.click()
    monToMoveTo.click()

    # Deselect the Pokemon in the save box on some browsers
    time.sleep(0.5) # Wait for the movement to finish
    if BROWSER == "chrome" or BROWSER == "edge":
        deselectButton = driver.find_element(By.ID, "select-all-button-save-box")
        deselectButton.click()

    # Confirm the original Pokemon is back in the save box at the new slot
    monToMoveToImg = monToMoveTo.find_element(By.TAG_NAME, "img")
    newSaveBoxMonAriaLabel = monToMoveToImg.get_attribute("aria-label")
    print(f"Moved mon to Save box: {newSaveBoxMonAriaLabel}")
    tester.assertEqual(monToMoveFromAriaLabel, newSaveBoxMonAriaLabel, "Original Pokemon is not back in the save box.")

    # Confirm the new Pokemon is in the home box
    monToMoveFromImg = monToMoveFrom.find_element(By.TAG_NAME, "img")
    newHomeBoxMonAriaLabel = monToMoveFromImg.get_attribute("aria-label")
    print(f"Moved mon to Home box: {newHomeBoxMonAriaLabel}")
    tester.assertEqual(monToMoveToAriaLabel, newHomeBoxMonAriaLabel, "New Pokemon is not in the home box.")


def GoToPreviousHomeBox(driver):
    """
    Go to the previous home box.

    :param driver: The Selenium WebDriver instance.
    """
    # Click the left arrow button
    leftArrowButton = driver.find_element(By.ID, "previous-home-box-button")
    leftArrowButton.click()


def TestMultiSelectMove(driver, tester: TestCase):
    saveBox = driver.find_element(By.ID, "save-box")
    homeBox = driver.find_element(By.ID, "home-box")

    # Select multiple Pokemon in the save box
    monsToSelect = [2, 3, 9] # Blastoise, Butterfree, Raichu
    ariaLabels = []
    actionChains = webdriver.ActionChains(driver)
    for mon in monsToSelect:
        monToSelect = saveBox.find_element(By.ID, f"save-box-icon-{mon}")
        actionChains.click(monToSelect)
        monToSelectImg = monToSelect.find_element(By.TAG_NAME, "img")
        ariaLabel = monToSelectImg.get_attribute("aria-label")
        ariaLabels.append(ariaLabel)
    actionChains.perform()

    # Click the home box to move the selected Pokemon to a spot they won't fit
    placeAtSpot = homeBox.find_element(By.ID, "home-box-icon-26") # Bottom row
    placeAtSpot.click()

    # Confirm the error message appeared
    errorMessage = driver.find_element(By.ID, "error-message-home-box")
    tester.assertEqual(errorMessage.text, "Not enough space for the move.", "Error message text is not correct.")

    # Place at a spot it will fit
    placeAtSpot = homeBox.find_element(By.ID, "home-box-icon-9") # Second row
    placeAtSpot.click()

    # Confirm the original Pokemon are no longer in the save box
    for mon in monsToSelect:
        monToSelect = driver.find_element(By.ID, f"save-box-icon-{mon}")
        try:
            monToSelect.find_element(By.XPATH, ".//*")
            tester.fail(f"Original Pokemon {mon} is still in the save box.")
        except NoSuchElementException:
            # Good: Original Pokemon is no longer in the save box
            pass

    # Confirm the new Pokemon are in the home box
    for i, mon in enumerate([9, 10, 16]):
        monToSelect = homeBox.find_element(By.ID, f"home-box-icon-{mon}")
        try:
            monToSelect.find_element(By.XPATH, ".//*")
            # Good: New Pokemon is in the home box
        except NoSuchElementException:
            tester.fail(f"New Pokemon {mon} is not in the home box.")
        monToSelectImg = monToSelect.find_element(By.TAG_NAME, "img")
        newHomeBoxMonAriaLabel = monToSelectImg.get_attribute("aria-label")
        print(f"Moved mon to Home box: {newHomeBoxMonAriaLabel}")
        tester.assertEqual(ariaLabels[i], newHomeBoxMonAriaLabel, f"Original Pokemon {mon} is not in the home box.")


def TestBoxListView(driver: webdriver.Chrome, tester: TestCase):
    """
    Test the box list view and basic filter functionality.

    :param driver: The Selenium WebDriver instance.
    """
    # Click the home box list button
    homeBoxListButton = driver.find_element(By.ID, "view-home-boxes-button")
    homeBoxListButton.click()

    # Confirm the back button works correctly
    backButton = driver.find_element(By.ID, "back-button")
    backButton.click()

    # Click the home box list button again
    homeBoxListButton = driver.find_element(By.ID, "view-home-boxes-button")
    homeBoxListButton.click()

    # Filter the boxes
    filter = WaitForElement(driver, By.ID, "filter")
    filter.send_keys("Cloud 1")

    # Confirm some boxes are filtered out
    jumpToBox = driver.find_element(By.ID, "box-0-with-title")
    hiddenBox = driver.find_element(By.ID, "box-1-with-title")
    tester.assertFalse(jumpToBox.get_attribute("hidden"), "Jump to box is not visible.")
    tester.assertTrue(hiddenBox.get_attribute("hidden") == "true", "Hidden box is visible.")

    # Jump to the first box
    jumpToBox = driver.find_element(By.ID, "box-0")
    jumpToBox.click()

    # Confirm Pokemon moved before is in the last slot of the home box
    homeBox = driver.find_element(By.ID, "home-box")
    monToSelect = homeBox.find_element(By.ID, "home-box-icon-29") # Poliwrath
    monToSelectImg = monToSelect.find_element(By.TAG_NAME, "img")
    ariaLabel = monToSelectImg.get_attribute("aria-label")
    tester.assertEqual(ariaLabel, "Poliwrath", "Poliwrath is not in the last slot of the home box.")
