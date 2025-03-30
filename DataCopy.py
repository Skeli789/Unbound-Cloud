import json, os, shutil

# Setup directories
gCurrentDir = os.path.dirname(os.path.realpath(__file__))
gServerDataDir = os.path.join(gCurrentDir, "server", "src", "data")
gClientDataDir = os.path.join(gCurrentDir, "src", "data")
gUnboundShiniesDir = os.path.join(gCurrentDir, "public", "images", "unbound_shinies")


def CopyData():
    # Setup directories to copy from
    gameDirs = [x[0] for x in os.walk(gServerDataDir) if x[0] != gServerDataDir]  # Ignore the parent directory

    # Setup files to copy over
    entireFiles = ["BaseStats.json"]  # Copy over these files directly
    valuesOnly = ["BallTypes.json", "Items.json", "Moves.json", "Species.json"]  # Use the values in these files as keys

    # Copy all game data
    for gameDir in gameDirs:
        gameDirName = gameDir.split("\\")[-1]
        targetDir = os.path.join(gClientDataDir, gameDirName)

        try:
            os.makedirs(targetDir)
        except FileExistsError:
            pass

        for file in entireFiles:
            try:
                shutil.copy(os.path.join(gameDir, file), os.path.join(targetDir, file))
            except shutil.SameFileError:
                pass

        for file in valuesOnly:
            with open(os.path.join(gameDir, file), "r") as jsonFile:
                jsonData = json.load(jsonFile)
            with open(os.path.join(targetDir, file), "w") as jsonFile:
                if type(jsonData) == list:
                    jsonData = {x: True for x in jsonData}  # Just the values, ignore the keys
                else:
                    jsonData = {jsonData[x]: True for x in jsonData}  # Just the values, ignore the keys

                jsonFile.write(json.dumps(jsonData, indent=4) + "\n")

    # Copy Dex Nums in reverse
    dexNums = {}
    with open(os.path.join(gServerDataDir, "DexNum.json"), "r") as file:
        dexNums = json.load(file)
        dexNums = {dexNums[x]: x for x in dexNums}
    with open(os.path.join(gClientDataDir, "DexNum.json"), "w") as file:
        file.write(json.dumps(dexNums, indent=4) + "\n")

    # Generate Unbound Shinies species list
    speciesList = {}
    for file in os.listdir(gUnboundShiniesDir):
        speciesList[file.split(".png")[0]] = True
    with open(os.path.join(gClientDataDir, "UnboundShinies.json"), "w") as file:
        file.write(json.dumps(speciesList, indent=4) + "\n")

    # Copy Entire Files
    entireFiles = ["ExperienceCurves.json", "SpeciesNames.json", "SpeciesNamesAlts.json", "SpeciesToDexNum.json"]
    for file in entireFiles:
        try:
            # Validate proper JSON
            with open(os.path.join(gServerDataDir, file), "r") as jsonFile:
                jsonData = json.load(jsonFile)

            shutil.copy(os.path.join(gServerDataDir, file), os.path.join(gClientDataDir, file))
        except shutil.SameFileError:
            pass
        except json.JSONDecodeError:
            print(f"Error: {file} is not a valid JSON file. Skipping copy.")
            continue
    print("Data copied successfully!")


def LoadJSONFile(filePath):
    with open(filePath, "r") as json_file:
        return json.load(json_file)

def ValidateData():
    errors = []

    # Setup directories to validate
    gameDirs = [x[0] for x in os.walk(gClientDataDir) if x[0] != gClientDataDir]  # Ignore the parent directory

    # Load all defines
    abilityNames = LoadJSONFile(os.path.join(gClientDataDir, "AbilityNames.json"))
    speciesNames = LoadJSONFile(os.path.join(gClientDataDir, "SpeciesNames.json"))
    itemNames = LoadJSONFile(os.path.join(gClientDataDir, "ItemNames.json"))
    moveNames = LoadJSONFile(os.path.join(gClientDataDir, "MoveNames.json"))
    typeNames = LoadJSONFile(os.path.join(gClientDataDir, "TypeNames.json"))
    ballTypeNames = LoadJSONFile(os.path.join(gClientDataDir, "BallTypeNames.json"))

    validationRules = {
        "Species.json": (speciesNames, "Species"),
        "Moves.json": (moveNames, "Move"),
        "Items.json": (itemNames, "Item"),
        "BallTypes.json": (ballTypeNames, "BallType"),
        "BaseStats.json": (speciesNames, "Species"),
        "SpeciesNamesAlts.json": (speciesNames, "Species"),
    }

    # Validate all game data
    for i, gameDir in enumerate(gameDirs):
        for fileName, (defines, nameType) in validationRules.items():
            if fileName == "SpeciesNamesAlts.json":
                if i != 0:
                    continue # Only validate SpeciesNamesAlts once
                filePath = os.path.join(gClientDataDir, fileName)
            else:
                filePath = os.path.join(gameDir, fileName)

            allData = LoadJSONFile(filePath)
            for dataItem in allData:
                try:
                    assert dataItem in defines
                except AssertionError:
                    errors.append(f"{nameType} \"{dataItem}\" from \"{filePath}\" not found in {nameType}Names.json")

            if fileName == "BaseStats.json":
                for species in allData:
                    speciesData = allData[species]
                    for abilityNum in ["ability1", "ability2", "hiddenAbility"]:
                        try:
                            assert speciesData[abilityNum] in abilityNames
                        except AssertionError:
                            errors.append(f"Ability \"{speciesData[abilityNum]}\" from \"{filePath}\" not found in AbilityNames.json")
                    for typeNum in ["type1", "type2"]:
                        try:
                            assert speciesData[typeNum] in typeNames
                        except AssertionError:
                            errors.append(f"Type \"{speciesData[typeNum]}\" from \"{filePath}\" not found in TypeNames.json")

    # Validate all item links in itemNames
    # Too slow to be automated. Needs to be run manually
    # for item in itemNames:
    #     item = itemNames[item]
    #     if "link" in item and item != "ITEM_NONE":
    #         itemLink = item["link"]
    #         fullLink = f"https://raw.githubusercontent.com/msikma/pokesprite/master/items/{itemLink}.png"
    #         print("Checking link: " + fullLink)
    #         try:
    #             assert requests.get(fullLink).status_code == 200
    #         except AssertionError:
    #             errors.append(f"Item link \"{itemLink}\" from \"ItemNames.json\" not a valid link")

    # Print errors if needed
    if len(errors) != 0:
        for error in errors:
            print(error)
        raise Exception("Data validation failed!")
    else:
        print("Data validated successfully!")


def main():
    CopyData()
    ValidateData()


if __name__ == '__main__':
    main()
