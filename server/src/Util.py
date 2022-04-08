from typing import List
from Defines import Defines

EOS = 255


def BytesToInt(line: List[bytes]) -> int:
    return sum(int(line[i]) << (8 * i) for i in range(len(line)))


def BytesToString(byteString: List[bytes]) -> str:
    string = ""
    # error = False
    for byte in byteString:
        byte = int(byte)
        if byte == EOS:  # End of string
            break
        elif byte in Defines.charMap:
            string += Defines.charMap[byte]
        else:
            pass
            # error = True
            # print("Error: An unidentifiable character was encountered while extracting a string. {}".format(hex(byte)))

    # if error:
    #    print("Extracted string: \"{}\"".format(string))

    return string


def ConvertToReverseByteList(string: str) -> List[str]:
    byteList = []
    inter = ''
    counter = 0

    if string.startswith("0x"):
        string = string[2:]  # Get just the byte part
    if len(string) & 1:  # Odd
        string = "0" + string  # Make the string even

    for num in string:
        if counter == 1:  # Second digit
            inter += num
            byteList = [inter] + byteList  # Append to the front
            inter = ''
            counter = 0
        else:
            inter += num
            counter += 1

    return byteList
