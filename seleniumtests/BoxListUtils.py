import time
from unittest import TestCase
from selenium import webdriver
from selenium.webdriver.common.actions.pointer_input import PointerInput
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.actions.interaction import POINTER_MOUSE
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import NoSuchElementException

from seleniumtests.BoxViewUtils import ConfirmMonInBoxSlot, LoadCorrectBoxMons, LoadAllSaveBoxTitles, ConfirmCurrentHomeAndSaveBoxNames, ConfirmAllMonsInCorrectBox
from seleniumtests.TestUtils import *


def OpenBoxList(driver: webdriver.Chrome, boxType: str):
    """
    Open the box list view.

    :param driver: The Selenium WebDriver instance.
    :param boxType: The type of box to open (e.g., "home", "save").
    """
    # Click the box list button
    boxListButton = driver.find_element(By.ID, f"view-{boxType}-boxes-button")
    ClickButton(boxListButton)

    # Wait for the box list to load
    WaitForElement(driver, By.ID, "box-list")


def OpenSaveBoxList(driver: webdriver.Chrome):
    """
    Open the save box list.

    :param driver: The Selenium WebDriver instance.
    """
    OpenBoxList(driver, "save")


def OpenHomeBoxList(driver: webdriver.Chrome):
    """
    Open the home box list.

    :param driver: The Selenium WebDriver instance.
    """
    OpenBoxList(driver, "home")


def HitBackButton(driver: webdriver.Chrome):
    """
    Hit the back button on the box list view.

    :param driver: The Selenium WebDriver instance.
    """
    # Click the back button
    backButton = driver.find_element(By.ID, "back-button")
    ClickButton(backButton)


def HitReorderButton(driver: webdriver.Chrome):
    """
    Hit the reorder button on the box list view.

    :param driver: The Selenium WebDriver instance.
    """
    # Click the reorder button
    reorderButton = WaitForElement(driver, By.ID, "reorder-button")
    ClickButton(reorderButton)


def GetBox(driver: webdriver.Chrome, boxId: int) -> WebElement:
    """
    Get a box element by its ID.

    :param driver: The Selenium WebDriver instance.
    :param boxId: The ID of the box to get.
    :return: The WebElement representing the box.
    """
    return driver.find_element(By.ID, f"box-{boxId}")


def DragBoxToBox(driver: webdriver.Chrome, fromBox: WebElement, toBox: WebElement, pauseBeforeDrop: bool = False):
    """
    Drag a box to another spot in the box list.

    :param driver: The Selenium WebDriver instance.
    :param fromBox: The box to drag from.
    :param toBox: The box to drag to.
    :param pauseBeforeDrop: Whether to pause before dropping the box.
    """
    # Set up a mouse pointer device
    mouse = PointerInput(POINTER_MOUSE, "mouse")

    # Build the pointer action
    actions = ActionBuilder(driver, mouse=mouse)
    actions.pointer_action.move_to(fromBox).pointer_down() # Click and hold the box
    actions.pointer_action.move_to(fromBox, x=+5, y=+5) # Move the mouse so the dragging is registered
    if pauseBeforeDrop:
        actions.pointer_action.pause(0.25) # Wait for the drag to register
    actions.pointer_action.move_to(toBox) # Move to the target box
    if pauseBeforeDrop:
        actions.pointer_action.pause(0.25) # Wait for the drag to register
    actions.pointer_action.pointer_up() # Release the box

    # Perform the sequence
    actions.perform()


def MultiDragBoxes(driver: webdriver.Chrome, boxIds: list):
    """
    Right click on the specified boxes.

    :param driver: The Selenium WebDriver instance.
    :param boxIds: The list of box IDs to right click on.
    """
    for boxId in boxIds:
        box = driver.find_element(By.ID, f"box-{boxId}")
        box.click() # Click the box to select it


def DragMultiDragedBoxes(driver: webdriver.Chrome, boxToDragFrom: int, boxToDragTo: int):
    """
    Drags multiple selected boxes to the specified box.

    :param driver: The Selenium WebDriver instance.
    :param boxToDragFrom: The box to drag from.
    :param boxToDragTo: The box to drag to.
    """
    # Get the box elements
    boxToDragFrom = GetBox(driver, boxToDragFrom)
    boxToDragTo = GetBox(driver, boxToDragTo)

    # Drag the boxes
    DragBoxToBox(driver, boxToDragFrom, boxToDragTo, True)


