/**
 * name : normaliseFields.js
 * author : Shikshalokam
 * Description : Normalise configured fields in request and response payloads.
 */

const normalisedFields = new Set(
  (process.env.NORMALISED_FIELDS || "")
    .split(",")
    .map(field => field.trim())
    .filter(Boolean)
);

/**
 * Convert mongoose documents to plain objects before normalization.
 * @param {*} value
 * @returns {*}
 */
function toSerializableValue(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !Buffer.isBuffer(value) &&
    typeof value.toObject === "function"
  ) {
    return value.toObject();
  }

  return value;
}

/**
 * Normalise a string (supports both plain and CSV strings).
 * @param {String} value
 * @returns {String}
 */
function normaliseString(value) {
  return value
    .split(",")
    .map(item => item.trim().toLowerCase())
    .join(",");
}

/**
 * Normalise field values for supported data types.
 * @param {*} value
 * @returns {*}
 */
function normaliseFieldValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => normaliseFieldValue(item));
  }

  if (typeof value === "string") {
    return normaliseString(value);
  }

  return value;
}

/**
 * Normalises only root-level configured keys in an object/array payload.
 * @param {*} payload
 * @returns {*}
 */
function normaliseConfiguredFields(payload) {
  payload = toSerializableValue(payload);

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (let pointer = 0; pointer < payload.length; pointer++) {
      payload[pointer] = normaliseConfiguredFields(payload[pointer]);
    }
    return payload;
  }

  Object.keys(payload).forEach(key => {
    if (normalisedFields.has(key)) {
      payload[key] = normaliseFieldValue(payload[key]);
    }
  });

  return payload;
}

module.exports = function (req, res, next) {
  if (!normalisedFields.size) {
    return next();
  }

  req.body = normaliseConfiguredFields(req.body);

  const originalJson = res.json;
  res.json = function (payload) {
    return originalJson.call(this, normaliseConfiguredFields(payload));
  };

  const originalSend = res.send;
  res.send = function (payload) {
    if (payload && typeof payload === "object" && !Buffer.isBuffer(payload)) {
      payload = normaliseConfiguredFields(payload);
    }
    return originalSend.call(this, payload);
  };

  next();
};
