// https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
export const byteArrToHexString = (byteArray) => {
  return '0x' + Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
};

export const hexStringToByteArr = (hexString) => {
  if (hexString.startsWith('0x')) {
    hexString = hexString.substr(2);
  }
  if (hexString.length % 2 !== 0) {
    throw new TypeError('hex string must have even number of characters');
  }
  const answer = [];
  for (let i = 0; i < hexString.length; i += 2) {
    answer.push(parseInt(hexString.substr(i, 2), 16));
  }
  return answer;
};