def ReverseBoxOrder(driver: webdriver.Chrome, boxCount: int):
    """
    Reverse the order of the boxes.

    :param driver: The Selenium WebDriver instance.
    :param boxCount: The number of boxes to reverse.
    """

    boxIdToDragTo = boxCount - 1 # Drag to the last box
    dragToBox = GetBox(driver, boxIdToDragTo)

    for i in range(boxIdToDragTo):
        # Find the box to drag from
        dragBox = GetBox(driver, i)
        DragBoxToBox(driver, dragBox, dragToBox)


def ConfirmAllBoxTitles(driver: webdriver.Chrome, tester: TestCase, expectedTitles: list[str]):
    """
    Confirm all box titles match the expected titles.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param expectedTitles: The expected titles of the boxes.
    """
    # Get the box titles
    boxTitles = driver.find_elements(By.CLASS_NAME, "mini-box-title")
    boxTitles = [title.text for title in boxTitles]

    # Confirm the box titles match the expected titles
    tester.assertEqual(boxTitles, expectedTitles, f"Box titles do not match expected titles. Expected: {expectedTitles}, Found: {boxTitles}")


def ConfirmCurrentBox(driver: webdriver.Chrome, tester: TestCase, boxName: str):
    """
    Confirm the current box is the one we expect.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param boxName: The expected name of the current box.
    """
    currentBox = driver.find_element(By.CLASS_NAME, "mini-box-current-box-title")
    tester.assertEqual(currentBox.text, boxName, f"Current box is not {boxName} as expected.")


def TestFilteringAndJumpingBoxes(driver: webdriver.Chrome, tester: TestCase, boxType: str, boxName: str, boxId: int):
    """
    Test the box list view and basic filter functionality.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param boxType: The type of box to filter (e.g., "home", "save").
    :param boxName: The name of the box to filter and jump to.
    :param boxId: The ID of the box to filter and jump to.
    """
    # Open the save box list
    OpenBoxList(driver, boxType)

    # Filter the boxes
    filter = WaitForElement(driver, By.ID, "filter")
    filter.send_keys(boxName)

    # Wait for the filter to apply
    time.sleep(1)

    # Confirm some boxes are filtered out
    jumpToBox = driver.find_element(By.ID, f"box-{boxId}-with-title")

    try:
        id = 0 if boxId != 0 else 1
        driver.find_element(By.ID, f"box-{id}-with-title")
        tester.fail("Filtered box is still visible.")
    except NoSuchElementException:
        # Good: Box is hidden
        pass

    # Jump to the box
    jumpToBox = driver.find_element(By.ID, f"box-{boxId}")
    jumpToBox.click()

    # Confirm the current boxes are the ones we expect
    if boxType == "home":
        ConfirmCurrentHomeAndSaveBoxNames(driver, tester, boxName, "Box 1")

        # Confirm all slots are empty in the home box
        for slot in range(0, 30):
            ConfirmMonInBoxSlot(driver, tester, boxType, slot, "")
    else:
        ConfirmCurrentHomeAndSaveBoxNames(driver, tester, "Cloud 1", boxName)

        # Confirm Pokemon we expect are in the box
        allPokemon = LoadCorrectBoxMons()
        for slot in allPokemon[boxName]:
            ConfirmMonInBoxSlot(driver, tester, boxType, slot, allPokemon[boxName][slot])


def TestReversingAndRevertingBoxOrder(driver: webdriver.Chrome, tester: TestCase, boxCount: int):
    """
    Test reversing the box order and reverting it back to the original order.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param boxCount: The number of boxes to reverse.
    """
    # Open the save box list
    OpenSaveBoxList(driver)

    # Allow reordering boxes
    HitReorderButton(driver)

    # Reverse the box order
    ReverseBoxOrder(driver, boxCount)

    # Confirm the dragging worked and the boxes are now in reverse order
    originalTitles = LoadAllSaveBoxTitles()
    reversedTitles = originalTitles[::-1]
    ConfirmAllBoxTitles(driver, tester, reversedTitles)

    # Confirm the the current box is still Box 1
    ConfirmCurrentBox(driver, tester, "Box 1")

    # Return to the box views
    HitBackButton(driver)

    # Confirm all Pokemon are in the correct box slots but in reverse order
    ConfirmCurrentHomeAndSaveBoxNames(driver, tester, "Cloud 1", "Box 1")
    ConfirmAllMonsInCorrectBox(driver, tester, "save", reversedTitles[-1:] + reversedTitles[:-1])  # Box 1 is the current box and then the next will be preset

    # Open the save box list again
    OpenSaveBoxList(driver)

    # Allow reordering boxes
    HitReorderButton(driver)

    # Reverse the box order again to revert it back to the original order
    ReverseBoxOrder(driver, boxCount)

    # Confirm the dragging worked and the current box is still Box 1
    ConfirmCurrentBox(driver, tester, "Box 1")
    ConfirmAllBoxTitles(driver, tester, originalTitles)

    # Return to the box views
    HitBackButton(driver)

    # Confirm all Pokemon are in the correct box slots
    ConfirmCurrentHomeAndSaveBoxNames(driver, tester, "Cloud 1", "Box 1")
    ConfirmAllMonsInCorrectBox(driver, tester, "save", originalTitles)


