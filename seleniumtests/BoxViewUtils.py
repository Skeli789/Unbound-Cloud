import json
import time
from unittest import TestCase
from selenium import webdriver
from selenium.webdriver.common.actions.pointer_input import PointerInput
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.actions.interaction import POINTER_MOUSE
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException

from seleniumtests.TestUtils import *

SAVE_BOX_COUNT = 25
ALL_BOXES = os.path.join(os.getcwd(), "src", "data", "Test Output.json")


def GoToNextBox(driver: webdriver.Chrome, boxType: str):
    """
    Go to the next box in the list.

    :param driver: The Selenium WebDriver instance.
    :param boxType: The type of box (e.g., "home", "save").
    """
    # Click the next button
    nextButton = driver.find_element(By.ID, f"next-{boxType}-box-button")
    ClickButton(nextButton)


def GoToPreviousBox(driver: webdriver.Chrome, boxType: str):
    """
    Go to the previous box in the list.

    :param driver: The Selenium WebDriver instance.
    :param boxType: The type of box (e.g., "home", "save").
    """
    # Click the back button
    backButton = driver.find_element(By.ID, f"previous-{boxType}-box-button")
    ClickButton(backButton)


def GoToNextHomeBox(driver: webdriver.Chrome):
    """
    Go to the next home box.

    :param driver: The Selenium WebDriver instance.
    """
    GoToNextBox(driver, "home")


def GoToNextSaveBox(driver: webdriver.Chrome):
    """
    Go to the next save box.

    :param driver: The Selenium WebDriver instance.
    """
    GoToNextBox(driver, "save")


def GoToPreviousSaveBox(driver: webdriver.Chrome):
    """
    Go to the previous save box.

    :param driver: The Selenium WebDriver instance.
    """
    GoToPreviousBox(driver, "save")


def GoToPreviousHomeBox(driver: webdriver.Chrome):
    """
    Go to the previous home box.

    :param driver: The Selenium WebDriver instance.
    """
    GoToPreviousBox(driver, "home")


def ConfirmMonInBoxSlot(driver: webdriver.Chrome, tester: TestCase, boxType: str, slot: int, monName: str):
    """
    Confirm the Pokemon is in the correct box slot.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param boxType: The type of box (e.g., "home", "save").
    :param slot: The slot number to check (0-indexed).
    :param monName: The name of the Pokemon.
    """
    # Find the Pokemon in the specified slot
    monToSelect = driver.find_element(By.ID, f"{boxType}-box-icon-{slot}")

    if monName.strip() == "":
        # Confrm the slot is empty
        try:
            monToSelect.find_element(By.XPATH, ".//*")
            tester.fail(f"Slot {slot} is not empty.")
        except NoSuchElementException:
            # Good: Slot is empty
            return

    # Confirm the image's aria-label matches the expected name
    try:
        monToSelectImg = monToSelect.find_element(By.TAG_NAME, "img")
    except NoSuchElementException:
        tester.fail(f"Slot {slot} is empty and does not contain {monName} as expected.")

    ariaLabel = monToSelectImg.get_attribute("aria-label")
    tester.assertEqual(ariaLabel, monName, f"{monName} is not in slot {slot} as expected. Found {ariaLabel} instead.")


def LoadCorrectBoxMons() -> dict:
    """
    Gets a list of all test Pokemon that are the first and last in each box.

    :return: A dictionary of box names and their corresponding Pokemon.
             E.g. {"Box 1": {0: "Venusaur", 29: "Golem"}, ...}
    """
    boxMons = dict()
    with open(ALL_BOXES, "r") as f:
        allBoxes = json.load(f)["boxes"]
        for i in range(SAVE_BOX_COUNT):
            boxStartIndex = i * 30
            boxEndIndex = boxStartIndex + 29
            boxName = f"Box {i + 1}" if i < SAVE_BOX_COUNT - 1 else "Preset"
            boxMons[boxName] = {0: allBoxes[boxStartIndex]["nickname"],
                                29: allBoxes[boxEndIndex]["nickname"]} # Only check the first and last slot
    return boxMons


def LoadAllSaveBoxTitles() -> list:
    """
    Load the test save box titles.

    :return: The list of test save box titles.
    """
    # Get the box titles
    with open(ALL_BOXES, "r") as f:
        return json.load(f)["titles"]
    return []


def ConfirmCurrentHomeAndSaveBoxNames(driver: webdriver.Chrome, tester: TestCase, homeBoxName: str, saveBoxName: str):
    """
    Confirm the home box and save box titles are correct.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param homeBoxName: The name of the home box.
    :param saveBoxName: The name of the save box.
    """
    # Get the box titles
    currentHomeBoxName = WaitForElement(driver, By.ID, "view-home-boxes-button").text
    currentSaveBoxName = WaitForElement(driver, By.ID, "view-save-boxes-button").text

    # Confirm the box titles are correct
    tester.assertEqual(currentHomeBoxName, homeBoxName, f"Home box name is not {homeBoxName}.")
    tester.assertEqual(currentSaveBoxName, saveBoxName, f"Save box name is not {saveBoxName}.")


