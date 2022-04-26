import json
import shutil
import sys

from Defines import Defines, UNBOUND_FILE_SIGNATURE
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
                allPokemon = []   # In case error reading save blocks
                boxTitles = []
                randomizer = False

                if saveBlocks != {} and fileSignature != 0 and Defines.LoadAll(fileSignature):
                    allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
                    boxTitles = SaveBlockProcessing.LoadCFRUBoxTitles(saveBlocks)

                    if SaveBlockProcessing.IsRandomizedSave(saveBlocks):
                        randomizer = True

                returnData({"gameId": Defines.GetCurrentDefinesDir(), "boxCount": Defines.BoxCount(),  # gameId is used on the front-end to load game-specific data
                            "boxes": allPokemon, "titles": boxTitles, "randomizer": randomizer})
                return
        elif command == "UPDATE_SAVE":
            if len(sys.argv) > 3:  # Has data and save file
                updatedDataJSON = sys.argv[2]
                originalSaveFilePath = sys.argv[3]
                saveBlocks, fileSignature = SaveBlocks.LoadAll(originalSaveFilePath)
                newFilePath = ""  # In case error reading save file

                if saveBlocks != {} and fileSignature != 0 and Defines.LoadAll(fileSignature):
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

                returnData(newFilePath)
                return
        elif command == "CONVERT_OLD_CLOUD_FILE":
            if len(sys.argv) > 2:  # Has save path
                cloudFilePath = sys.argv[2]
                Defines.LoadAll(UNBOUND_FILE_SIGNATURE)  # Really just needed for the languages
                completed, error = PokemonProcessing.ConvertOldCloudFileToNew(cloudFilePath)
                returnData({"completed": completed, "errorMsg": error})
                return

    returnData("")  # Nothing to return


if __name__ == '__main__':
    main()
