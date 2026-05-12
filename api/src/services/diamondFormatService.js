const { DIAMOND_RESPONSE_GROUPS } = require('../config/diamondConfig');

function formatDiamondRow(row) {
  const formatted = { ...row };

  Object.entries(DIAMOND_RESPONSE_GROUPS).forEach(([groupName, keys]) => {
    const group = {};

    keys.forEach((key) => {
      const value = formatted[key];
      if (value === undefined || value === null || value === '') {
        return;
      }

      group[key] = value;
      delete formatted[key];
    });

    if (Object.keys(group).length > 0) {
      formatted[groupName] = group;
    }
  });

  return formatted;
}

module.exports = {
  formatDiamondRow
};
