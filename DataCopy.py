import json, os, shutil


def main():
    # Setup directories
    currentDir = os.path.dirname(os.path.realpath(__file__))
    serverDataDir = os.path.join(currentDir, "server", "src", "data")
    clientDataDir = os.path.join(currentDir, "src", "data")
    unboundShiniesDir = os.path.join(currentDir, "public", "images", "unbound_shinies")
    gameDirs = [x[0] for x in os.walk(serverDataDir) if x[0] != serverDataDir]  # Ignore the parent directory

    # Setup files to copy over
    entireFiles = ["BaseStats.json"]  # Copy over these files directly
    valuesOnly = ["BallTypes.json", "Items.json", "Moves.json", "Species.json"]  # Use the values in these files as keys

    # Copy all game data
    for gameDir in gameDirs:
        gameDirName = gameDir.split("\\")[-1]
        for file in entireFiles:
            try:
                shutil.copy(os.path.join(gameDir, file), os.path.join(clientDataDir, gameDirName, file))
            except shutil.SameFileError:
                pass

        for file in valuesOnly:
            with open(os.path.join(gameDir, file), "r") as jsonFile:
                jsonData = json.load(jsonFile)
            with open(os.path.join(clientDataDir, gameDirName, file), "w") as jsonFile:
                if type(jsonData) == list:
                    jsonData = {x: True for x in jsonData}  # Just the values, ignore the keys
                else:
                    jsonData = {jsonData[x]: True for x in jsonData}  # Just the values, ignore the keys

                jsonFile.write(json.dumps(jsonData, indent=4) + "\n")

    # Generate Unbound Shinies species list
    speciesList = {}
    for file in os.listdir(unboundShiniesDir):
        speciesList[file.split(".png")[0]] = True
    with open(os.path.join(clientDataDir, "UnboundShinies.json"), "w") as file:
        file.write(json.dumps(speciesList, indent=4) + "\n")

    # Copy Entire Files
    entireFiles = ["ExperienceCurves.json", "SpeciesNames.json", "SpeciesToDexNum.json"]
    for file in entireFiles:
        try:
            shutil.copy(os.path.join(serverDataDir, file), os.path.join(clientDataDir, file))
        except shutil.SameFileError:
            pass
    print("Data copied successfully!")


if __name__ == '__main__':
    main()
