import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "src"))  # Needed for sub-imports

from src.Util import *


class TestBytesToInt:
    def testEmptyList(self):
        assert BytesToInt([]) == 0

    def testByte(self):
        assert BytesToInt([b"55"]) == 55

    def testHalfWord(self):
        assert BytesToInt([b"255", b"252"]) == 0xFCFF

    def testWord(self):
        assert BytesToInt([b"32", b"100", b"0", b"24"]) == 0x18006420

    def testShorterWord(self):
        assert BytesToInt([b"32", b"100", b"24", b"0"]) == 0x186420


class TestBytesToString:
    def testEmptyString(self):
        Defines.LoadCharMap()
        assert BytesToString([]) == ""
    
    def testName(self):
        Defines.LoadCharMap()
        assert BytesToString([b"205", b"223", b"217", b"224", b"221", b"255"]) == "Skeli"

    def testStringEndsAtTerminator(self):
        Defines.LoadCharMap()
        assert BytesToString([b"205", b"223", b"217", b"224", b"221", b"255", b"180"]) == "Skeli"

    def testInvalidCharactersIgnored(self):
        Defines.LoadCharMap()
        assert BytesToString([b"48", b"205", b"223", b"217", b"224", b"221", b"255"]) == "Skeli"


class TestConvertToReverseByteList:
    def testEmptyString(self):
        assert ConvertToReverseByteList("") == []

    def testByte(self):
        assert ConvertToReverseByteList("0x52") == ["52"]

    def testShortByte(self):
        assert ConvertToReverseByteList("0x2") == ["02"]

    def testHalfWord(self):
        assert ConvertToReverseByteList("0x5219") == ["19", "52"]

    def testShortHalfWord(self):
        assert ConvertToReverseByteList("0x125") == ["25", "01"]

    def testWord(self):
        assert ConvertToReverseByteList("0x12345678") == ["78", "56", "34", "12"]

    def testShortWord(self):
        assert ConvertToReverseByteList("0x8049255") == ["55", "92", "04", "08"]

