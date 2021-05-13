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
