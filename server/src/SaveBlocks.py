import os
from typing import BinaryIO, List, Dict, Tuple

from Defines import Defines
from Util import BytesToInt, ConvertToReverseByteList

SaveBlockNumbers = list(range(0, 13 + 1)) + [30, 31]
SaveSize = 0xE000
BlockSize = 0x1000
BlockDataSize = 0xFF0
BlockIdOffset = 0xFF4
ChecksumOffset = 0xFF6  # Addition of all bytes in saveblock after overflow
FileSignatureOffset = 0xFF8  # Unique id for the game
SaveIndexOffset = 0xFFC  # Goes up by 1 each time the game is saved


class SaveBlocks:
    @staticmethod
    def LoadAll(saveFile: str) -> Tuple[Dict[int, List[int]], int]:
        # Validate the save file first
        if not SaveBlocks.Validate(saveFile):
            return [{}, 0]

        saveBlocks = SaveBlocks.CreateBlankDict()  # Get the storage dict for the final data

        with open(saveFile, "rb") as binaryFile:
            # Get Save Index of Save A
            offset = 0
            binaryFile.seek(offset + SaveIndexOffset)
            saveIndexA = BytesToInt(binaryFile.read(4))

            # Extract File Signature of Save A
            binaryFile.seek(offset + FileSignatureOffset)
            fileSignatureA = BytesToInt(binaryFile.read(4))
    
            # Get Save Index of Save B
            offset = SaveSize
            binaryFile.seek(offset + SaveIndexOffset)
            saveIndexB = BytesToInt(binaryFile.read(4))
    
            # Extract File Signature of Save B
            binaryFile.seek(offset + FileSignatureOffset)
            fileSignatureB = BytesToInt(binaryFile.read(4))

            # Determine Correct Save Offset
            saveOffset = 0
            fileSignature = fileSignatureA
            if saveIndexA == 0xFFFFFFFF and fileSignatureA == 0xFFFFFFFF:  # Save 1 is empty
                fileSignature = fileSignatureB
                saveOffset = SaveSize  # Main save is saved second
            elif saveIndexB == 0xFFFFFFFF and fileSignatureB == 0xFFFFFFFF:  # Save 2 is empty
                pass  # Save is already set to Save 1
            elif saveIndexB > saveIndexA:  # Main save is one with higher save index
                fileSignature = fileSignatureB
                saveOffset = SaveSize  # Main save is saved second

            # Extract Save Blocks
            for blockOffset in range(0, SaveSize, BlockSize):
                blockId, saveBlockData = SaveBlocks.LoadOne(binaryFile, saveOffset, blockOffset)

                if blockId in saveBlocks:
                    saveBlocks[blockId] = saveBlockData

            # Extract Boxes 20 - 22 (Save Blocks 30 & 31)
            for i in range(30, 31 + 1):
                saveBlocks[i] = SaveBlocks.LoadOne(binaryFile, 0, i * BlockSize)[1]

        return saveBlocks, fileSignature

    @staticmethod
    def LoadOne(binaryFile: BinaryIO, saveOffset: int, blockOffset: int) -> Tuple[int, List[int]]:
        offset = saveOffset + blockOffset

        # Load Block Id
        binaryFile.seek(offset + BlockIdOffset)
        blockId = BytesToInt(binaryFile.read(2))

        # Load Data
        binaryFile.seek(offset)
        saveBlockData = list(binaryFile.read(BlockDataSize))

        return blockId, saveBlockData

    @staticmethod
    def Validate(saveFile: str) -> bool:
        if not os.path.isfile(saveFile) \
                or (os.path.getsize(saveFile) != 0x20000  # 128 kb
                 and os.path.getsize(saveFile) != 0x20010):  # Flashcart 128kb
            return False

        with open(saveFile, "rb") as binaryFile:
            binaryFile.seek(FileSignatureOffset)
            if BytesToInt(binaryFile.read(4)) == 0xFFFFFFFF:  # Save 1 is empty
                # Check save 2 is good and is the first save
                if not SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2):
                    return False

                binaryFile.seek(SaveSize + SaveIndexOffset)  # Save count of actual save
                return BytesToInt(binaryFile.read(2)) == 1  # Save 2 should be the first time the game was saved

            binaryFile.seek(SaveSize + FileSignatureOffset)
            if BytesToInt(binaryFile.read(4)) == 0xFFFFFFFF:  # Save 2 is empty
                # Check save 1 is good and is the first save
                if not SaveBlocks.ValidateSave(binaryFile, 0, SaveSize):
                    return False

                binaryFile.seek(SaveIndexOffset)  # Save count of actual save
                return BytesToInt(binaryFile.read(2)) == 1  # Save 1 should be the first time the game was saved

            return SaveBlocks.ValidateSave(binaryFile, 0, SaveSize) \
                and SaveBlocks.ValidateSave(binaryFile, SaveSize, SaveSize * 2)  # Both saves must be valid for use

    @staticmethod
    def ValidateSave(binaryFile: BinaryIO, startOffset: int, endOffset: int) -> bool:
        fileSignature = 0
        saveIndex = 0
        checkedBlockIds = dict()

        for offset in range(startOffset, endOffset, BlockSize):  # Check Both Saves
            # Check Block Id
            binaryFile.seek(offset + BlockIdOffset)
            blockId = BytesToInt(binaryFile.read(2))

            if blockId not in SaveBlockNumbers:
                return False  # Not valid block Id

            if blockId in checkedBlockIds:
                return False  # Duplicate block Id

            checkedBlockIds[blockId] = True

            # Check File Signature
            binaryFile.seek(offset + FileSignatureOffset)
            currFileSignature = BytesToInt(binaryFile.read(4))

            if fileSignature == 0:  # First save block checked
                fileSignature = currFileSignature
            elif currFileSignature != fileSignature:
                return False  # File signature in save blocks didn't match

            if not Defines.IsValidFileSignature(fileSignature):
                return False  # Not valid file signature for use here

            # Check Save Index
            binaryFile.seek(offset + SaveIndexOffset)
            currSaveIndex = BytesToInt(binaryFile.read(4))

            if saveIndex == 0:  # First save block checked
                saveIndex = currSaveIndex
            elif currSaveIndex != saveIndex:
                return False  # Save indexes aren't the same for all save blocks

            # Check Checksum
            binaryFile.seek(offset + ChecksumOffset)
            checksum = BytesToInt(binaryFile.read(2))

            binaryFile.seek(offset)
            saveBlockData = list(binaryFile.read(BlockDataSize))

            if SaveBlocks.CalculateChecksum(saveBlockData, blockId) != checksum:
                return False  # Invalid checksum

        return True

    @staticmethod
    def CalculateChecksum(saveBlock: List[int], saveBlockId: int) -> int:
        if saveBlockId == 0:
            size = 0xF24
        elif saveBlockId == 4:
            size = 0xD98
        elif saveBlockId == 13:
            size = 0x450
        else:
            size = BlockDataSize

        checksum = 0
        for i in range(0, size, 4):  # Sum up all the bytes in the block
            word = BytesToInt(saveBlock[i:i + 4])
            checksum += word

            while checksum > 0xFFFFFFFF:  # Overflow
                checksum -= 0x100000000

        upperBits = (checksum >> 16) & 0xFFFF
        lowerBits = checksum & 0xFFFF
        checksum = upperBits + lowerBits
        while checksum > 0xFFFF:  # Overflow
            checksum -= 0x10000  # Bring back to 16 bit

        return checksum

    @staticmethod
    def CreateBlankDict() -> Dict[int, list]:
        return dict((key, list()) for key in SaveBlockNumbers)


    ### Code for updating save files ###
    @staticmethod
    def ReplaceAll(saveFile: str, saveBlocks: Dict[int, List[int]]) -> bool:
        if not os.path.isfile(saveFile):
            return False

        with open(saveFile, "rb+") as binaryFile:  # Read and write
            # Get Save Index of Save A
            offset = 0
            binaryFile.seek(offset + SaveIndexOffset)
            saveIndexA = BytesToInt(binaryFile.read(4))

            # Get Save Index of Save B
            offset = SaveSize
            binaryFile.seek(offset + SaveIndexOffset)
            saveIndexB = BytesToInt(binaryFile.read(4))

            # Determine Correct Save Offset
            saveOffset = 0
            if saveIndexB > saveIndexA:  # Main save is one with higher save index
                saveOffset = SaveSize  # Main save is saved second

            # Replace Relevant Saveblocks
            for blockOffset in range(0, SaveSize, BlockSize):
                offset = saveOffset + blockOffset
                binaryFile.seek(offset + BlockIdOffset)
                blockId = BytesToInt(binaryFile.read(2))

                if blockId in saveBlocks:
                    SaveBlocks.ReplaceOne(binaryFile, offset, saveBlocks[blockId], blockId)

            # Replace Saveblocks 30 & 31
            SaveBlocks.ReplaceOne(binaryFile, 30 * 0x1000, saveBlocks[30], 30)
            SaveBlocks.ReplaceOne(binaryFile, 31 * 0x1000, saveBlocks[31], 31)
            return True  # Successfully updated the save file

    @staticmethod
    def ReplaceOne(binaryFile: BinaryIO, offset: int, saveblockData: List[int], blockId: int):
        # Update Data
        binaryFile.seek(offset)
        binaryFile.write(bytes(saveblockData))

        # Update Checksum
        binaryFile.seek(offset)
        newData = binaryFile.read(BlockDataSize)
        checksum = SaveBlocks.CalculateChecksum(list(newData), blockId)
        checksum = ConvertToReverseByteList(hex(checksum))
        checksum = list(int(x, 16) for x in checksum)
        while len(checksum) < 2:
            checksum.append(0)  # Make sure checksum is always 16-bit
        binaryFile.seek(offset + ChecksumOffset)
        binaryFile.write(bytes(checksum))

