/**
 * Convert Unix timestamp (milliseconds) to JST (Japan Standard Time) formatted string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string in JST (YYYY/MM/DD HH:mm:ss)
 */
const formatToJST = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'N/A';
  }

  const date = new Date(timestamp);

  // Convert to JST (UTC+9)
  const jstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

  // Format: YYYY/MM/DD HH:mm:ss
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  const hours = String(jstDate.getHours()).padStart(2, '0');
  const minutes = String(jstDate.getMinutes()).padStart(2, '0');
  const seconds = String(jstDate.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Convert session data timestamps to JST format (deep copy)
 * @param {object} sessionData - Session data object with timestamps
 * @returns {object} - Session data with formatted timestamps
 */
const formatSessionDataToJST = (sessionData) => {
  if (!sessionData) return sessionData;

  // Deep copy to avoid mutating original data
  const formattedData = JSON.parse(JSON.stringify(sessionData));

  // Format main timestamps
  if (formattedData.startTime) {
    formattedData.startTime = formatToJST(formattedData.startTime);
  }

  if (formattedData.endTime) {
    formattedData.endTime = formatToJST(formattedData.endTime);
  }

  // Format quiz response timestamps
  if (formattedData.quizResponses && Array.isArray(formattedData.quizResponses)) {
    formattedData.quizResponses = formattedData.quizResponses.map(response => ({
      ...response,
      timestamp: formatToJST(response.timestamp)
    }));
  }

  // Format sensor data timestamps
  if (formattedData.sensorData && Array.isArray(formattedData.sensorData)) {
    formattedData.sensorData = formattedData.sensorData.map(data => ({
      ...data,
      timestamp: formatToJST(data.timestamp)
    }));
  }

  return formattedData;
};

module.exports = {
  formatToJST,
  formatSessionDataToJST
};
