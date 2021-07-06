import json
import shutil
import sys

from Defines import Defines
from PokemonProcessing import PokemonProcessing
from SaveBlocks import SaveBlocks
from SaveBlockProcessing import SaveBlockProcessing


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
                saveFilePath = sys.argv[2]
                saveBlocks, fileSignature = SaveBlocks.LoadAll(saveFilePath)

                if saveBlocks != {} and fileSignature != 0:
                    Defines.LoadAll(fileSignature)
                    allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
                    boxTitles = SaveBlockProcessing.LoadCFRUBoxTitles(saveBlocks)
                else:  # Error reading save blocks
                    allPokemon = []
                    boxTitles = []

                returnData({"boxes": allPokemon, "titles": boxTitles})
                return
        elif command == "UPDATE_SAVE":
            if len(sys.argv) > 3:  # Has data and save file
                updatedDataJSON = sys.argv[2]
                originalSaveFilePath = sys.argv[3]
                saveBlocks, fileSignature = SaveBlocks.LoadAll(originalSaveFilePath)

                if saveBlocks != {} and fileSignature != 0:
                    Defines.LoadAll(fileSignature)
                    newFilePath = originalSaveFilePath.split(".sav")[0] + "_new.sav"
                    shutil.copyfile(originalSaveFilePath, newFilePath)

                    with open(updatedDataJSON, 'r', encoding="utf-8") as jsonFile:
                        newPokemon = json.load(jsonFile)

                    seenFlags, caughtFlags = SaveBlockProcessing.LoadCFRUPokedexFlags(saveBlocks)
                    seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, newPokemon)
                    newSaveBlocks = SaveBlockProcessing.UpdateCFRUBoxData(saveBlocks, newPokemon)
                    newSaveBlocks = SaveBlockProcessing.UpdateCFRUPokedexFlags(newSaveBlocks, seenFlags, caughtFlags)
                    if not SaveBlocks.ReplaceAll(newFilePath, newSaveBlocks):
                        newFilePath = ""  # An error occurred
                else:  # Error reading save file
                    newFilePath = ""

                returnData(newFilePath)
                return

    returnData("")  # Nothing to return


if __name__ == '__main__':
    main()
