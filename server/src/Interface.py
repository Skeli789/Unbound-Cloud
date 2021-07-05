import json
import shutil
import sys

from LoadSave import LoadSaveblocks, ParseData, LoadBoxTitles
from StoreSave import UpdateSaveFile


def returnData(data):
    """
    Formats and outputs the data to be sent back to Node.js.
    :param data: The data to be returned. Can be any type.
    """

    retVal = {"data": data}
    print(json.dumps(retVal))


def main():
    if len(sys.argv) > 1:  # Has command
        command = sys.argv[1].upper()
        if command == "UPLOAD_SAVE":
            if len(sys.argv) > 2:  # Has save path
                relevantSaveBlocks = LoadSaveblocks(sys.argv[2])
                allPokemon = ParseData(relevantSaveBlocks)
                boxTitles = LoadBoxTitles(relevantSaveBlocks)
                returnData({"boxes": allPokemon, "titles": boxTitles})
                return
        elif command == "UPDATE_SAVE":
            if len(sys.argv) > 3:  # Has data and save file
                updatedDataJSON = sys.argv[2]
                originalSaveFilePath = sys.argv[3]
                relevantSaveBlocks = LoadSaveblocks(originalSaveFilePath)
                newFilePath = originalSaveFilePath.split(".sav")[0] + "_new.sav"
                shutil.copyfile(originalSaveFilePath, newFilePath)

                with open(updatedDataJSON, 'r', encoding="utf-8") as jsonFile:
                    newPokemon = json.load(jsonFile)

                UpdateSaveFile(newFilePath, newPokemon, relevantSaveBlocks)
                returnData(newFilePath)
                return

    returnData("")  # Nothing to return


if __name__ == '__main__':
    main()