def TestMultiDragBoxes(driver: webdriver.Chrome, tester: TestCase, boxIdsToSelect: list, dragFromBoxId: int, dropAfterBoxId: int, currentBoxName: str, boxCount: int):
    """
    Test the multi-select boxes functionality by dragging multiple boxes at once.

    :param driver: The Selenium WebDriver instance.
    :param tester: The TestCase instance for assertions.
    :param boxIdsToSelect: The list of box IDs to select (offset by 1).
    :param dragFromBoxId: The box ID to drag from.
    :param dropAfterBoxId: The box ID to drop after.
    :param currentBoxName: The name of the current box.
    :param boxCount: The total number of boxes.
    """
    # Open the save box list
    OpenSaveBoxList(driver)

    # Allow reordering boxes
    HitReorderButton(driver)

    # Multi-select boxes 7-9, 12-14, and 17-19
    idOffset = 1 # The number of ids off the boxes will be
    boxIdsToSelect = [boxId - idOffset for boxId in boxIdsToSelect] # Adjust the box ids to match the ones in the list
    boxIdsToSelectBeforeDraggingFrom = [id for id in boxIdsToSelect if id <= dragFromBoxId]
    titlesToSelect = [driver.find_element(By.ID, f"box-{i}-title").text for i in sorted(boxIdsToSelect)]
    MultiDragBoxes(driver, boxIdsToSelect)

    # Prints
    print(f"Dragging boxes: {titlesToSelect}")
    print(f"Dragging from spot {driver.find_element(By.ID, f"box-{dragFromBoxId}-title").text} is located")
    print(f"Dragging to spot {driver.find_element(By.ID, f"box-{dropAfterBoxId}-title").text} is located")

    # Drag them to right before the last box
    # And start dragging from the last box selected
    DragMultiDragedBoxes(driver, dragFromBoxId, dropAfterBoxId)
    dragFromBoxId += len(boxIdsToSelectBeforeDraggingFrom)

    # Confirm the dragging worked and the boxes are now in the new order
    movedTitles = LoadAllSaveBoxTitles().copy()
    poppedTitles = [movedTitles.pop(movedTitles.index(title)) for title in titlesToSelect] # Pop the moved boxes
    distFromEnd = (boxCount - 1) - dropAfterBoxId

    # Take one away from distFromEnd for each id in boxIdsToSelect that are after dropAfterBoxId
    for boxId in boxIdsToSelect:
        if boxId > dropAfterBoxId and distFromEnd > 0:
            distFromEnd -= 1

    if distFromEnd == 0:
        movedTitles = movedTitles + poppedTitles
    else:
        if dragFromBoxId >= dropAfterBoxId:
            distFromEnd += 1 # If the box we dragged from is after the drop box, we need to add one back

        movedTitles = movedTitles[:-distFromEnd] + poppedTitles + movedTitles[-distFromEnd:]

    ConfirmAllBoxTitles(driver, tester, movedTitles)

    # Confirm the current box is still Box 1
    ConfirmCurrentBox(driver, tester, currentBoxName)

    # Return to the box views
    HitBackButton(driver)

    # Rearrange expected titles so current box is always first
    currentBoxNameIndex = movedTitles.index(currentBoxName)
    movedTitles = movedTitles[currentBoxNameIndex:] + movedTitles[:currentBoxNameIndex] # Move the current box and any after it to the front

    # Confirm all Pokemon are in the correct box slots
    ConfirmCurrentHomeAndSaveBoxNames(driver, tester, "Cloud 1", "Box 1")
    ConfirmAllMonsInCorrectBox(driver, tester, "save", movedTitles)
