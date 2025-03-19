import os
import json
import time

# Get the path to the Unbound Cloud accounts directory
cloudPath = os.path.join(os.getenv("APPDATA"), "unboundcloud", "accounts")
print(f"Path to Unbound Cloud directory: {cloudPath}")

# Check if the accounts directory exists
if not os.path.exists(cloudPath):
    print("Unbound Cloud directory does not exist")
    exit(1)

# Initialize the count of activated and deactivated files
activatedFiles = 0
deactivatedFilesList = []
deactivatedFilesListNotAccessed = []

# Go over all account files
startTime = time.time()
for i, filename in enumerate(os.listdir(cloudPath)):
    # Every 100 files, print the number of files read
    if i % 100 == 0:
        print(f"Files read: {i}, Time elapsed: {round(time.time() - startTime, 2)} seconds")

    filePath = os.path.join(cloudPath, filename)
    if os.path.isfile(filePath):
        with open(filePath, "r", encoding="utf-8") as file:
            try:
                data = json.load(file)

                # Check if the user is activated
                if "activated" in data:
                    if data["activated"]:
                        activatedFiles += 1
                    else:
                        deactivatedFilesList.append(filePath)

                        # Check when they last accessed the account
                        if "lastAccessed" in data:
                            lastAccessed = data["lastAccessed"]
                            currentTime = int(time.time() * 1000)
                            if currentTime - lastAccessed > 30 * 24 * 60 * 60 * 1000: # 30 days have passed
                                lastDate = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(lastAccessed / 1000))
                                deactivatedFilesListNotAccessed.append({"path": filePath, "lastAccessed": lastDate})
                else:
                    print(f"File {filename} does not have the key 'activated'")
            except json.decoder.JSONDecodeError:
                entry = {"path": filePath, "lastAccessed": "Unknown"}
                deactivatedFilesList.append(entry)
                deactivatedFilesListNotAccessed.append(entry)
                print(f"File {filename} is not a valid JSON file")
print(f"Files read: {i + 1}, Time elapsed: {round(time.time() - startTime, 2)} seconds")

# Print the number of activated and deactivated files
print(f"Number of activated files: {activatedFiles}")
print(f"Number of deactivated files: {len(deactivatedFilesList)}")
print(f"Number of deactivated files not accessed in 30 days: {len(deactivatedFilesListNotAccessed)}")

# Store the deactivated files not accessed in 30 days in a JSON file
with open("deactivated_files_not_accessed.txt", "w", encoding="utf-8") as file:
    file.write(json.dumps(deactivatedFilesListNotAccessed, indent=4))

# Prompt the user to delete the deactivated files not accessed in 30 days
response = input("Are you sure you want to delete the deactivated files not accessed in 30 days? Type 'yes' to confirm: ")

if response.lower() == 'yes':
    # Delete the deactivated files not accessed in 30 days
    totalSpaceFreed = 0
    for file in deactivatedFilesListNotAccessed:
        fileSize = os.path.getsize(file["path"]) # Calculate how much space is being freed
        totalSpaceFreed += fileSize
        os.remove(file["path"])
    print(f"Deleted {len(deactivatedFilesListNotAccessed)} files and freed {totalSpaceFreed} bytes")
else:
    print("Operation cancelled and no files were deleted")
