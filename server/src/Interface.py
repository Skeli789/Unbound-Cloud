import json
import shutil
import uvicorn
from fastapi import FastAPI

from Defines import Defines, UNBOUND_2_1_FILE_SIGNATURE
from PokemonProcessing import PokemonProcessing
from SaveBlocks import SaveBlocks
from SaveBlockProcessing import SaveBlockProcessing

PORT = 3005
app = FastAPI()


@app.get("/uploadsave")
def uploadSave(saveFilePath: str):
    if saveFilePath == "":
        print("No save file path provided")
        return {}

    saveBlocks, fileSignature = SaveBlocks.LoadAll(saveFilePath)
    allPokemon = []   # In case error reading save blocks
    boxTitles = []
    randomizer = False
    inaccessibleReason = ""
    oldVersion = ""

    try:
        if Defines.IsOldVersionFileSignature(fileSignature):
            oldVersion = Defines.GetOldVersionGameName(fileSignature)
        elif saveBlocks != {} and fileSignature != 0 and Defines.LoadAll(fileSignature):
            allPokemon = SaveBlockProcessing.LoadPCPokemon(saveBlocks)
            boxTitles = SaveBlockProcessing.LoadCFRUBoxTitles(saveBlocks)

            if SaveBlockProcessing.IsRandomizedSave(saveBlocks):
                randomizer = True

            if not SaveBlockProcessing.IsAccessibleCurrently(saveBlocks):
                inaccessibleReason = SaveBlockProcessing.GetInaccessibleReason(saveBlocks)
    except Exception as e:
        print("Error reading save data: " + str(e))

    return {"gameId": Defines.GetCurrentDefinesDir(), "boxCount": Defines.BoxCount(),  # gameId is used on the front-end to load game-specific data
            "boxes": allPokemon, "titles": boxTitles, "randomizer": randomizer, "inaccessibleReason": inaccessibleReason, "oldVersion": oldVersion}


@app.get("/updatesave")
def updateSave(updatedDataJSON: str, originalSaveFilePath: str):
    if updatedDataJSON == "" or originalSaveFilePath == "":
        print("No updated data or save file path provided")
        return ""

    try:
        saveBlocks, fileSignature = SaveBlocks.LoadAll(originalSaveFilePath)
        newFilePath = ""  # In case error reading save file

        if saveBlocks != {} and fileSignature != 0 and Defines.LoadAll(fileSignature):
            newFilePath = originalSaveFilePath.split(".sav")[0] + "_new.sav"
            shutil.copyfile(originalSaveFilePath, newFilePath)

            with open(updatedDataJSON, 'r', encoding="utf-8") as jsonFile:
                newPokemon = json.load(jsonFile)

            seenFlags, caughtFlags = SaveBlockProcessing.LoadPokedexFlags(saveBlocks)
            seenFlags, caughtFlags = PokemonProcessing.UpdatePokedexFlags(seenFlags, caughtFlags, newPokemon)
            newSaveBlocks = SaveBlockProcessing.UpdateCFRUBoxData(saveBlocks, newPokemon)
            newSaveBlocks = SaveBlockProcessing.UpdatePokedexFlags(newSaveBlocks, seenFlags, caughtFlags)
            if not SaveBlocks.ReplaceAll(newFilePath, newSaveBlocks):
                newFilePath = ""  # An error occurred 
    except Exception as e:
        print("Error updating save data: " + str(e))
        newFilePath = ""

    return newFilePath


@app.get("/convertoldcloudfile")
def convertOldCloudFile(cloudFilePath: str):
    if cloudFilePath == "":
        print("No cloud file path provided")
        return {"completed": False, "errorMsg": "No cloud file path provided"}

    Defines.LoadAll(UNBOUND_2_1_FILE_SIGNATURE)  # Really just needed for the languages
    completed, error = PokemonProcessing.ConvertOldCloudFileToNew(cloudFilePath)
    return {"completed": completed, "errorMsg": error}


if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=PORT)
