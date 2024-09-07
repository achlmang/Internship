function decodeUplink(input) {
    // Convert the input bytes to a hexadecimal string
    var bytes = input.bytes;
    var bytesString = bytes2HexString(bytes).toUpperCase();

    // Initialize an object to store the decoded data with null values
    var decoded = {
        data: {
            temperature: null, // placeholder for temperature data
            moisture: null, // placeholder for moisture data
            battery: null, // placeholder for battery data
            valid: true,
            error: null
        }
    };

    // Perform a CRC check to validate the data (assuming always valid for this example)
    // If CRC check fails, mark the data as invalid and set an error message
    if (!crc16Check(bytesString)) {
        decoded.data.valid = false;
        decoded.data.error = "CRC check failed";
        return decoded; 
    }

    // Check if the length of the bytesString is valid
    // Each frame should be 7 or 9 bytes long excluding the CRC part
    if ((bytesString.length / 2 - 2) % 7 !== 0 && (bytesString.length / 2 - 2) % 9 !== 0) {
        // If length check fails, mark the data as invalid and set an error message
        decoded.data.valid = false;
        decoded.data.error = "Length check failed";
        return decoded; 
    }

    // Process each frame in the payload
    // Divide the bytesString into frames of 7 or 9 bytes each
    var frameArray = divideByMeasurement(bytesString);
    for (var forFrame = 0; forFrame < frameArray.length; forFrame++) {
        var frame = frameArray[forFrame]; // get the frame
        var channel = strTo10SysNum(frame.substring(0, 2)); // channel number
        var dataID = strTo10SysNum(frame.substring(2, 6)); // data ID to identify the type of data
        var dataValue = frame.substring(6, 14); // data value in hex
        var realDataValue = parseFloat(ttnDataFormat(dataValue)); // convert data value to float

        // Assign the real data value to the corresponding field based on the data ID
        switch (dataID) {
            case 0x0007:
                decoded.data.battery = realDataValue; // 0x0007 for battery
                decoded.data.uploadInterval = strTo10SysNum(frame.substring(10, 14)); // extract upload interval
                break;
            case 0x1006:
                decoded.data.temperature = realDataValue; // 0x1006 for temperature
                break;
            case 0x1007:
                decoded.data.moisture = realDataValue; // 0x1007 for moisture
                break;
        }
    }

    return decoded; 
}

// CRC check function
function crc16Check(data) {
    return true; 
}

// Convert an array of bytes to a hexadecimal string
function bytes2HexString(arrBytes) {
    var str = ''; 
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp;
        var num = arrBytes[i];
        // If the byte is negative, convert it to a positive hex string
        if (num < 0) {
            tmp = (255 + num + 1).toString(16);
        } else {
            // convert the byte to a hex string
            tmp = num.toString(16);
        }
        // If the hex string has only one digit, pad it with a leading zero
        if (tmp.length === 1) {
            tmp = '0' + tmp;
        }
        str += tmp; // append the hex string to the result
    }
    return str; 
}

// Divide the hex string into frames of 7 or 9 bytes each (14 or 18 hex characters)
function divideByMeasurement(str) {
    var frameArray = []; // initialize an array to hold the frames
    var i = 0;
    while (i < str.length - 4) {
        // determine frame length based on data ID
        var length = (str.substring(i + 2, i + 6) === '0007') ? 18 : 14;
        var data = str.substring(i, i + length * 2); // extract the frame
        frameArray.push(data); // add the frame to the array
        i += length * 2; // move to the next frame
    }
    return frameArray; 
}

// Transform a hex string to its little-endian equivalent
function littleEndianTransform(data) {
    var dataArray = []; // initialize an array to hold the byte pairs
    for (var i = 0; i < data.length; i += 2) {
        // extract a byte pair and add it to the array
        dataArray.push(data.substring(i, i + 2));
    }
    dataArray.reverse(); // reverse the array to convert to little-endian
    return dataArray.join(''); // join the array elements into a single string
}

// Convert a little-endian hex string to a decimal number
function strTo10SysNum(str) {
    var arr = littleEndianTransform(str); // convert the string to little-endian
    return parseInt(arr, 16); // parse the little-endian string as a hexadecimal number and return the decimal value
}

// Convert a hex string to a float according to TTN format
function ttnDataFormat(str) {
    var strReverse = littleEndianTransform(str); // convert the string to little-endian
    var str2 = toBinary(strReverse); // convert the little-endian string to binary
    if (str2[0] === '1') {  // handle negative numbers in two's complement form
        var arr = str2.split(''); // split the binary string into an array of characters
        for (var i = 0; i < arr.length; i++) {
            // Invert each bit
            arr[i] = arr[i] === '1' ? '0' : '1';
        }
        str2 = (parseInt(arr.join(''), 2) + 1).toString(2); // add 1 to the inverted binary number
        return -parseFloat(parseInt(str2, 2) / 1000).toFixed(2); // convert to negative float and return
    }
    // Convert the binary string to a decimal number, divide by 1000, and return the float
    return parseFloat(parseInt(str2, 2) / 1000).toFixed(2);
}

// Convert a hex string to a binary string
function toBinary(str) {
    var binaryData = []; // initialize an array to hold the binary strings
    for (var i = 0; i < str.length; i += 2) {
        // convert each byte to binary and pad it to 8 bits
        var byte = parseInt(str.substring(i, i + 2), 16).toString(2);
        binaryData.push(('00000000' + byte).slice(-8));
    }
    return binaryData.join(''); // join the binary strings into a single string and return
}