def ConfirmAllMonsInCorrectBox(driver: webdriver.Chrome, tester: TestCase, boxType: str, expectedTitles: list):
    """
    Confirm all Pokemon are in the correct box slots.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param boxType: The type of box (e.g., "home", "save").
    :param expectedTitles: The expected titles of the boxes in order.
    """
    # Load the correct box Pokemon
    boxMons = LoadCorrectBoxMons()

    # Loop through all boxes and confirm the Pokemon are in the correct slots
    for boxName in expectedTitles:
        currentBoxName = WaitForElement(driver, By.ID, "view-save-boxes-button").text
        tester.assertEqual(currentBoxName, boxName, f"Current box is {currentBoxName} instead of {boxName}.")
        for slot, monName in boxMons[boxName].items():
            ConfirmMonInBoxSlot(driver, tester, "save", slot, monName)

        if boxType == "home":
            GoToNextHomeBox(driver)
        else:
            GoToNextSaveBox(driver)


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
    draggingSpecies1 = "Ninetales"
    monToDragFrom = saveBox.find_element(By.ID, "save-box-icon-14") # Ninetales
    monToDragTo = homeBox.find_element(By.ID, "home-box-icon-2") # EMPTY
    dragAndDrop = webdriver.ActionChains(driver)
    dragAndDrop.drag_and_drop(monToDragFrom, monToDragTo).perform()

    # Confirm the original Pokémon is no longer in the save box
    ConfirmMonInBoxSlot(driver, tester, "save", 14, "")

    # Confirm the new Pokémon is in the home box
    ConfirmMonInBoxSlot(driver, tester, "home", 2, draggingSpecies1)

    # Drag back but to a different slot
    draggingSpecies2 = "Wigglytuff"
    monToDragFrom = homeBox.find_element(By.ID, "home-box-icon-2") # Ninetales
    monToDragTo = saveBox.find_element(By.ID, "save-box-icon-15") # Wigglytuff
    dragAndDrop.drag_and_drop(monToDragFrom, monToDragTo).perform()

    # Confirm the original Pokémon is back in the save box at the new slot
    ConfirmMonInBoxSlot(driver, tester, "save", 15, draggingSpecies1)

    # Confirm the new Pokémon is in the home box
    ConfirmMonInBoxSlot(driver, tester, "home", 2, draggingSpecies2)


def TestSingleSelectMove(driver: webdriver.Chrome, tester: TestCase):
    """
    Test moving a Pokemon by clicking on it and then clicking on the destination box.
    This is exactly the same as dragging but with clicking.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    """
    # Wait for the boxes to load
    saveBox = WaitForElement(driver, By.ID, "save-box")
    homeBox = WaitForElement(driver, By.ID, "home-box")

    # Find the Pokemon to move
    selectedSpecies1 = "Arcanine"
    monToMoveFrom = saveBox.find_element(By.ID, "save-box-icon-23") # Arcanine

    # Move the mouse in case it's hovering over something else from a previous test
    mouse = PointerInput(POINTER_MOUSE, "mouse")
    actions = ActionBuilder(driver, mouse=mouse)
    actions.pointer_action.move_to(monToMoveFrom) # Move to the mon to select
    actions.perform()

    # Click the Pokemon to move
    monToMoveFrom.click()

    # Click the destination box
    monToMoveTo = homeBox.find_element(By.ID, "home-box-icon-29")
    monToMoveTo.click()

    # Confirm the original Pokemon is no longer in the save box
    ConfirmMonInBoxSlot(driver, tester, "save", 23, "")

    # Confirm the new Pokemon is in the home box
    ConfirmMonInBoxSlot(driver, tester, "home", 29, selectedSpecies1)

    # Move back but to a different slot
    replacementSpecies = "Poliwrath"
    monToMoveFrom = homeBox.find_element(By.ID, "home-box-icon-29")
    monToMoveTo = saveBox.find_element(By.ID, "save-box-icon-24") # Poliwrath
    monToMoveFrom.click()
    monToMoveTo.click()

    # Confirm the original Pokemon is back in the save box at the new slot
    ConfirmMonInBoxSlot(driver, tester, "save", 24, selectedSpecies1)

    # Confirm the new Pokemon is in the home box
    ConfirmMonInBoxSlot(driver, tester, "home", 29, replacementSpecies)


def TestMultiSelectMove(driver: webdriver.Chrome, tester: TestCase):
    """
    Test moving multiple Pokemon by clicking on them and then clicking on the destination box.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    """
    saveBox = driver.find_element(By.ID, "save-box")
    homeBox = driver.find_element(By.ID, "home-box")

    # Select multiple Pokemon in the save box
    slotsToSelect = [2, 3, 9] # Blastoise, Butterfree, Raichu
    speciesToSelect = ["Blastoise", "Butterfree", "Raichu"]
    actionChains = webdriver.ActionChains(driver)
    for mon in slotsToSelect:
        monToSelect = saveBox.find_element(By.ID, f"save-box-icon-{mon}")
        actionChains.click(monToSelect)
    actionChains.perform()

    # Click the home box to move the selected Pokemon to a spot they won't fit
    placeAtSpot = homeBox.find_element(By.ID, "home-box-icon-26") # Bottom row
    ClickButton(placeAtSpot)

    # Confirm the error message appeared
    toastContainer = driver.find_element(By.CLASS_NAME, "Toastify")
    html = toastContainer.get_attribute("innerHTML")
    tester.assertIn("bottom-left", html, "Error message not on bottom left.")
    tester.assertIn("Not enough space for the move.", html, "Error message not found.")

    # Place at a spot it will fit
    placeAtSpot = homeBox.find_element(By.ID, "home-box-icon-9") # Second row
    ClickButton(placeAtSpot)

    # Confirm the original Pokemon are no longer in the save box
    for slot in slotsToSelect:
        ConfirmMonInBoxSlot(driver, tester, "save", slot, "")

    # Confirm the new Pokemon are in the home box
    for i, slot in enumerate([9, 10, 16]):
        ConfirmMonInBoxSlot(driver, tester, "home", slot, speciesToSelect[i])
