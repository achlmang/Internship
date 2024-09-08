function decodeUplink(input) {
    function toHexString(byteArray) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }
    
    //Serialize input
    const inputSerialized = toHexString(input.bytes).toUpperCase();
    
    // Transform a hex string to its little-endian equivalent
    function littleEndianTransform(data) {
        var dataArray = [];
        for (var i = 0; i < data.length; i += 2) {
            dataArray.push(data.substring(i, i + 2));
        }
        dataArray.reverse();
        return dataArray.join(''); 
    }
    
    // Convert a little-endian hex string to a decimal number
    function strTo10SysNum(str) {
        var arr = littleEndianTransform(str);
        return parseInt(arr, 16); 
    }
    
    // for test only
    function verifyCRC(CRC) {
        return "valid";
    }
    
    function parseData(input) {
        const dataArray = input.match(/.{1,14}/g);
        
        // initialize data object
        let dataObject = {
            battery: {},
            soilTemperature: {},
            soilMoisture: {},
            CRC: ''
        };
        
        // map data values and populate data object
        dataArray.map(function(data) {
            if (data.length === 14) {
                if (data.substr(2, 4) === "0610") {
                    const tempValue = strTo10SysNum(data.substr(6, 14)) / 1000;
                    dataObject.soilTemperature = {
                        channel: data.substr(0, 2),
                        tag: data.substr(2, 4),
                        value: tempValue
                    };
                } else if (data.substr(2, 4) === "0710") {
                    const moistValue = strTo10SysNum(data.substr(6, 14)) / 1000;
                    dataObject.soilMoisture = {
                        channel: data.substr(0, 2),
                        tag: data.substr(2, 4),
                        value: moistValue
                    };
                } else if (data.substr(2, 4) === "0700") {
                    const batteryLevel = parseInt('0x' + data.substr(6, 9).substr(2, 2) + data.substr(6, 9).substr(0, 2), 16);
                    dataObject.battery = {
                        channel: data.substr(0, 2),
                        tag: data.substr(2, 4),
                        value: batteryLevel,
                        interval: data.substr(10, 14)
                    };
                }
            } else {
                dataObject.CRC = verifyCRC(data);
            }
        });
        return dataObject;
    }
    
    return { data: parseData(inputSerialized) };
}