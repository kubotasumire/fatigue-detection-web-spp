/**
 * Convert Unix timestamp (milliseconds) to JST (Japan Standard Time) formatted string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string in JST (YYYY/MM/DD HH:mm:ss)
 */
export const formatToJST = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'N/A';
  }

  const date = new Date(timestamp);

  // Convert to JST (UTC+9)
  const jstDate = new Date(date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

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
 * Convert Unix timestamp (milliseconds) to JST ISO format
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - ISO formatted date string in JST (YYYY-MM-DDTHH:mm:ss.SSSZ)
 */
export const formatToJSTISO = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'N/A';
  }

  const date = new Date(timestamp);

  // Get JST offset (UTC+9 = 9 hours = 32400 seconds)
  const offset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(date.getTime() + offset - (date.getTimezoneOffset() * 60 * 1000));

  return jstDate.toISOString().split('Z')[0] + '+09:00';
};

/**
 * Convert session data timestamps to JST format
 * @param {object} sessionData - Session data object with timestamps
 * @returns {object} - Session data with formatted timestamps (deep copy)
 */
export const formatSessionDataToJST = (sessionData) => {
  if (!sessionData) return sessionData;

  // Deep copy to avoid mutating original data
  const formattedData = JSON.parse(JSON.stringify(sessionData));

  // Format main timestamps (replace timestamp fields with JST formatted strings)
  if (formattedData.startTime) {
    formattedData.startTime = formatToJST(formattedData.startTime);
  }

  if (formattedData.endTime) {
    formattedData.endTime = formatToJST(formattedData.endTime);
  }

  if (formattedData.timestamp) {
    formattedData.timestamp = formatToJST(formattedData.timestamp);
  }

  // Format quiz response timestamps (replace timestamp fields with JST formatted strings)
  if (formattedData.quizResponses && Array.isArray(formattedData.quizResponses)) {
    formattedData.quizResponses = formattedData.quizResponses.map(response => ({
      ...response,
      timestamp: formatToJST(response.timestamp)
    }));
  }

  // Format sensor data timestamps (replace timestamp fields with JST formatted strings)
  if (formattedData.sensorData && Array.isArray(formattedData.sensorData)) {
    formattedData.sensorData = formattedData.sensorData.map(data => ({
      ...data,
      timestamp: formatToJST(data.timestamp)
    }));
  }

  return formattedData;
};

/**
 * Generate Japanese datetime filename with session number
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} sessionId - Session ID
 * @returns {string} - Filename in format: YYYY年MM月DD日_HH時MM分SS秒_sessionNo
 */
export const generateJapaneseDatetimeFilename = (timestamp, sessionId) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return `session_${new Date().getTime()}`;
  }

  const date = new Date(timestamp);

  // Convert to JST
  const jstDate = new Date(date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  const hours = String(jstDate.getHours()).padStart(2, '0');
  const minutes = String(jstDate.getMinutes()).padStart(2, '0');
  const seconds = String(jstDate.getSeconds()).padStart(2, '0');

  // Extract session number from session ID (format: session_timestamp_random)
  const sessionNumber = sessionId ? sessionId.split('_')[1] : new Date().getTime();

  // Format: YYYY年MM月DD日_HH時MM分SS秒_sessionNo
  return `${year}年${month}月${day}日_${hours}時${minutes}分${seconds}秒_${sessionNumber}`;
};
